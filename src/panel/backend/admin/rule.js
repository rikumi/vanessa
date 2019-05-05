const { Middleware } = require('koa');
const { setRule, removeRule, getRule } = require('../../../util/rule');
const { toString } = require('../../../util/stream');
const { logsByRuleName } = require('../../../util/console');

const addOrModifyRule = async (ctx) => {
    let name = ctx.params.name || '';
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    let content = await toString(ctx.req);

    await setRule(name, content);
    ctx.body = 'OK';
};

const deleteRule = async (ctx) => {
    let { name = '' } = ctx.params;
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    await removeRule(name);
    delete logsByRuleName[name];
    ctx.body = 'OK';
};

const getLogsByRule = async (ctx) => {
    let { name = '', from = 0 } = ctx.params;
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    } else if (!logsByRuleName[name]) {
        ctx.body = [];
        return;
    }
    
    ctx.body = logsByRuleName[name].slice(from);
};

module.exports = {
    addOrModifyRule,
    deleteRule,
    getLogsByRule
};
