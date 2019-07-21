const os = require('os');
const send = require('koa-send');
const p2re = require('path-to-regexp');
const { getStreamOperations } = require('../../util/stream');
const AgingQueue = require('../../util/aging');
const recentContexts = new AgingQueue(1024);

module.exports = async (ctx, next) => {

    // Keep track of third party requests only (apart from panel requests)
    recentContexts.push(ctx);
    
    ctx.test = (pattern) => {
        if (pattern.constructor.name === 'RegExp') {
            return pattern.exec(ctx.url);
        } else if (typeof pattern === 'string') {
            let keys = [], result = null;

            let protocolReg = /^([^\/]+)\/\//;
            let protocolExpect = protocolReg.exec(pattern);
            let protocolMatch = !protocolExpect || protocolExpect[1] === protocolReg.exec(ctx.url)[1];

            if (!protocolMatch) {
                return null;
            }

            pattern = pattern.replace(/^(.*?)\/\//, '').replace(/^\//, ':host/');
            let url = ctx.url.replace(/^(.*?)\/\//, '').replace(/[?#].*$/, '');

            pattern = p2re(pattern, keys);
            result = pattern.exec(url);

            return result && Object.assign(...keys.map((k, i) => ({ [k.name]: result[i + 1] })));
        }

        throw new Error('Pattern must be RegExp or String.');
    }

    ctx.send = async (file) => {
        await send(ctx, file.replace(/^~/, os.homedir()), { root: '/' });
    }

    Object.assign(ctx.request, getStreamOperations(ctx, 'request'));
    Object.assign(ctx.response, getStreamOperations(ctx, 'response'));
    await next();
}

module.exports.recentContexts = recentContexts;
