const summaryMiddleware = async (ctx, next) => {
    let { method, url, header: reqHeaders } = ctx.request;
    ctx.summary.request = { method, url, headers: reqHeaders };

    await next();

    let { status, message, headers: resHeaders } = ctx.response; 
    ctx.summary.response = { status, message, headers: resHeaders };
};

module.exports = summaryMiddleware;