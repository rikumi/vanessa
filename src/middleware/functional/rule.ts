import * as vm from 'vm';
import { Middleware } from 'koa';
import * as compose from 'koa-compose';

import { getRule } from '../../util/rule';

const ruleMiddleware: Middleware = async (ctx, next) => {
    let selectedRules: string[] = ctx.session.selectedRules || [];
    
    let scripts = (await Promise.all(selectedRules.map(getRule))).filter(k => k);
    
    let middleware = [];

    for (let script of scripts) {
        let sandbox = vm.createContext({
            ...global,
            use: middleware.push.bind(middleware)
        });

        vm.runInContext(script.content, sandbox);
    }

    let composed = compose(middleware);
    await composed(ctx, next);
};

export default ruleMiddleware;