import streamReplace = require('replacestream');
import streamCollect = require('collect-all');
import streamThrottle = require('brake');
import streamDelay = require('delay-stream');
import toStream = require('into-stream');
import toDuplex = require('duplexify');
import PassthroughDuplex = require('minipass');

import { NullWritable } from 'null-writable';
import { Transform, Readable } from 'stream';

export function wrapStream(data: any) {
    if (data instanceof Readable) {
        return data;
    }
    if (typeof data === 'object' && !(data instanceof Buffer)) {
        try {
            data = JSON.stringify(data);
        } catch (e) {}
    }
    if (typeof data !== 'string') {
        data = data.toString();
    }
    return toStream(data);
}

export function overwriteStream(pipeFunc: (Transform) => any, data: any) {
    pipeFunc(toDuplex(new NullWritable(), wrapStream(data)));
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
                streamCollect((all: Buffer) => {
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
            pipeFunc(streamReplace(find, replace));
            return operations;
        },
        overwrite(data: string | Buffer) {
            overwriteStream(pipeFunc, data);
            return operations;
        },
        prepend(data: string | Buffer) {
            let dup = new PassthroughDuplex();
            dup.write(data);
            pipeFunc(dup);
            return operations;
        },
        append(data: string | Buffer) {
            let dup = new PassthroughDuplex();
            pipeFunc(dup);
            let end = dup.end.bind(dup);
            dup.end = (chunk, encoding, cb) => {
                dup.write(chunk, encoding);
                dup.write(data);
                end(null, null, cb);
            }
            return operations;
        },
        delay(ms: number) {
            pipeFunc(streamDelay(ms));
            return operations;
        },
        throttle(bytesPerSecond: number) {
            pipeFunc(streamThrottle(bytesPerSecond));
            return operations;
        }
    };
    return operations;
}
