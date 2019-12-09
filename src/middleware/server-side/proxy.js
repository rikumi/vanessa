const http = require('http');
const https = require('https');
const PACAgent = require('pac-proxy-agent');
const HTTPAgent = require('http-proxy-agent');
const HTTPSAgent = require('https-proxy-agent');
const SOCKSAgent = require('socks-proxy-agent');
const isLocalhost = require('../../util/is-localhost');
const { argv } = require('yargs');
const { port: vanessaPort = 8099 } = argv;

const defaultHTTPAgent = new http.Agent();
const httpAgentPool = {
    pac: {},
    http: {},
    https: {},
    socks: {}
};

const defaultHTTPSAgent = new https.Agent();
const httpsAgentPool = {
    pac: {},
    http: {},
    https: {},
    socks: {}
};

/**
 * Detects whether a url is vanessa itself.
 * @param {string} url The proxy url to be detected
 */
const isVanessaSelf = (url) => {
    let [, host, port = 8080] = /\/\/([^:\/]+):?(\d*)/.exec(url) || [];
    return isLocalhost(host) && parseInt(port) === vanessaPort;
}

const serverProxyMiddleware = async (ctx, next) => {
    let agent;
    let { proxy } = ctx.request;

    const isHttp = ctx.protocol === 'http';
    const RequestAgent = isHttp ? HTTPAgent : HTTPSAgent;
    const agentPool = isHttp ? httpAgentPool : httpsAgentPool;
    const defaultAgent = isHttp ? defaultHTTPAgent : defaultHTTPSAgent;

    if (proxy) {
        const proxyUrl = new URL(proxy);

        if (proxyUrl.pathname.length > 1) { // PAC
            agent = agentPool.pac[proxy];
            if (!agent) {
                agent = agentPool.pac[proxy] = new PACAgent(proxy);
            }
        } else if (proxyUrl.protocol.startsWith('socks')) {
            agent = agentPool.socks[proxy];
            if (!agent) {
                agent = agentPool.socks[proxy] = new SOCKSAgent(proxy);
            }
        } else if (proxyUrl.protocol.startsWith('https') && !isVanessaSelf(proxy)) {
            agent = agentPool.https[proxy];
            if (!agent) {
                agent = agentPool.https[proxy] = new RequestAgent(proxy);
            }
        } else if (proxyUrl.protocol.startsWith('http') && !isVanessaSelf(proxy)) {
            agent = agentPool.http[proxy];
            if (!agent) {
                agent = agentPool.http[proxy] = new RequestAgent(proxy);
            }
        } else {
            agent = defaultAgent;
        }
    }

    ctx.requestOptions.agent = agent;

    await next();
};

module.exports = serverProxyMiddleware;
