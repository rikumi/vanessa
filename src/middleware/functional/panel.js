const fs = require('fs');
const path = require('path');
const Parcel = require('parcel');
const Router = require('koa-router');
const compose = require('koa-compose');
const static = require('koa2-static-middleware');

const router = new Router();

const backendRouter = require('../../panel/backend');
router.use('/api', backendRouter.routes(), backendRouter.allowedMethods());

const frontendDir = path.join(__dirname, '..', '..', 'panel', 'frontend');
const outDir = path.join(frontendDir, 'dist');
const cacheDir = path.join(frontendDir, '.cache');
const entryFile = path.join(frontendDir, 'index.html');
const bundler = new Parcel(entryFile, { outDir, cacheDir, hmrHostname: 'localhost' });
const bundled = bundler.bundle();

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