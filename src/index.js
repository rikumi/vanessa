const net = require('net');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');
const compose = require('koa-compose');
const Koa = require('koa');

const generateCert = require('./certs');
const clientEndMiddleware = require('./middleware/client-side/client-end');
const serverEndMiddleware = require('./middleware/server-side/server-end');
const clientProxyMiddleware = require('./middleware/client-side/proxy');
const serverProxyMiddleware = require('./middleware/server-side/proxy');

/**
 * *Vanessa Core*
 * 
 * Vanessa Core contains a customized class derived from Koa, and
 * part of the builtin middleware that is required for a practical
 * man-in-the-middle proxy.
 * 
 * This part of middleware is divided into client-side and server-
 * side.
 * 
 * The whole middleware stack is composed by client-side middleware
 * at bottom, middleware provided with Vanessa#use() in the middle,
 * and server-side middleware at the top.
 */
const composeMiddleware = (middleware) => [

    // Initialize the context and request options
    clientEndMiddleware,

    // Initialize the proxy-chaining options
    // and detect system proxy settings as default
    clientProxyMiddleware,

    // Middleware provided by user
    ...middleware,

    // Use proxy-chaining options to prepare requests through a remote proxy
    serverProxyMiddleware,

    // Make requests and awaiting for responses
    serverEndMiddleware
];

