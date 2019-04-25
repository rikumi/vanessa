import { Middleware } from 'koa';

const summaryMiddleware: Middleware = async (ctx, next) => {
    let { method, url, header: reqHeaders } = ctx.request;
    ctx.summary.request = { method, url, headers: reqHeaders };
    ctx.log('request', ctx.summary.request);

    await next();

    let { status, message, headers: resHeaders } = ctx.response; 
    ctx.summary.response = { status, message, headers: resHeaders };
    ctx.log('response', ctx.summary.response);
};

export default summaryMiddleware;