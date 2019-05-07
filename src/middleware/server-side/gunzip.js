const { Middleware } = require('koa');
const { createGunzip } = require('zlib');

const gunzipMiddleware = async (ctx, next) => {
    ctx.request.header['accept-encoding'] = 'gzip';
    await next();
    let encoding = ctx.response.get('content-encoding');
    if (encoding && encoding.toLowerCase() == 'gzip') {
        ctx.summary.gzip = { enabled: true };
        ctx.response.set('content-encoding', null);
        ctx.response._body = ctx.response.body.pipe(createGunzip());
    }
};

module.exports = gunzipMiddleware;
