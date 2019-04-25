import { Middleware, Context } from 'koa';
import AgingQueue from '../../util/aging';

const recentContexts = new AgingQueue<Context>(1024);

const counterMiddleware: Middleware = async (ctx, next) => {
    recentContexts.push(ctx);
    await next();
};

export default counterMiddleware;
export { recentContexts };