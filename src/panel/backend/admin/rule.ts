import { Middleware } from 'koa';
import { setRule, removeRule, getRule } from '../../../util/rule';
import { toString } from '../../../util/stream';

const addOrModifyRule: Middleware = async (ctx) => {
    let name: string = ctx.params.name || '';
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

const addOrModifyRuleOptions: Middleware = async (ctx) => {
    let name: string = ctx.params.name || '';
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

const deleteRule: Middleware = async (ctx) => {
    let { name = '' } = ctx.params;
    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    await removeRule(name);
    ctx.body = 'OK';
};

export {
    addOrModifyRule,
    addOrModifyRuleOptions,
    deleteRule
};
