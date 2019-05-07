const { Middleware } = require('koa');
const { inspect } = require('util');
const chalk = require('chalk');

const clientEndMiddleware = async (ctx, next) => {
    ctx.req.pause();

    for (let h in ctx.request.header) {
        if (/^proxy\-/i.test(h)) {
            delete ctx.request.header[h];
        }
    }

    let _host = ctx.request.host;

    Object.defineProperties(ctx.request, {
        url: {
            get() {
                return ctx.request.protocol + '://' + ctx.request.header.host + ctx.request.path + ctx.request.search;
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
            get() {
                return _host;
            },
            set(host) {
                _host = host;
                let ipPort = /^[\d\.]+(:(\d+))?$/.exec(host);
                if (ipPort && parseInt(ipPort[2]) !== 443) {
                    ctx.request.protocol = 'http';
                }
            }
        }
    });

    Object.defineProperties(ctx, {
        host: {
            get() {
                return ctx.request.host;
            },
            set(host) {
                ctx.request.host = host;
            }
        }
    });
    
    ctx.summary = {};
    ctx.log = (key, value) => {
        let message = chalk.bgCyan.black(`[${ key }]`) +
            ` ${ inspect(value, false, 0, true).replace(/\s*\n\s*/g, ' ') }`;
        console.log(message);
    }
    ctx.requestOptions = {};
    ctx.requestFilters = [];
    ctx.responseFilters = [];

    await next();

    for (let filter of ctx.responseFilters) {
        ctx.response.body = ctx.response.body.pipe(filter);
    }
}

module.exports = clientEndMiddleware;