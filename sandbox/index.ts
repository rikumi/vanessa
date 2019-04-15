import untildify = require('untildify');

import { IContext } from 'http-mitm-proxy';
import { Context, createContext } from 'vm';
import getRequest from './request';
import getResponse from './response';
import { resolve, basename } from 'path';
import { existsSync, createReadStream } from 'fs';

export default function createSandbox(ctx: IContext): Context {
    let sandbox = {
        console,
        file(pathLike) {
            let path = resolve(untildify(pathLike));
            let exists = existsSync(path);
            if (!exists) {
                return { status: 404 };
            }
            return {
                status: 200,
                data: createReadStream(path),
                headers: {
                    'content-type': 'application/octet-stream',
                    'content-disposition': 'attachment;filename=' + basename(path)
                }
            };
        },
        get req() {
            return getRequest(ctx);
        },
        set req(req) {
            Object.assign(getRequest(ctx), req);
        },
        get res() {
            return getResponse(ctx);
        },
        set res(res) {
            Object.assign(getResponse(ctx), res);
        },
        ...global
    };

    return createContext(sandbox);
}