module.exports = class Vanessa extends Koa {
    listen(...args) {
        this.connectRequests = {};
        this.httpServer = http.createServer();
        this.httpServer.on('connect', this.onConnectRequest.bind(this));
        this.httpServer.on('request', this.onPlainRequest.bind(this, false));
        this.wsServer = new WebSocket.Server({ server: this.httpServer });
        this.wsServer.on('error', (e) => this.emit('error', e));
        this.wsServer.on('connection', (ws, req) => {
            ws.upgradeReq = req;
            this._onWebSocketServerConnect.call(this, false, ws, req);
        });

        return this.httpServer.listen(...args);
    }

    close() {
        this.httpServer.close();
        delete this.httpServer;
    }

    onConnectRequest(req, socket, head) {
        // we need first byte of data to detect if request is SSL encrypted
        if (!head || head.length === 0) {
            socket.once('data', this.onConnectData.bind(this, req, socket));
            socket.write('HTTP/1.1 200 OK\r\n');
            return socket.write('\r\n');
        } else {
            this.onConnectData(req, socket, head);
        }
    }

    async onConnectData(req, socket, head) {
        const makeConnection = (port) => {
            // open a TCP connection to the remote host
            let conn = net.connect(
                {
                    port: port,
                    allowHalfOpen: true
                },
                () => {
                    // create a tunnel between the two hosts
                    conn.on('finish', () => {
                        socket.destroy();
                    });
                    let connectKey = conn.localPort + ':' + conn.remotePort;
                    this.connectRequests[connectKey] = req;
                    socket.pipe(conn);
                    conn.pipe(socket);
                    socket.emit('data', head);
                    conn.on('end', () => {
                        delete this.connectRequests[connectKey];
                    });
                    return socket.resume();
                }
            );
            conn.on('error', (err) => {
                if (err.code !== 'ECONNRESET') {
                    this.emit('error', err);
                }
            });
            socket.on('error', (err) => {
                if (err.code !== 'ECONNRESET') {
                    this.emit('error', err);
                }
            });
        };

        socket.pause();

        /*
        * Detect TLS from first bytes of data
        * Inspired from https://gist.github.com/tg-x/835636
        * used heuristic:
        * - an incoming connection using SSLv3/TLSv1 records should start with 0x16
        * - an incoming connection using SSLv2 records should start with the record size
        *   and as the first record should not be very big we can expect 0x80 or 0x00 (the MSB is a flag)
        * - everything else is considered to be unencrypted
        */
        if (head[0] == 0x16 || head[0] == 0x80 || head[0] == 0x00) {
            let hostname = req.url.split(':', 2)[0];
            let { cert, key } = await generateCert(hostname);

            let options = {
                hosts: [hostname],
                cert, key
            };

            let httpsServer = https.createServer(options);
            httpsServer.on('error', (e) => this.emit('error', e));
            httpsServer.on('connect', this.onConnectRequest.bind(this));
            httpsServer.on('request', this.onPlainRequest.bind(this, true));
            let wssServer = new WebSocket.Server({ server: httpsServer });
            wssServer.on('connection', (ws, req) => {
                ws.upgradeReq = req;
                this._onWebSocketServerConnect.call(this, true, ws, req);
            });
            httpsServer.listen({
                port: 0,
                host: this.httpServer.address().address
            }, () => makeConnection(httpsServer.address().port));
        } else {
            return makeConnection(this.httpServer.address().port);
        }
    }

    onPlainRequest(isSSL, req, res) {
        const fn = compose(composeMiddleware(this.middleware));
        if (!this.listenerCount('error')) this.on('error', this.onerror);

        const ctx = this.createContext(req, res);
        const protocol = isSSL ? 'https' : 'http';

        ctx.rawRequest = this.connectRequests[req.socket.remotePort + ':' + req.socket.localPort] || req;

        Object.defineProperties(ctx.request, {
            protocol: {
                value: protocol,
                writable: true
            },
            ip: {
                get() {
                    return ctx.rawRequest.connection.remoteAddress;
                }
            }
        });

        return this.handleRequest(ctx, fn);
    }

    _onWebSocketServerConnect(isSSL, ws, upgradeReq) {
        let { _socket } = ws;
        let ctx = {
            isSSL: isSSL,
            connectRequest: this.connectRequests[_socket.remotePort + ':' + _socket.localPort] || {},
            clientToProxyWebSocket: ws,
            proxyToServerWebSocket: null
        };
        ctx.clientToProxyWebSocket.on('message', this._onWebSocketFrame.bind(this, ctx, 'message', false));
        ctx.clientToProxyWebSocket.on('ping', this._onWebSocketFrame.bind(this, ctx, 'ping', false));
        ctx.clientToProxyWebSocket.on('pong', this._onWebSocketFrame.bind(this, ctx, 'pong', false));
        ctx.clientToProxyWebSocket.on('error', this._onWebSocketError.bind(this, ctx));
        ctx.clientToProxyWebSocket.on('close', this._onWebSocketClose.bind(this, ctx, false));

        let remoteSocket = ctx.clientToProxyWebSocket._socket;
        remoteSocket.pause();

        let url;
        if (upgradeReq.url == '' || /^\//.test(upgradeReq.url)) {
            let hostPort = Vanessa.parseHostAndPort(upgradeReq);
            url = (ctx.isSSL ? 'wss' : 'ws') + '://' + hostPort.host + (hostPort.port ? ':' + hostPort.port : '') + upgradeReq.url;
        } else {
            url = upgradeReq.url;
        }
        let ptosHeaders = {};
        let ctopHeaders = upgradeReq.headers;
        for (let key in ctopHeaders) {
            if (key.indexOf('sec-websocket') !== 0) {
                ptosHeaders[key] = ctopHeaders[key];
            }
        }
        ctx.proxyToServerWebSocket = new WebSocket(url, { headers: ptosHeaders });
        ctx.proxyToServerWebSocket.on('message', this._onWebSocketFrame.bind(this, ctx, 'message', true));
        ctx.proxyToServerWebSocket.on('ping', this._onWebSocketFrame.bind(this, ctx, 'ping', true));
        ctx.proxyToServerWebSocket.on('pong', this._onWebSocketFrame.bind(this, ctx, 'pong', true));
        ctx.proxyToServerWebSocket.on('error', this._onWebSocketError.bind(this, ctx));
        ctx.proxyToServerWebSocket.on('close', this._onWebSocketClose.bind(this, ctx, true));
        ctx.proxyToServerWebSocket.on('open', () => {
            if (ctx.clientToProxyWebSocket.readyState === WebSocket.OPEN) {
                remoteSocket.resume();
            }
        });
    }

    _onWebSocketFrame(ctx, type, fromServer, data, flags) {
        let destWebSocket = fromServer ? ctx.clientToProxyWebSocket : ctx.proxyToServerWebSocket;
        if (destWebSocket.readyState === WebSocket.OPEN) {
            switch (type) {
                case 'message':
                    destWebSocket.send(data, flags);
                    break;
                case 'ping':
                    destWebSocket.ping(data, false);
                    break;
                case 'pong':
                    destWebSocket.pong(data, false);
                    break;
            }
        } else {
            this._onWebSocketError(ctx);
        }
    }

    _onWebSocketClose(ctx, closedByServer, code, message) {
        if (!ctx.closedByServer && !ctx.closedByClient) {
            ctx.closedByServer = closedByServer;
            ctx.closedByClient = !closedByServer;

            if (code >= 1004 && code <= 1006) code = 1001;
            
            if (ctx.clientToProxyWebSocket.readyState !== ctx.proxyToServerWebSocket.readyState) {
                if (ctx.clientToProxyWebSocket.readyState === WebSocket.CLOSED && ctx.proxyToServerWebSocket.readyState === WebSocket.OPEN) {
                    ctx.proxyToServerWebSocket.close(code, message);
                } else if (ctx.proxyToServerWebSocket.readyState === WebSocket.CLOSED && ctx.clientToProxyWebSocket.readyState === WebSocket.OPEN) {
                    ctx.clientToProxyWebSocket.close(code, message);
                }
            }
        }
    }

    _onWebSocketError(ctx) {
        if (ctx.proxyToServerWebSocket && ctx.clientToProxyWebSocket.readyState !== ctx.proxyToServerWebSocket.readyState) {
            if (ctx.clientToProxyWebSocket.readyState === WebSocket.CLOSED && ctx.proxyToServerWebSocket.readyState === WebSocket.OPEN) {
                ctx.proxyToServerWebSocket.close();
            } else if (ctx.proxyToServerWebSocket.readyState === WebSocket.CLOSED && ctx.clientToProxyWebSocket.readyState === WebSocket.OPEN) {
                ctx.clientToProxyWebSocket.close();
            }
        }
    }

    static parseHostAndPort(req, defaultPort) {
        let host = req.headers.host;
        if (!host) {
            return null;
        }
        let hostPort = Vanessa.parseHost(host, defaultPort);

        // this handles paths which include the full url. This could happen if it's a proxy
        let m = req.url.match(/^http:\/\/([^\/]*)\/?(.*)$/);
        if (m) {
            let parsedUrl = url.parse(req.url);
            hostPort.host = parsedUrl.hostname;
            hostPort.port = parsedUrl.port;
            req.url = parsedUrl.path;
        }

        return hostPort;
    }

    static parseHost(hostString, defaultPort) {
        let m = hostString.match(/^http:\/\/(.*)/);
        if (m) {
            let parsedUrl = url.parse(hostString);
            return {
                host: parsedUrl.hostname,
                port: parsedUrl.port
            };
        }

        let hostPort = hostString.split(':');
        let host = hostPort[0];
        let port = hostPort.length === 2 ? +hostPort[1] : defaultPort;

        return {
            host: host,
            port: port
        };
    }
}