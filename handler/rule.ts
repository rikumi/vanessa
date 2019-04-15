import { IContext } from 'http-mitm-proxy';
import { runInContext, Context } from 'vm';
import createSandbox from '../sandbox';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const defaultScriptData = `
// Place your transforms of request before awaiting
// if (req.realHost = 'test.qq.com') req.realHost = 'localhost:8080';

// Await response to come
await res;

// Place your transforms of response after awaiting
// res.data.replace(/Bing/g, 'Google');
`.trim();

const getScript = (name: string) => {
    let root = path.join(homedir(), '.vanessa');
    if (!fs.existsSync(root)) fs.mkdirSync(root);

    let file = path.join(root, name + '.js');

    if (fs.existsSync(file)) {
        return fs.readFileSync(file).toString();
    } else {
        fs.writeFileSync(file, defaultScriptData);
        return defaultScriptData;
    }
}

const runInAsyncContext = (script: string, context: Context) => {
    script = '(async () => {\n' + script + '\n})().catch(console.error)';
    try {
        runInContext(script, context);
    } catch (e) {
        console.error(e);
    }
};

export default {
    onRequest: (ctx: IContext, callback) => {
        // SSL client-to-proxy request is forwarded by http-mitm-proxy
        // The raw request before forwarding is stored in `ctx.connectRequest`.
        let rawReq = ctx.isSSL ? ctx['connectRequest'] : ctx.clientToProxyRequest;
        let address = rawReq.connection.remoteAddress.replace(/:/g, '-').replace(/^--1$/, 'localhost');
        let builtinScriptContent = getScript('builtin');
        let globalScriptContent = getScript('global');
        let selectedScriptContent = getScript(address);

        let evalContext = createSandbox(ctx);
        
        runInAsyncContext(builtinScriptContent, evalContext);
        runInAsyncContext(globalScriptContent, evalContext);
        runInAsyncContext(selectedScriptContent, evalContext);

        callback();
    }
};
