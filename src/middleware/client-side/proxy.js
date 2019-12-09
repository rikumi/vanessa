const cp = require('child_process');

const normalizeUrl = (proxyUrl) => {
    if (!proxyUrl) return null;

    const regex = /^(\w*):\/+/;
    const protocol = (regex.exec(proxyUrl) || [])[1].toLowerCase() || 'http';
    if (!['http', 'https', 'socks', 'socks4', 'socks5'].includes(protocol)) {
        protocol = 'http';
    }
    return proxyUrl.replace(regex, protocol + '://').replace(/\/$/, '');
}

const getSystemProxy = () => {
    let res = {};

    try {
        cp.execSync('scutil --proxy')
            .toString().trim()
            .split('\n')
            .slice(1, -1)
            .forEach((k) => {
                let [key, value] = k.split(' : ');
                res[key.trim()] = value.trim();
            });
    } catch (e) {}

    let {
        HTTPProxy, HTTPPort,
        HTTPSProxy, HTTPSPort,
        SOCKSProxy, SOCKSPort,
        ProxyAutoConfigURLString: pac
    } = res;

    res = {};

    const { env } = process;

    return normalizeUrl(
        pac ||
        HTTPProxy && 'http://' + HTTPProxy + ':' + HTTPPort ||
        HTTPS_PROXY && 'https://' + HTTPSProxy + ':' + HTTPSPort ||
        SOCKSProxy && 'socks://' + SOCKSProxy + ':' + SOCKSPort ||
        env.HTTP_PROXY || env.http_proxy ||
        env.HTTPS_PROXY || env.https_proxy ||
        env.ALL_PROXY || env.all_proxy || ''
    );
}

const clientProxyMiddleware = async (ctx, next) => {
    ctx.request.proxy = getSystemProxy();

    Object.defineProperty(ctx, 'proxy', {
        get: () => ctx.request.proxy,
        set: (proxy) => ctx.request.proxy = proxy
    })
    
    await next();
};

module.exports = clientProxyMiddleware;
