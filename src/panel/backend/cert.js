const { Middleware } = require('koa');
const { createReadStream } = require('fs');
const { recentContexts } = require('../../middleware/functional/context');
const path = require('path');

const downloadCert = (ctx) => {
    ctx.response.attachment('ca.pem');
    ctx.body = createReadStream(path.join(__dirname, '..', '..', 'certs', 'ca.pem'));
};

const trustHost = (ctx) => {
    let { id } = ctx.params;
    let history = recentContexts.get(id); 
    ctx.session.trustedHost = (ctx.session.trustedHost || []).concat([ history.host ]);
    ctx.redirect(history.url);
};

module.exports = {
    downloadCert,
    trustHost
};
