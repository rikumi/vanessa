const toString = require('raw-body');
const { setRule, removeRule } = require('../../../util/rule');
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

module.exports = {
    addOrModifyRule,
    deleteRule
};
