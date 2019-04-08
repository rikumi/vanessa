import { IContext } from 'http-mitm-proxy';
import { Context, createContext } from 'vm';
import getRequest from './request';
import getResponse from './response';

export default function createSandbox(ctx: IContext): Context {
    let sandbox = {
        console,
        get req() {
            return getRequest(ctx);
        },
        get res() {
            return getResponse(ctx);
        }
    };

    return createContext(sandbox);
}