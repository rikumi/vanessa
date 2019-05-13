const { NodeVM } = require('vm2');
const { Middleware } = require('koa');
const compose = require('koa-compose');

const { getRule } = require('../../util/rule');
const { log } = require('../../util/console');
const createSandbox = require('../../sandbox');

const ruleMiddleware = async (ctx, next) => {
    let selectedRules = ctx.session.selectedRules || [];
    
    let scripts = (await Promise.all(
        selectedRules.map(
            async (name) => ({ name, content: await getRule(name) })
        )
    )).filter(k => k.content != null);

    ctx.session.selectedRules = scripts.map(k => k.name);
    
    let middleware = [];

    for (let script of scripts) {
        let sandbox = new NodeVM({
            console: 'redirect',
            sandbox: createSandbox(ctx, script.name),
            require: {
                external: ['*'],
                builtin: ['*'],
                context: 'sandbox'
            }
        });

        const trace = (e) => {
            log(ctx, script.name, 'trace', e.stack);
        }

        const asyncTryCatch = (fun) => {
            // Catch errors during middleware execution
            return async (...args) => {
                try {
                    return await fun(...args);
                } catch (e) {
                    trace(e);
                }
            }
        }

        try {
            sandbox.on('console.log', log.bind(null, ctx, script.name, 'log'));
            sandbox.on('console.error', log.bind(null, ctx, script.name, 'error'));
            sandbox.on('console.trace', trace);
            let mw = sandbox.run(script.content);
            if (Array.isArray(mw)) {
                for (let submw of mw) {
                    middleware.push(asyncTryCatch(mw));
                }
            } else if (mw) {
                middleware.push(asyncTryCatch(mw));
            }
        } catch (e) {
            // Catch errors during module evaluation
            trace(e);
        }
    }

    ctx.summary.rules = selectedRules;
    let composed = compose(middleware);
    await composed(ctx, next);
};

module.exports = ruleMiddleware;