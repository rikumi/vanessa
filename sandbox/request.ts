import { IContext } from 'http-mitm-proxy';
import * as PACAgent from 'pac-proxy-agent';
import * as HTTPAgent from 'http-proxy-agent';
import * as HTTPSAgent from 'https-proxy-agent';
import * as SOCKSAgent from 'socks-proxy-agent';
import { getStreamOperations, overwriteStream } from './stream';
import { URL } from 'url';
import vanessa from '..';

export default function getRequest(ctx: IContext) {
    let rawReq = ctx.clientToProxyRequest;
    let req = ctx.proxyToServerRequestOptions;
    return {
        get localIP() {
            return rawReq.connection.address()['address'];
        },
        get realHost() {
            return req.host;
        },
        set realHost(host) {
            req.host = host;
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
            return (ctx.isSSL ? 'https://' : 'http://') +
                (req.headers.host || req.host) +
                (req.port ? ':' + req.port : '') +
                req.path;
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
            let match = /^(PAC|PROXY|HTTP|HTTPS|SOCKS)\s+(.*)$/i.exec(proxy);
            let type: string;
            if (match) {
                type = match[1].toUpperCase().replace('PROXY', 'HTTP');
                proxy = match[2];
            } else {
                proxy = proxy.trim();
                if (/(^pac\+)|(\.pac$)/i.test(proxy)) {
                    type = 'PAC';
                } else {
                    type = 'HTTP';
                }
            }
            if (type === 'HTTP') {
                req.agent = new HTTPAgent(proxy);
            } else if (type === 'HTTPS') {
                req.agent = new HTTPSAgent(proxy);
            } else if (type === 'SOCKS') {
                req.agent = new SOCKSAgent(proxy);
            } else if (type === 'PAC') {
                req.agent = new PACAgent(proxy);
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