import * as compose from 'koa-compose';
import * as Router from 'koa-router';
import backendRouter from '../../panel/backend';
import { Middleware } from 'koa';

const router = new Router();

router.use('/api', backendRouter.routes(), backendRouter.allowedMethods());
router.get('/', (ctx) => ctx.body = 'Can you hear me?');

const routerMiddleware = compose([
    router.routes(),
    router.allowedMethods()
]);

const panelMiddleware: Middleware = async (ctx, next) => {
    if (ctx.host === 'vanes.sa') {
        await routerMiddleware(<any>ctx, async () => {});
    } else {
        await next();
    }
};

export default panelMiddleware;