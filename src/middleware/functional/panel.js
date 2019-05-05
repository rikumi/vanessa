const Router = require('koa-router');
const compose = require('koa-compose');
const static = require('koa2-static-middleware');

const router = new Router();

const backendRouter = require('../../panel/backend');
router.use('/api', backendRouter.routes(), backendRouter.allowedMethods());

// Build and watch
const outDir = require('../../build');
const frontendMiddleware = static(outDir);
router.get('/*', frontendMiddleware);

const routerMiddleware = compose([
    router.routes(),
    router.allowedMethods()
]);

const panelMiddleware = async (ctx, next) => {
    if (ctx.host === 'vanes.sa') {
        if (ctx.protocol === 'http') {
            ctx.redirect(ctx.url.replace('http:', 'https:'));
        } else {
            await routerMiddleware(ctx, async () => {});
        }
    } else {
        await next();
    }
};

module.exports = panelMiddleware;