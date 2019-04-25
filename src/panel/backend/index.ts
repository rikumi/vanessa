import * as Router from 'koa-router';
import adminRouter from './admin';
import downloadCert from './cert';

import {
    getRules,
    getRuleByName,
    selectRule,
    deselectRule,
    getSelectedRules,
    deselectAllRules
} from './rule';

import {
    getHistory,
    getHistoryDetail,
    getRequestBody,
    getResponseBody
} from './history';

const backendRouter = new Router();

backendRouter.use('/admin', adminRouter.routes(), adminRouter.allowedMethods());
backendRouter.get('/cert', downloadCert);
backendRouter.get('/rules', getRules);
backendRouter.get('/rules/:name', getRuleByName);
backendRouter.get('/rule', getSelectedRules);
backendRouter.get('/rule/+:name', selectRule);
backendRouter.get('/rule/-all', deselectAllRules);
backendRouter.get('/rule/-:name', deselectRule);
backendRouter.get('/history', getHistory);
backendRouter.get('/history/~:from', getHistory);
backendRouter.get('/history/:id', getHistoryDetail);
backendRouter.get('/history/:id/req', getRequestBody);
backendRouter.get('/history/:id/res', getResponseBody);

export default backendRouter;
