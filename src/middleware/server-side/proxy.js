const http = require('http');
const https = require('https');
const PACAgent = require('pac-proxy-agent');
const HTTPAgent = require('http-proxy-agent');
const HTTPSAgent = require('https-proxy-agent');
const SOCKSAgent = require('socks-proxy-agent');
const isLocalhost = require('../../util/is-localhost');
const { argv } = require('yargs');
const { port: vanessaPort = 8099 } = argv;

const agentPool = {
    pac: {},
    http: {},
    https: {},
    socks: {}
};

const defaultHTTPSAgent = new https.Agent();
const defaultHTTPAgent = new http.Agent();

/**
 * Detects whether a url is vanessa itself.
 * @param {string} url The proxy url to be detected
 */
const isSelf = (url) => {
    let [, host, port = 8080] = /\/\/([^:\/]+):?(\d*)/.exec(url) || [];
    return isLocalhost(host) && parseInt(port) === vanessaPort;
}

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
        ctx.summary.proxy = { pac: proxy.pac };
    } else if (proxy.socks) {
        agent = agentPool.socks[proxy.socks];
        if (!agent) {
            agent = agentPool.socks[proxy.socks] = new SOCKSAgent(proxy.socks);
        }
        ctx.summary.proxy = { socks: proxy.socks };
    } else {
        // Use HTTP Proxy in advance of HTTPS proxy
        // Skip if the upstream proxy is vanessa itself.
        if (proxy.http && !isSelf(proxy.http)) {
            agent = agentPool.http[proxy.http];
            if (!agent) {
                agent = agentPool.http[proxy.http] = new HTTPAgent(proxy.http);
            }
            ctx.summary.proxy = { http: proxy.http };
        } else if (proxy.https && !isSelf(proxy.https)) {
            agent = agentPool.https[proxy.https];
            if (!agent) {
                agent = agentPool.https[proxy.https] = new HTTPSAgent(proxy.https);
            }
            ctx.summary.proxy = { https: proxy.https };
        } else {
            agent = ctx.protocol === 'http' ? defaultHTTPAgent : defaultHTTPSAgent;
        }
    }
    
    ctx.requestOptions.agent = agent;
    
    await next();
};

module.exports = serverProxyMiddleware;
