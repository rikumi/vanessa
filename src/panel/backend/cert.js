const { createReadStream } = require('fs');
const { recentContexts } = require('../../middleware/functional/context');
const path = require('path');

const downloadCert = (ctx) => {
    ctx.response.attachment('ca.pem');
    ctx.body = createReadStream(path.join(__dirname, '..', '..', 'certs', 'ca.pem'));
};

const trustHost = (ctx) => {
    let { id: idOrHost } = ctx.params;
    if (/^\d+$/.test(idOrHost)) {
        let history = recentContexts.get(idOrHost);
        ctx.session.trustedHosts = (ctx.session.trustedHosts || []).concat([ history.host ]);
        ctx.redirect(history.url);
    } else {
        ctx.session.trustedHosts = (ctx.session.trustedHosts || []).concat([ idOrHost ]);
        ctx.body = 'OK';
    }
};

const distrustHost = (ctx) => {
    let { id: idOrHost } = ctx.params;
    if (/^\d+$/.test(idOrHost)) {
        let history = recentContexts.get(idOrHost);
        ctx.session.trustedHosts = (ctx.session.trustedHosts || []).filter(k => k !== history.host);
        ctx.redirect(history.url);
    } else {
        ctx.session.trustedHosts = (ctx.session.trustedHosts || []).filter((k) => k !== idOrHost);
        ctx.body = 'OK';
    }
};

module.exports = {
    downloadCert,
    trustHost,
    distrustHost
};
