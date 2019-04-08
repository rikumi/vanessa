import { IContext } from 'http-mitm-proxy';
import store from '../config/store';
import { runInContext, Context } from 'vm';
import createSandbox from '../sandbox';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';

const defaultScriptData = `
// Place your transforms of request before awaiting
// if (req.realHost = 'test.qq.com') req.realHost = 'localhost:8080';

// Await response to come
await res;

// Place your transforms of response after awaiting
// res.data.replace(/Bing/g, 'Google');
`.trim();

const getScript = (name: string) => {
    let dir = path.dirname(store.path);
    let file = path.join(dir, name + '.js');
    if (fs.existsSync(file)) {
        return fs.readFileSync(file).toString();
    } else {
        fs.writeFileSync(file, defaultScriptData);
        return defaultScriptData;
    }
}

const runInAsyncContext = (script: string, context: Context) => {
    script = '(async () => {\n' + script + '\n})()';
    try {
        runInContext(script, context);
    } catch (e) {
        console.error(e);
    }
};

export default {
    onRequest: (ctx: IContext, callback) => {
        let clientAddr = ctx.clientToProxyRequest.connection.address()['address'];
        let sessions = store.all;
        let session = sessions[clientAddr] || {};
        let expires = +moment().startOf('day').add(2, 'weeks');
        if (session.expires !== expires) {
            session.expires = expires;
            store.all = sessions;
        }

        let selectedScript = session.selectedScript || 'default';
        let selectedScriptContent = getScript(selectedScript);
        let globalScriptContent = getScript('global');

        let evalContext = createSandbox(ctx);
        
        runInAsyncContext(globalScriptContent, evalContext);
        runInAsyncContext(selectedScriptContent, evalContext);

        callback();
    }
};
