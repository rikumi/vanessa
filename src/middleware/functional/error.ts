import { Middleware } from 'koa';

const errorMiddleware: Middleware = async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        ctx.summary.error = e;
        ctx.body = e.stack;
        // ctx.redirect('https://vanes.sa/show-error/' + ctx.id);
    }
};

export default errorMiddleware;
