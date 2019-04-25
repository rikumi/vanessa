import { Middleware } from 'koa';
import * as http from 'http';
import * as https from 'https';
import * as PACAgent from 'pac-proxy-agent';
import * as HTTPAgent from 'http-proxy-agent';
import * as HTTPSAgent from 'https-proxy-agent';
import * as SOCKSAgent from 'socks-proxy-agent';

const serverProxyMiddleware: Middleware = async (ctx, next) => {
    let agent: any;
    if (ctx.proxy.pac) {
        agent = new PACAgent(ctx.proxy.pac);
        
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
        ctx.summary.proxy = { type: 'PAC', address: ctx.proxy.pac };

    } else if (ctx.proxy.socks) {
        agent = new SOCKSAgent(ctx.proxy.socks);
        ctx.summary.proxy = { type: 'SOCKS', address: ctx.proxy.socks };

    } else if (ctx.protocol === 'https') {
        if (ctx.proxy.https) {
            agent = new HTTPSAgent(ctx.proxy.https);
            ctx.summary.proxy = { type: 'HTTPS', address: ctx.proxy.https };
        } else {
            agent = new https.Agent();
        }

    } else if (ctx.protocol === 'http') {
        if (ctx.proxy.http) {
            agent = new HTTPAgent(ctx.proxy.http);
            ctx.summary.proxy = { type: 'HTTP', address: ctx.proxy.http };
        } else {
            agent = new http.Agent();
        }
    }
    ctx.requestOptions.agent = agent;
    
    await next();
};

export default serverProxyMiddleware;
