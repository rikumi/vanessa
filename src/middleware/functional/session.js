const { Middleware } = require('koa');
const os = require('os');
const fs = require('fs');
const util = require('util');
const path = require('path');
const yaml = require('yaml');
const mkdirp = require('mkdirp');
const isLocalhost = require('is-localhost');

let exists = util.promisify(fs.exists);
let readFile = util.promisify(fs.readFile);
let writeFile = util.promisify(fs.writeFile);

const sessionDir = path.join(os.homedir(), '.vanessa', 'sessions');
mkdirp.sync(sessionDir);

const sessionMiddleware = async (ctx, next) => {
    let address = ctx.ip;
    let isLocal = isLocalhost(address);
    if (isLocal) {
        address = 'localhost';
    }
    
    let fileName = address.replace(/:/g, '|');
    let filePath = path.join(sessionDir, fileName + '.yaml');

    ctx.session = {};

    if (await exists(filePath)) {
        try {
            let content = await readFile(filePath).toString();
            ctx.session = yaml.parse(content);
        } catch (e) {}
    }

    if (!isLocal && ctx.session.expires && ctx.session.expires < Date.now()) {
        ctx.session = {};
    }

    await next();

    if (!isLocal) {
        ctx.session.expires = Date.now() + 60 * 60 * 1000;
    }

    writeFile(filePath, yaml.stringify(ctx.session));
};

module.exports = sessionMiddleware;
