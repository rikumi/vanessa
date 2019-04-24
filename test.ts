import Vanessa from './index';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', e => { throw e });

let vanessa = new Vanessa();
vanessa.use(async (ctx, next) => {
    console.log('→', ctx.request.url);
    await next();
    console.log('←', ctx.response.status);
})
vanessa.listen(8672);