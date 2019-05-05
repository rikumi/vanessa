const Router = require('koa-router');
const isLocalhost = require('../../../util/is-localhost');
const getInfo = require('./info');
const { addOrModifyRule, addOrModifyRuleOptions, deleteRule, getLogsByRule } = require('./rule');

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
adminRouter.get('/log/:name', getLogsByRule);
adminRouter.get('/log/:name/~:from', getLogsByRule);

module.exports = adminRouter;
