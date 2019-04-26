const os = require('os');
const { Middleware } = require('koa');
const { version } = require('../../../../package.json');

const startTime = Date.now();
const upTime = Date.now() - os.uptime() * 1000;

const getInfo = (ctx) => {
    ctx.body = {
        client: {
            ip: ctx.ip,
            userAgent: ctx.get('user-agent')
        },
        server: {
            system: {
                platform: process.platform,
                arch: process.arch,
                startTime: upTime,
                cpuUsage: process.cpuUsage()
            },
            node: {
                version: process.version,
                env: process.env,
                pid: process.pid,
                argv: process.argv,
                cwd: process.cwd(),
                features: process.features,
                umask: process.umask().toString(8).padStart(4, '0')
            },
            vanessa: {
                version,
                startTime
            }
        }
    };
}

module.exports = getInfo;