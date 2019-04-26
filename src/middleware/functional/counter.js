const { Middleware, Context } = require('koa');
const AgingQueue = require('../../util/aging');

const recentContexts = new AgingQueue(1024);

const counterMiddleware = async (ctx, next) => {
    recentContexts.push(ctx);
    await next();
};

module.exports = counterMiddleware;
module.exports.recentContexts = recentContexts;