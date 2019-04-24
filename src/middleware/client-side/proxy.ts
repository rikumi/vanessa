import { Middleware } from 'koa';
import * as cp from 'child_process';

const getSystemProxy = () => {
    let res: any = {};

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
    const getHostPort = (str) => /(.*)(\/([^\/]|$)|$)/.exec(str)[1];

    res.http = HTTPProxy ?
        HTTPProxy + ':' + HTTPPort :
        getHostPort(env.HTTP_PROXY || env.http_proxy);

    res.https = HTTPSProxy ?
        HTTPSProxy + ':' + HTTPSPort :
        getHostPort(env.HTTPS_PROXY || env.https_proxy);

    res.socks = SOCKSProxy ?
        SOCKSProxy + ':' + SOCKSPort :
        getHostPort(env.ALL_PROXY || env.all_proxy);

    if (pac) res.pac = pac;
    
    return res;
}

const clientProxyMiddleware: Middleware = async (ctx, next) => {
    ctx.proxy = getSystemProxy();
    await next();
};

export default clientProxyMiddleware;
