const { Middleware } = require('koa');
const http = require('http');
const https = require('https');
const PACAgent = require('pac-proxy-agent');
const HTTPAgent = require('http-proxy-agent');
const HTTPSAgent = require('https-proxy-agent');
const SOCKSAgent = require('socks-proxy-agent');

const serverProxyMiddleware = async (ctx, next) => {
    let agent;
    let { proxy } = ctx.request;
    if (proxy.pac) {
        agent = new PACAgent(proxy.pac);

        // When a PAC file tells DIRECT, PACAgent will call `tls.connect` with customizable options,
        // but no hostname is provided, resulting in missing SNI, in which case the remove server
        // may not send back the proper certificate.

        // We override the `connect` method of the agent to provide a proper hostname in options
        // to be passed into `tls.connect`.
        let connect = agent.callback.bind(agent);
        agent.callback = (r, opts, fn) => {
            return connect(
                r,
                Object.assign(opts || {}, {
                    servername: ctx.hostname
                }),
                fn
            );
        };
        ctx.summary.proxy = { type: 'PAC', address: proxy.pac };
    } else if (proxy.socks) {
        agent = new SOCKSAgent(proxy.socks);
        ctx.summary.proxy = { type: 'SOCKS', address: proxy.socks };
    } else if (ctx.protocol === 'https') {
        if (proxy.https) {
            agent = new HTTPSAgent(proxy.https);
            ctx.summary.proxy = { type: 'HTTPS', address: proxy.https };
        } else {
            agent = new https.Agent();
        }
    } else if (ctx.protocol === 'http') {
        if (proxy.http) {
            agent = new HTTPAgent(proxy.http);
            ctx.summary.proxy = { type: 'HTTP', address: proxy.http };
        } else {
            agent = new http.Agent();
        }
    }
    ctx.requestOptions.agent = agent;
    
    await next();
};

module.exports = serverProxyMiddleware;
