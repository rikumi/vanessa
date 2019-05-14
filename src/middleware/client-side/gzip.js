const { createGzip } = require('zlib');

const gunzipMiddleware = async (ctx, next) => {
    await next();
    if (ctx.summary.gzip && ctx.summary.gzip.enabled) {
        ctx.response._body = ctx.response.body.pipe(createGzip());
    }
};

module.exports = gunzipMiddleware;
