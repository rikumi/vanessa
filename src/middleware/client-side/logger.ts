import { Middleware } from 'koa';

const loggerMiddleware: Middleware = async (ctx, next) => {
    console.log('→', ctx.request.url);
    await next();
    console.log('←', ctx.response.status);
};

export default loggerMiddleware;