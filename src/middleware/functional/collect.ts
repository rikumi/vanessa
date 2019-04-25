import { Middleware } from 'koa';
import { steal } from '../../util/stream';

const collectMiddleware: Middleware = async (ctx, next) => {
    steal(ctx.req)
        .then((data: Buffer) => {
            ctx.request['body'] = data;
        })
        .catch();

    await next();
    
    steal(ctx.res)
        .then((data: Buffer) => {
            ctx.response.body = data;
        })
        .catch();
};

export default collectMiddleware;
