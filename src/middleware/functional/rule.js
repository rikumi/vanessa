const vm = require('vm');
const { Middleware } = require('koa');
const compose = require('koa-compose');

const { getRule } = require('../../util/rule');

const ruleMiddleware = async (ctx, next) => {
    let selectedRules = ctx.session.selectedRules || [];
    
    let scripts = (await Promise.all(selectedRules.map(getRule))).filter(k => k);
    
    let middleware = [];

    for (let script of scripts) {
        let sandbox = vm.createContext(global);
        sandbox.module = {};
        sandbox.exports = sandbox.module.exports = (ctx, next) => next();
        vm.runInContext(script, sandbox);
        middleware.push(sandbox.module.exports);
    }

    ctx.summary.rules = selectedRules;
    let composed = compose(middleware);
    await composed(ctx, next);
};

module.exports = ruleMiddleware;