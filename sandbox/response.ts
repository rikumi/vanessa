import { getStreamOperations, overwriteStream } from './stream';
import { IContext } from 'http-mitm-proxy';
import * as HTTPStatus from 'http-status';

export async function getResponse(ctx: IContext) {
    await new Promise((r) => {
        ctx.onResponse((_, cb) => {
            r();
            cb();
        });
        ctx.onError(() => r());
    });

    let res = ctx.proxyToClientResponse;
    return {
        get status() {
            return res.statusCode;
        },
        set status(code) {
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
                        res.setHeader(key.toString(), value);
                        return true;
                    },
                    deleteProperty(_, key) {
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
            return getStreamOperations(ctx.addResponseFilter.bind(ctx));
        },
        set data(data) {
            overwriteStream(ctx.addResponseFilter.bind(ctx), data);
        }
    };
}

export function setResponse(ctx: IContext, obj: any) {
    let res = ctx.proxyToClientResponse;
    let status: number, headers: any, data: string;
    if (obj == null) {
        status = 404;
        headers = { 'Content-Type': 'text/plain' };
        data = '404 Not Found\n';
    } else {
        if (typeof obj === 'number') {
            obj = { status: obj };
        } else if (!obj.status && !obj.data) {
            if (typeof obj === 'object') {
                obj = JSON.stringify(obj);
            }
            obj = { data: obj };
        }
        status = obj.status || 200;
        headers = obj.headers || { 'Content-Type': 'text/plain' };
        data = obj.data || HTTPStatus[status];
    }
    res.writeHead(status, headers);
    res.write(data);
    res.end();
}
