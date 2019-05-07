const p2re = require('path-to-regexp');
const { getStreamOperations } = require('../../util/stream');

module.exports = async (ctx, next) => {
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
            let url = ctx.url.replace(/^(.*?)\/\//, '');

            if (!/[?#].*$/.test(pattern)) {
                url = url.replace(/[?#].*$/, '');
            }

            pattern = p2re(pattern, keys);
            result = pattern.exec(url);

            return result && Object.assign(...keys.map((k, i) => ({ [k.name]: result[i + 1] })));
        }

        throw new Error('Pattern must be RegExp or String.');
    }

    Object.assign(ctx.req, getStreamOperations([].push.bind(ctx.requestFilters)));
    Object.assign(ctx.res, getStreamOperations([].push.bind(ctx.responseFilters)));
    await next();
}