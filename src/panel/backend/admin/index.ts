import * as Router from 'koa-router';
import * as isLocalhost from 'is-localhost';
import getInfo from './info';
import { addOrModifyRule, addOrModifyRuleOptions, deleteRule } from './rule';

const adminRouter = new Router();

adminRouter.use(async (ctx, next) => {
    if (!isLocalhost(ctx.ip)) {
        return ctx.throw(403);
    }
    await next();
});

adminRouter.get('/info', getInfo);
adminRouter.post('/rule/:name', addOrModifyRule);
adminRouter.put('/rule/:name', addOrModifyRuleOptions);
adminRouter.delete('/rule/:name', deleteRule);

export default adminRouter;
