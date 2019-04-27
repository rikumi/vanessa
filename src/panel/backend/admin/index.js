const Router = require('koa-router');
const isLocalhost = require('is-localhost');
const getInfo = require('./info');
const { addOrModifyRule, addOrModifyRuleOptions, deleteRule } = require('./rule');

const adminRouter = new Router();

adminRouter.use(async (ctx, next) => {
    if (!isLocalhost(ctx.ip)) {
        return ctx.throw(403);
    }
    await next();
});

adminRouter.get('/info', getInfo);
adminRouter.post('/rule/:name', addOrModifyRule);
adminRouter.delete('/rule/:name', deleteRule);

module.exports = adminRouter;
