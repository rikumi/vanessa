const { Middleware } = require('koa');
const { createReadStream } = require('fs');
const path = require('path');

const downloadCert = (ctx) => {
    ctx.response.attachment('ca.pem');
    ctx.body = createReadStream(path.join(__dirname, '..', '..', 'certs', 'ca.pem'));
};

module.exports = downloadCert;
