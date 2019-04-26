const { Middleware } = require('koa');

const errorMiddleware = async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        ctx.summary.error = e;
        ctx.body = e.stack;
        // ctx.redirect('https://vanes.sa/show-error/' + ctx.id);
    }
};

module.exports = errorMiddleware;
