const Router = require('koa-router');
const adminRouter = require('./admin');
const downloadCert = require('./cert');

const {
    getRules,
    getRuleByName,
    selectRule,
    deselectRule,
    getSelectedRules,
    deselectAllRules
} = require('./rule');

const {
    getHistory,
    getHistoryDetail,
    getRequestBody,
    getResponseBody
} = require('./history');

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

module.exports = backendRouter;
