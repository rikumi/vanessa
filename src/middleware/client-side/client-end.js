const { inspect } = require('util');
const chalk = require('chalk');
const collect = require('collect-all');
const intoStream = require('into-stream');
const stringify = require('json-stringify-safe');
const qs = require('querystring');

const clientEndMiddleware = async (ctx, next) => {
    for (let h in ctx.request.header) {
        if (/^proxy\-/i.test(h)) {
            delete ctx.request.header[h];
        }
    }

    let _host = ctx.request.host;
    let _querystring = ctx.request.querystring;

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
        },
        query: {
            value: qs.parse(_querystring),
            writable: true
        },
        querystring: {
            get() {
                return qs.stringify(ctx.request.query);
            },
            set(querystring) {
                ctx.request.query = qs.parse(querystring);
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
    ctx.requestOptions = {};
    ctx.rawReq = ctx.req;

    try {
        await next();

        if (ctx.response.body == null) {
            ctx.status = 404;
            ctx.response.body = 'Vanessa - 404 Not Found';
        } else {
            if (typeof ctx.response.body.pipe !== 'function') {
                if (!Buffer.isBuffer(ctx.response.body)) {
                    if (typeof ctx.response.body !== 'string') {
                        if (
                            typeof ctx.response.body === 'object' &&
                            !Array.isArray(ctx.response.body)
                        ) {
                            ctx.response.body = { ...ctx.response.body };
                        }
                        ctx.response.body = stringify(ctx.response.body, (k, v) => /^_/.test(k) ? undefined : v);
                    }
                    ctx.response.body = Buffer.from(ctx.response.body);
                }
                ctx.response.body = intoStream(ctx.response.body);
            }
            ctx.response.body.pipe(collect((buffer) => (ctx.response.finalBody = buffer)));
        }
    } catch (e) {
        ctx.body = e.stack;
        ctx.status = typeof e.code === 'number' ? e.code : 500;
        ctx.logs = ctx.logs || [];
        ctx.logs.push({ type: 'error', content: e.stack });
    }
}

module.exports = clientEndMiddleware;