const compose = require('koa-compose');
const Router = require('koa-router');
const backendRouter = require('../../panel/backend');
const { Middleware } = require('koa');

const router = new Router();

router.use('/api', backendRouter.routes(), backendRouter.allowedMethods());
router.get('/', (ctx) => ctx.body = 'Can you hear me?');

const routerMiddleware = compose([
    router.routes(),
    router.allowedMethods()
]);

const panelMiddleware = async (ctx, next) => {
    if (ctx.host === 'vanes.sa') {
        await routerMiddleware(ctx, async () => {});
    } else {
        await next();
    }
};

module.exports = panelMiddleware;