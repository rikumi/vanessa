import { IContext } from 'http-mitm-proxy';
import PACAgent = require('pac-proxy-agent');
import HTTPAgent = require('http-proxy-agent');
import HTTPSAgent = require('https-proxy-agent');
import SOCKSAgent = require('socks-proxy-agent');
import { getStreamOperations, overwriteStream } from './stream';
import { URL } from 'url';
import vanessa from '..';

export default function getRequest(ctx: IContext) {
    let req = ctx.proxyToServerRequestOptions;
    return {
        get localIP() {
            // SSL client-to-proxy request is forwarded by http-mitm-proxy
            // The raw request before forwarding is stored in `ctx.connectRequest`.
            let rawReq = ctx.isSSL ? ctx['connectRequest'] : ctx.clientToProxyRequest;
            return rawReq.connection.remoteAddress;
        },
        get realHost() {
            return req.host;
        },
        set realHost(host) {
            let [hostname, port] = host.split(':');
            req.host = hostname;
            if (port) {
                (<number>req.port) = parseInt(port)
            }
        },
        get virtualHost() {
            return (req.headers.host || req.host);
        },
        set virtualHost(host) {
            req.headers.host = host;
        },
        get port() {
            return req.port;
        },
        set port(port) {
            req.port = port;
        },
        get url() {
            let scheme = ctx.isSSL ? 'https:' : 'http:';
            let host = req.headers.host || req.host;
            let defaultPort = scheme === 'https:' ? 443 : 80;
            let port = req.port !== defaultPort && req.port && ':' + req.port || '';
            return scheme + '//' + host + port + req.path;
        },
        set url(url: string | URL) {
            if (typeof url === 'string') {
                url = new URL(url);
                if (url.protocol === 'https') {
                    ctx.isSSL = true;
                    req.agent = vanessa.httpsAgent;
                } else {
                    ctx.isSSL = false;
                    req.agent = vanessa.httpAgent;
                }
                req.headers.host = req.host = url.hostname;
                (<number | null>req.port) = url.port ? parseInt(url.port) : (ctx.isSSL ? 80 : 443);
                req.path = url.pathname + (url.search ? '?' + url.search : '') + url.hash;
            }
        },
        get method() {
            return req.method;
        },
        set method(method) {
            req.method = method;
        },
        get path() {
            return req.path;
        },
        set path(path) {
            req.path = path;
        },
        get headers() {
            return req.headers;
        },
        set headers(headers) {
            req.headers = headers;
        },
        get proxy() {
            let agent = req.agent;
            if (agent instanceof PACAgent) {
                return 'PAC ' + agent['uri'];
            }
            if (agent instanceof SOCKSAgent) {
                return 'SOCKS ' + agent['uri'];
            }
            if (agent instanceof HTTPSAgent) {
                return 'HTTPS ' + agent['uri'];
            }
            if (agent instanceof HTTPAgent) {
                return 'HTTP ' + agent['uri'];
            }
            return null;
        },
        set proxy(proxy) {
            let type: string;
            if (/(^pac\+)|(\.pac$)/i.test(proxy)) {
                type = 'PAC';
            } else {
                let match = /(PROXY|HTTP|HTTPS|SOCKS)(\s+|:\/\/)(.+)$/i.exec(proxy);
                if (match) {
                    type = match[1].toUpperCase().replace('PROXY', 'HTTP');
                    proxy = type.toLowerCase() + '://' + match[3].replace(/\/$/, '');
                }
            }
            if (type === 'HTTP' || type === 'HTTPS') {
                if (ctx.isSSL) {
                    req.agent = <any>new HTTPSAgent(proxy.replace(/\/$/, ''));
                } else {
                    req.agent = <any>new HTTPAgent(proxy.replace(/\/$/, ''));
                }
            } else if (type === 'SOCKS') {
                req.agent = <any>new SOCKSAgent(proxy.replace(/\/$/, ''));
            } else if (type === 'PAC') {
                let agent: any = new PACAgent(proxy);

                // When a PAC file tells DIRECT, PACAgent will call `tls.connect` with customizable options,
                // but no hostname is provided, resulting in missing SNI, in which case the remove server
                // may not send back the proper certificate.

                // We override the `connect` method of the agent to provide a proper hostname in options
                // to be passed into `tls.connect`.
                let connect = agent.callback.bind(agent);
                agent.callback = (r, opts, fn) => {
                    return connect(r, Object.assign(opts || {}, {
                        servername: req.headers.host
                    }), fn);
                };

                req.agent = agent;
            }
        },
        get data() {
            return getStreamOperations(ctx.addRequestFilter.bind(ctx));
        },
        set data(data) {
            overwriteStream(ctx.addRequestFilter.bind(ctx), data);
        }
    }
}