import { Middleware } from 'koa';

const loggerMiddleware: Middleware = async (ctx, next) => {
    let { method, url, header: reqHeaders } = ctx.request;
    ctx.logs.request = { method, url, headers: reqHeaders };

    await next();

    let { status, message, headers: resHeaders } = ctx.response; 
    ctx.logs.response = { status, message, headers: resHeaders };
};

export default loggerMiddleware;