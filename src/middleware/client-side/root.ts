import { Middleware } from 'koa';

const clientSideMiddleware: Middleware = async (ctx, next) => {
    ctx.req.pause();

    for (let h in ctx.request.headers) {
        if (/^proxy\-/i.test(h)) {
            delete ctx.request.headers[h];
        }
    }

    Object.defineProperties(ctx.request, {
        url: {
            get() {
                return ctx.request.protocol + '://' +
                    ctx.request.headers.host +
                    ctx.request.path + 
                    ctx.request.search
            },
            set(url) {
                let { protocol, host, pathname, search } = new URL(url);
                ctx.request.protocol = protocol;
                ctx.request.headers.host = host;
                ctx.request.path = pathname;
                ctx.request.search = search;
            }
        },
        method: {
            value: ctx.request.method,
            writable: true
        },
        host: {
            value: ctx.request.headers.host,
            writable: true
        }
    });
    
    ctx.requestFilters = [];
    ctx.responseFilters = [];

    await next();

    for (let filter of ctx.responseFilters) {
        ctx.response.body = ctx.response.body.pipe(filter);
    }
}

export default clientSideMiddleware;