const getBanner = (ctx, trusted) => `<!DOCTYPE html>
<div style="position:fixed;top:0;left:0;right:0;z-index:9999999;padding:5px 10px;background:${trusted ? '#f80' : '#f00'};color:#fff;text-align:center;font:13px monospace">
    VANESSA WARNING: The host <b>${ctx.host}</b> cannot provide a secure certificate.
    ${
        trusted ?
        `You chose to trust this site. <a style="color:#fff;font:inherit;font-weight:bold" href="//vanes.sa/api/distrust/${ctx.id}">Distrust</a> <a style="color:#fff;font:inherit" href="#" onclick="this.parentElement.remove()">×</a>` :
        `<a style="color:#fff;font:inherit;font-weight:bold;text-decoration:underline" href="//vanes.sa/api/trust/${ctx.id}">Always trust (DANGEROUS)</a>`
    }
</div>
`;

const insecureBannerMiddleware = async (ctx, next) => {
    let { method, url, header: reqHeaders } = ctx.request;
    ctx.summary.request = { method, url, headers: reqHeaders };

    await next();

    if (!ctx.response.isSecure) {
        let isForceTrusted = (ctx.session.trustedHosts || []).includes(ctx.host);
        if (/html/.test(ctx.response.headers['content-type'])) {
            ctx.response.prepend(getBanner(ctx, isForceTrusted));
        } else {
            if (!isForceTrusted && !ctx.get('referer')) {
                // Block insecure content unrelated to HTML
                ctx.throw(503, `${ctx.host} has an invalid certificate. Visit https://vanes.sa/api/trust/${ctx.host} to always trust it (can be dangerous).`);
            }
        }
    }
};

module.exports = insecureBannerMiddleware;
