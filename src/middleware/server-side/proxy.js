const { Middleware } = require('koa');
const http = require('http');
const https = require('https');
const PACAgent = require('pac-proxy-agent');
const HTTPAgent = require('http-proxy-agent');
const HTTPSAgent = require('https-proxy-agent');
const SOCKSAgent = require('socks-proxy-agent');

const agentPool = {
    pac: {},
    http: {},
    https: {},
    socks: {}
};

const defaultHTTPSAgent = new https.Agent();
const defaultHTTPAgent = new http.Agent();

const serverProxyMiddleware = async (ctx, next) => {
    let agent;
    let { proxy } = ctx.request;
    if (proxy.pac) {
        let key = proxy.pac + '|' + ctx.hostname;
        agent = agentPool.pac[key];
        if (!agent) {
            agent = agentPool.pac[key] = new PACAgent(proxy.pac);

            // When a PAC file tells DIRECT, PACAgent will call `tls.connect` with customizable options,
            // but no hostname is provided, resulting in missing SNI, in which case the remove server
            // may not send back the proper certificate.

            // We override the `connect` method of the agent to provide a proper hostname in options
            // to be passed into `tls.connect`.
            let connect = agent.callback.bind(agent);
            agent.callback = (r, opts, fn) => {
                return connect(r, Object.assign(opts || {}, {
                    servername: ctx.hostname
                }), fn);
            };
        }
        ctx.summary.proxy = { type: 'PAC', address: proxy.pac };
    } else if (proxy.socks) {
        agent = agentPool.socks[proxy.socks];
        if (!agent) {
            agent = agentPool.socks[proxy.socks] = new SOCKSAgent(proxy.socks);
        }
        ctx.summary.proxy = { type: 'SOCKS', address: proxy.socks };
    } else if (ctx.protocol === 'https') {
        if (proxy.https) {
            agent = agentPool.https[proxy.https];
            if (!agent) {
                agent = agentPool.https[proxy.https] = new HTTPSAgent(proxy.https);
            }
            ctx.summary.proxy = { type: 'HTTPS', address: proxy.https };
        } else {
            agent = defaultHTTPSAgent;
        }
    } else if (ctx.protocol === 'http') {
        if (proxy.http) {
            agent = agentPool.http[proxy.http];
            if (!agent) {
                agent = agentPool.http[proxy.http] = new HTTPAgent(proxy.http);
            }
            ctx.summary.proxy = { type: 'HTTP', address: proxy.http };
        } else {
            agent = defaultHTTPAgent;
        }
    }
    ctx.requestOptions.agent = agent;
    
    await next();
};

module.exports = serverProxyMiddleware;
