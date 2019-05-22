const panelMiddleware = async (ctx, next) => {
    if (ctx.protocol === 'https') {
        ctx.session.isCertInstalledAndTrusted = true;
    } else if (!ctx.session || !ctx.session.isCertInstalledAndTrusted) {
        if (ctx.host.toLowerCase() !== 'vanes.sa') {
            return ctx.redirect('http://vanes.sa/')
        }
    }
    await next();
};

module.exports = panelMiddleware;
