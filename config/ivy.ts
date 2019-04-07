import { IProxyOptions } from 'http-mitm-proxy';
import store from './store';
import * as path from 'path';

const ivy: IProxyOptions = {
    sslCaDir: path.dirname(store.path)
};

let key = '';
process.argv.slice(2).forEach((arg: any) => {
    if (/^-/.test(arg)) {
        key = arg.replace(/^-+/, '').replace(/-(.)/g, (k) => k[1].toUpperCase());
        ivy[key] = true;
    } else {
        arg = /^0|[1-9]\d+$/.test(arg) ? parseInt(arg) : arg;
        if (ivy[key] === true) {
            ivy[key] = arg;
        } else {
            ivy[key] = [arg].concat(ivy[key]);
        }
    }
});

export default ivy;
