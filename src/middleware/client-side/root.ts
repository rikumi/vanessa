import { Middleware } from 'koa';
import { inspect } from 'util';
import chalk from 'chalk';

const clientSideMiddleware: Middleware = async (ctx, next) => {
    ctx.req.pause();

    for (let h in ctx.request.header) {
        if (/^proxy\-/i.test(h)) {
            delete ctx.request.header[h];
        }
    }

    Object.defineProperties(ctx.request, {
        url: {
            get() {
                return ctx.request.protocol + '://' +
                    ctx.request.header.host +
                    ctx.request.path + 
                    ctx.request.search
            },
            set(url) {
                let { protocol, host, pathname, search } = new URL(url);
                ctx.request.protocol = protocol;
                ctx.request.header.host = host;
                ctx.request.path = pathname;
                ctx.request.search = search;
            }
        },
        method: {
            value: ctx.request.method,
            writable: true
        },
        host: {
            value: ctx.request.header.host,
            writable: true
        }
    });
    
    ctx.logs = new Proxy({}, {
        set(_, key, value) {
            _[key] = value;
            let message = chalk.bgCyan.black(`[${key.toString()}]`) + ` ${
                inspect(value, false, 0, true).replace(/\s*\n\s*/g, ' ')
            }`;
            
            console.log(message);
            return true;
        }
    });
    ctx.requestOptions = {};
    ctx.requestFilters = [];
    ctx.responseFilters = [];

    await next();

    for (let filter of ctx.responseFilters) {
        ctx.response.body = ctx.response.body.pipe(filter);
    }
}

export default clientSideMiddleware;