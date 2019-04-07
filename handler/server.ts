import { IContext } from 'http-mitm-proxy';

export default {
    onRequest: (ctx: IContext, callback) => {
        callback();
    }
};
