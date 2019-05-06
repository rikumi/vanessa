const { Middleware } = require('koa');

const errorHandler = (e, ctx) => {
    if (ctx) {
        ctx.body = e.stack;
        ctx.status = typeof e.code === 'number' ? e.code : 500;
        ctx.summary.logs = ctx.summary.logs || [];
        ctx.summary.logs.push({ type: 'error', content: e.stack });
    } else {
        console.error(e);
    }
};

const errorMiddleware = async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        errorHandler(e, ctx);
    }
};

module.exports = {
    errorMiddleware,
    errorHandler
};
