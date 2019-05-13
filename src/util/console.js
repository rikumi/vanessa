const util = require('util');
const AgingQueue = require('./aging');
const logsByRuleName = {};

const log = (ctx, rule, type, ...content) => {
    if (content.length > 1 || typeof content[0] !== 'string') {
        content = content.map((k) => util.inspect(k));
    }
    content = content.join(' ');

    ctx.summary.logs = ctx.summary.logs || [];
    ctx.summary.logs.push({ rule, type, content });

    logsByRuleName[rule] = logsByRuleName[rule] || new AgingQueue(1024);
    logsByRuleName[rule].push({ ctxId: ctx.id, ip: ctx.ip, type, content });
};

module.exports = {
    log,
    logsByRuleName
};