const { createGunzip } = require('zlib');

const gunzipMiddleware = async (ctx, next) => {
    await next();
    let encoding = ctx.response.get('content-encoding');
    if (encoding && encoding.toLowerCase() == 'gzip') {
        ctx.summary.gzip = { enabled: true };
        ctx.response._body = ctx.response.body.pipe(createGunzip());
    }
};

module.exports = gunzipMiddleware;
