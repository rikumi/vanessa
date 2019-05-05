const { NodeVM } = require('vm2');
const { Middleware } = require('koa');
const compose = require('koa-compose');

const { getRule } = require('../../util/rule');
const { log } = require('../../util/console');

const ruleMiddleware = async (ctx, next) => {
    let selectedRules = ctx.session.selectedRules || [];
    
    let scripts = (await Promise.all(
        selectedRules.map(
            async (name) => ({ name, content: await getRule(name) })
        )
    )).filter(k => k.content != null);
    
    let middleware = [];

    for (let script of scripts) {
        let sandbox = new NodeVM({
            console: 'redirect',
            sandbox: {}
        });
        
        sandbox.on('console.log', log.bind(null, ctx, script.name, 'log'));
        sandbox.on('console.error', log.bind(null, ctx, script.name, 'error'));

        const trace = (e) => {
            log(ctx, script.name, 'trace', e.stack);
        }
        sandbox.on('console.trace', trace);

        try {
            let mw = sandbox.run(script.content);
            if (mw) {
                middleware.push(mw);
            }
        } catch (e) {
            trace(e);
        }
    }

    ctx.summary.rules = selectedRules;
    let composed = compose(middleware);
    await composed(ctx, next);
};

module.exports = ruleMiddleware;