import rs = require('replacestream');
import intoStream = require('into-stream');
import collectAll = require('collect-all');
import brake = require('brake');
import delay = require('delay-stream');
import duplexify = require('duplexify');

import { NullWritable } from 'null-writable';
import { Transform } from 'stream';

export function overwriteStream(pipeFunc: (Transform) => any, data: any) {
    if (typeof data === 'object' && !(data instanceof Buffer)) {
        data = JSON.stringify(data);
    }
    pipeFunc(duplexify(new NullWritable(), intoStream(data)));
    return true;
}

export function getStreamOperations(pipeFunc: (Transform) => any) {
    let operations = {
        transformStream(transform: Transform) {
            pipeFunc(transform);
            return operations;
        },
        transformAll(map: (input: string) => string) {
            pipeFunc(
                collectAll((all: Buffer) => {
                    return new Buffer(map(all.toString()));
                })
            );
            return operations;
        },
        replace(find: RegExp | string, replace: string | Function) {
            // 修正沙箱中正则字面量 instanceof RegExp 为 false 的问题
            if (find.constructor.name === 'RegExp') {
                find = new RegExp(<RegExp>find, (<RegExp>find).flags);
            }
            pipeFunc(rs(find, replace));
            return operations;
        },
        overwrite(data: string | Buffer) {
            overwriteStream(pipeFunc, data);
            return operations;
        },
        delay(ms: number) {
            pipeFunc(delay(ms));
            return operations;
        },
        throttle(bytesPerSecond: number) {
            pipeFunc(brake(bytesPerSecond));
            return operations;
        }
    };
    return operations;
}
