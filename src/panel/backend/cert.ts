import { Middleware } from 'koa';
import { createReadStream } from 'fs';
import * as path from 'path';

const downloadCert: Middleware = (ctx) => {
    ctx.response.attachment('ca.pem');
    ctx.body = createReadStream(path.join(__dirname, '..', '..', 'certs', 'ca.pem'));
};

export default downloadCert;
