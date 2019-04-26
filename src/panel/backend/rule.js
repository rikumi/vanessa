const { getAllRuleNames, getRule } = require('../../util/rule');

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
    if (!rule) {
        ctx.throw(404);
    }
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
        if (await getRule(name)) {
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

module.exports = {
    getRules,
    getRuleByName,
    selectRule,
    deselectRule,
    deselectAllRules
};
