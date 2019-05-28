const qs = require('querystring');

const verifyMiddleware = async (ctx, next) => {
    try {
        let { trustedHost = [] } = ctx.session;
        if (trustedHost.includes(ctx.host)) {
            ctx.requestOptions.rejectUnauthorized = false;
        }
        await next();
    } catch (e) {
        if (/unable to verify the first certificate/.test(e.message.toLowerCase())) {
            ctx.body = `<!DOCTYPE html>\n<pre>Error: Invalid Certificate\n\n<br><a href="//vanes.sa/api/trust/${ctx.id}">Trust ${ctx.host} (DANGEROUS)</a></pre>`;
        }
    }
};

module.exports = verifyMiddleware;
