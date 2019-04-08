import { IContext } from 'http-mitm-proxy';
import PACAgent = require('pac-proxy-agent');
import HTTPAgent = require('http-proxy-agent');
import HTTPSAgent = require('https-proxy-agent');
import SOCKSAgent = require('socks-proxy-agent');
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
            let type: string;
            if (/(^pac\+)|(\.pac$)/i.test(proxy)) {
                type = 'PAC';
            } else {
                let match = /^(PROXY|HTTP|HTTPS|SOCKS)(\s+|:\/\/)(.*)$/i.exec(proxy);
                if (match) {
                    type = match[1].toUpperCase().replace('PROXY', 'HTTP');
                    proxy = match[3];
                }
            }
            proxy = proxy.trim();

            if (type === 'HTTP') {
                req.agent = <any>new HTTPAgent(proxy.replace(/\/$/, ''));
            } else if (type === 'HTTPS') {
                req.agent = <any>new HTTPSAgent(proxy.replace(/\/$/, ''));
            } else if (type === 'SOCKS') {
                req.agent = <any>new SOCKSAgent(proxy.replace(/\/$/, ''));
            } else if (type === 'PAC') {
                req.agent = <any>new PACAgent(proxy);
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