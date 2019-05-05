const AgingQueue = require('./aging');
const logsByRuleName = {};

const log = (ctx, rule, type, ...content) => {
    ctx.summary.logs = ctx.summary.logs || {};
    ctx.summary.logs[rule] = ctx.summary.logs[rule] || [];
    ctx.summary.logs[rule].push({ type, content });

    logsByRuleName[rule] = logsByRuleName[rule] || new AgingQueue(1024);
    logsByRuleName[rule].push({ ctxId: ctx.id, type, content });
};

module.exports = {
    log,
    logsByRuleName
};