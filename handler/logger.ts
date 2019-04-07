import { IContext } from 'http-mitm-proxy';

const log = (...args) => {
    console.log(args.join(' ').slice(0, process.stdout.columns));
};

export default {
    onRequest: (ctx: IContext, callback) => {
        const { clientToProxyRequest: creq } = ctx;

        let url = (ctx.isSSL ? 'https://' : 'http://') + creq.headers.host + creq.url;
        log('→', creq.method, url);
        callback();
    },
    onResponse: (ctx: IContext, callback) => {
        const { serverToProxyResponse: sres } = ctx;

        log('←', sres.statusCode, sres.statusMessage);
        callback();
    }
};
