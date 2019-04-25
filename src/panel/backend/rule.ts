import { Middleware } from 'koa';
import { getAllRuleNames, getRule } from '../../util/rule';

const getRules: Middleware = async (ctx) => {
    ctx.body = getAllRuleNames();
};

const getSelectedRules: Middleware = async (ctx) => {
    ctx.body = ctx.session.selectedRules || [];
};

const getRuleByName: Middleware = async (ctx) => {
    let rule = await getRule(ctx.params.name);
    if (!rule) {
        ctx.throw(404);
    }
    ctx.body = rule;
};

const selectRule: Middleware = async (ctx) => {
    let { selectedRules = [] } = ctx.session;
    let { name = '' } = ctx.params;

    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    if (!selectedRules.includes(name)) {
        if (await getRule(name)) {
            selectedRules.push(name);
        } else {
            ctx.throw(404);
        }
    }
    ctx.body = 'OK';
};

const deselectRule: Middleware = async (ctx) => {
    let { selectedRules = [] } = ctx.session;
    let { name = '' } = ctx.params;

    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    if (selectedRules.includes(name)) {
        ctx.session.selectedRules = selectedRules.filter((k) => k !== name);
    }
    ctx.body = 'OK';
};

const deselectAllRules: Middleware = async (ctx) => {
    ctx.session.selectedRules = [];
    ctx.body = 'OK';
};

export {
    getRules,
    getRuleByName,
    getSelectedRules,
    selectRule,
    deselectRule,
    deselectAllRules
};
