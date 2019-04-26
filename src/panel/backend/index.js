const Router = require('koa-router');
const compose = require('koa-compose');
const adminRouter = require('./admin');
const downloadCert = require('./cert');

const {
    getRules,
    getRuleByName,
    selectRule,
    deselectRule,
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
router.get('/rule', getRules);
router.get('/rule/:name', getRuleByName);
router.post('/rule/:name', selectRule);
router.delete('/rule', deselectAllRules);
router.delete('/rule/:name', deselectRule);
router.get('/history', getHistory);
router.get('/history/~:from', getHistory);
router.get('/history/:id', getHistoryDetail);
router.get('/history/:id/req', getRequestBody);
router.get('/history/:id/res', getResponseBody);

module.exports = router;