const { Middleware } = require('koa');
const { steal } = require('../../util/stream');

const collectMiddleware = async (ctx, next) => {
    steal(ctx.req)
        .then((data) => {
            ctx.request.body = data;
        })
        .catch();

    await next();
    
    steal(ctx.res)
        .then((data) => {
            ctx.response.body = data;
        })
        .catch();
};

module.exports = collectMiddleware;
