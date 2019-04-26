const { Middleware } = require('koa');
const { setRule, removeRule, getRule } = require('../../../util/rule');
const { toString } = require('../../../util/stream');

const addOrModifyRule = async (ctx) => {
    let name = ctx.params.name || '';
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    let content = await toString(ctx.req);
    let { options = {} } = await getRule(name) || {};

    await setRule({
        name, content, options
    });
    ctx.body = 'OK';
};

const addOrModifyRuleOptions = async (ctx) => {
    let name = ctx.params.name || '';
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    let options = JSON.parse(await toString(ctx.req));
    let { content = '' } = (await getRule(name)) || {};

    await setRule({
        name, content, options
    });
    ctx.body = 'OK';
};

const deleteRule = async (ctx) => {
    let { name = '' } = ctx.params;
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    await removeRule(name);
    ctx.body = 'OK';
};

module.exports = {
    addOrModifyRule,
    addOrModifyRuleOptions,
    deleteRule
};
