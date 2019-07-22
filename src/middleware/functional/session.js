const os = require('os');
const fs = require('fs');
const util = require('util');
const path = require('path');
const yaml = require('yaml');
const mkdirp = require('mkdirp');
const isLocalhost = require('../../util/is-localhost');

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

    if (fs.existsSync(filePath)) {
        try {
            let content = (fs.readFileSync(filePath)).toString();
            ctx.session = yaml.parse(content);
            if (!ctx.session) {
                console.log('session error', content);
            }
        } catch (e) {}
    }

    if (!ctx.session || typeof ctx.session !== 'object' || Array.isArray(ctx.session)) {
        ctx.session = {};
    }

    if (!isLocal && ctx.session.expires && ctx.session.expires < Date.now()) {
        ctx.session = {};
    }

    await next();

    if (!isLocal) {
        ctx.session.expires = Date.now() + 60 * 60 * 1000;
    }

    fs.writeFileSync(filePath, yaml.stringify(ctx.session));
};

module.exports = sessionMiddleware;
