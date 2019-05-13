const { getAllRuleNames, getRule } = require('../../util/rule');
const isLocalhost = require('../../util/is-localhost');
const { logsByRuleName } = require('../../util/console');

const getRules = async (ctx) => {
    let selected = ctx.session.selectedRules || [];
    ctx.body = getAllRuleNames().map(k => {
        return {
            name: k,
            isSelected: selected.includes(k)
        }
    });
};

const getRuleByName = async (ctx) => {
    let rule = await getRule(ctx.params.name);
    if (rule == null) {
        ctx.throw(404);
    }
    ctx.status = 200;
    ctx.body = rule;
};

const selectRule = async (ctx) => {
    let { selectedRules = [] } = ctx.session;
    let { name = '' } = ctx.params;

    name = name.trim();
    if (!name) {
        ctx.throw(400);
    }

    if (!selectedRules.includes(name)) {
        if (await getRule(name) != null) {
            selectedRules.push(name);
            ctx.session.selectedRules = selectedRules;
        } else {
            ctx.throw(404);
        }
    }
    ctx.body = 'OK';
};

const deselectRule = async (ctx) => {
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

const deselectAllRules = async (ctx) => {
    ctx.session.selectedRules = [];
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

    let result = logsByRuleName[name].slice(from);
    if (!isLocalhost(ctx.ip)) {
        result = result.filter(k => k.ip !== ctx.ip);
    }
    ctx.body = result;
};

module.exports = {
    getRules,
    getRuleByName,
    selectRule,
    deselectRule,
    deselectAllRules,
    getLogsByRule
};
