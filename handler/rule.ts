import { IContext } from 'http-mitm-proxy';
import store from '../config/store';
import { runInContext } from 'vm';
import createSandbox from '../sandbox';

export default {
    onRequest: (ctx: IContext, callback) => {
        let sessions = store.get('sessions');
        let rules = store.get('rules');

        let clientAddr = ctx.clientToProxyRequest.connection.address()['address'];
        let session = sessions[clientAddr] || {};
        let selectedScriptID = session.selectedScriptID || 'default';
        let selectedScript = rules[selectedScriptID] || '';
        let globalScript = rules['global'] || '';

        let evalContext = createSandbox(ctx);
        runInContext(globalScript, evalContext);
        runInContext(selectedScript, evalContext);

        callback();
    }
};
