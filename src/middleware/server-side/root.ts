import { Middleware } from 'koa';
import * as http from 'http';
import * as https from 'https';

const serverSideMiddleware: Middleware = async (ctx) => {
    let res = await new Promise<http.IncomingMessage>((resolve) => {
        let proto = ctx.protocol === 'https' ? https : http;
        let { method, host: hostport, url: path, headers } = ctx.request;
        
        let [host, port] = hostport.split(':');
        port = port && parseInt(port) || { http: 80, https: 443 }[ctx.protocol];

        let options = Object.assign(ctx.requestOptions, {
            host, port, method, path, headers
        });
        let req = proto.request(options, resolve);

        let clientReq = ctx.req;
        for (let filter of ctx.requestFilters) {
            ctx.req = ctx.req.pipe(filter);
        }
        ctx.req.pipe(req);
        clientReq.resume();
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
    
    res.headers['transfer-encoding'] = 'chunked';
    res.headers['connection'] = 'close';
    delete res.headers['content-length'];
    ctx.response.set(res.headers as any);
    ctx.response['_body'] = res;
};

export default serverSideMiddleware;
