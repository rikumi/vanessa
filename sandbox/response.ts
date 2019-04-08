import HTTPStatus = require('http-status');

import { IContext } from 'http-mitm-proxy';
import { getStreamOperations, overwriteStream } from './stream';

interface IMockContext extends IContext {
    mockData?: string | Buffer;
    hasScheduledMockResponse?: boolean;
}

const scheduleMockResponse = (ctx: IMockContext) => {
    if (ctx.hasScheduledMockResponse) {
        return;
    }
    ctx.hasScheduledMockResponse = true;
    
    process.nextTick(() => {
        let res = ctx.proxyToClientResponse;
        let data = ctx.mockData;
        let status = res.statusCode;
        let headers = res.getHeaders();

        if (data) {
            status = status || 200;
        } else {
            status = status || 404;
            data = status + ' ' + HTTPStatus[status];
        }

        res.writeHead(status, headers);
        res.write(data.toString());
        res.end();
    });
}

export default function getResponse(ctx: IMockContext) {
    let pending = !ctx.serverToProxyResponse;

    let res = ctx.proxyToClientResponse;
    return {
        get status() {
            return res.statusCode;
        },
        set status(code) {
            if (pending) scheduleMockResponse(ctx);
            res.statusCode = code;
        },
        get headers() {
            return new Proxy(
                {},
                {
                    get(_, key) {
                        return res.getHeader(key.toString());
                    },
                    set(_, key, value) {
                        if (pending) scheduleMockResponse(ctx);
                        res.setHeader(key.toString(), value);
                        return true;
                    },
                    deleteProperty(_, key) {
                        if (pending) scheduleMockResponse(ctx);
                        if (res.hasHeader(key.toString())) {
                            res.removeHeader(key.toString());
                            return true;
                        }
                        return false;
                    } 
                }
            );
        },
        set headers(headers) {
            if (pending) scheduleMockResponse(ctx);
            for (let key in res.getHeaders()) {
                res.removeHeader(key);
            }
            for (let key in headers) {
                if ({}.hasOwnProperty.call(headers, key)) {
                    res.setHeader(key, headers[key]);
                }
            }
        },
        get data() {
            if (pending) {
                return ctx.mockData;
            }
            return getStreamOperations(ctx.addResponseFilter.bind(ctx));
        },
        set data(data: any) {
            if (pending) {
                scheduleMockResponse(ctx);
                ctx.mockData = data;
            } else {
                overwriteStream(ctx.addResponseFilter.bind(ctx), data);
            }
        },
        then(promiseCallback) {
            if (pending) {
                ctx.onResponse(async (_, proxyCallback) => {
                    await promiseCallback();
                    proxyCallback();
                });
            } else {
                promiseCallback();
            }
        },
        catch(promiseCallback) {
            ctx.onError((_, error) => promiseCallback(error));
        }
    };
}