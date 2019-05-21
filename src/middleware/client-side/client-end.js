const { inspect } = require('util');
const chalk = require('chalk');

const clientEndMiddleware = async (ctx, next) => {
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
    
    ctx.phase = 'request';
    ctx.summary = {};
    ctx.requestOptions = {};
    ctx.rawReq = ctx.req;

    await next();
}

module.exports = clientEndMiddleware;