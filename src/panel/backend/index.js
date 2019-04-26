const Router = require('koa-router');
const compose = require('koa-compose');
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

const router = new Router();

router.use('/admin', adminRouter.routes(), adminRouter.allowedMethods());
router.get('/cert', downloadCert);
router.get('/rules', getRules);
router.get('/rules/:name', getRuleByName);
router.get('/rule', getSelectedRules);
router.get('/rule/+:name', selectRule);
router.get('/rule/-all', deselectAllRules);
router.get('/rule/-:name', deselectRule);
router.get('/history', getHistory);
router.get('/history/~:from', getHistory);
router.get('/history/:id', getHistoryDetail);
router.get('/history/:id/req', getRequestBody);
router.get('/history/:id/res', getResponseBody);

module.exports = compose([router.routes(), router.allowedMethods()]);
