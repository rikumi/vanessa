import { Middleware } from 'koa';
import { createGunzip } from 'zlib';

const gunzipMiddleware: Middleware = async (ctx, next) => {
    ctx.request.headers['accept-encoding'] = 'gzip';
    await next();
    let encoding = ctx.response.get('content-encoding');
    if (encoding && encoding.toLowerCase() == 'gzip') {
        ctx.response.set('content-encoding', null);
        ctx.responseFilters.push(createGunzip());
    }
};

export default gunzipMiddleware;
