const Router = require('koa-router');
const compose = require('koa-compose');
const static = require('koa2-static-middleware');
const { argv } = require('yargs');
const isLocalhost = require('../../util/is-localhost');

const isVanessaHostAndPort = (hostPort) => {
    let [host, port] = hostPort.split(':');
    return isLocalhost(host) && (port || 80) == (argv.port || 8099)
}

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
        if (ctx.protocol === 'http' && ctx.session && ctx.session.isCertInstalledAndTrusted) {
            ctx.redirect(ctx.url.replace('http:', 'https:'));
        } else {
            if (ctx.protocol === 'https') ctx.session.isCertInstalledAndTrusted = true;
            await routerMiddleware(ctx, async () => {});
        }
    } else {
        if (!ctx.host || isVanessaHostAndPort(ctx.host) || !ctx.session.isCertInstalledAndTrusted) {
            ctx.redirect('http://vanes.sa/');
        } else {
            await next();
        }
    }
};

module.exports = panelMiddleware;