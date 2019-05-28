const { createUnzip } = require('zlib');
const { decompressStream } = require('iltorb');

const decompressMiddleware = async (ctx, next) => {
    await next();
    let encoding = ctx.response.headers['content-encoding'];
    if (['gzip', 'deflate', 'br'].includes(encoding)) {
        let unzip = encoding === 'br' ? decompressStream() : createUnzip();
        ctx.response._body = ctx.response.body.pipe(unzip);
        ctx.response.remove('content-encoding');
    }
};

module.exports = decompressMiddleware;
