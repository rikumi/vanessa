const { Middleware } = require('koa');
const http = require('http');
const https = require('https');
const collect = require('collect-all');

const serverEndMiddleware = async (ctx) => {
    ctx.request.body = ctx.req;
    
    let res = await new Promise((resolve, reject) => {
        let proto = ctx.protocol === 'https' ? https : http;
        let { method, host: hostport, path, querystring, headers } = ctx.request;

        if (querystring) {
            path += '?' + querystring;
        }
        
        let [host, port] = hostport.split(':');
        port = port && parseInt(port) || { http: 80, https: 443 }[ctx.protocol];

        let options = Object.assign(ctx.requestOptions, {
            host, port, method, path, headers
        });
        
        let req = proto.request(options, resolve);
        req.on('error', reject);
        ctx.phase = 'response';

        ctx.request.body.pipe(req);
        ctx.request.body.pipe(collect((buffer) => ctx.request.finalBody = buffer));
    });

    res.pause();
    ctx.response.status = res.statusCode;
    ctx.response.message = res.statusMessage;

    for (let key in res.headers) {
        let canonizedKey = key.trim();
        if (/^public\-key\-pins/i.test(canonizedKey)) {
            continue;
        }
        res.headers[canonizedKey] = res.headers[key];
    }

    ctx.response.set(res.headers);
    ctx.response._body = res;
    ctx.rawRes = res;
};

module.exports = serverEndMiddleware;
