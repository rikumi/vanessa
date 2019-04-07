import * as rs from 'replacestream';
import * as intoStream from 'into-stream';
import * as collectAll from 'collect-all';
import * as brake from 'brake';
import * as delay from 'delay-stream';
import { Writable, Transform } from 'stream';

export function overwriteStream(pipeFunc: (Transform) => any, data: any) {
    if (typeof data === 'object' && !(data instanceof Buffer)) {
        data = JSON.stringify(data);
    }
    pipeFunc(Writable.call(intoStream(data)));
    return true;
}

export function getStreamOperations(pipeFunc: (Transform) => any) {
    let operations = {
        transformStream(transform: Transform) {
            pipeFunc(transform);
            return operations;
        },
        transformAll(map: (input: any) => any) {
            pipeFunc(
                collectAll((all) => {
                    try {
                        return JSON.stringify(map(JSON.parse(all)));
                    } catch (e) {
                        return map(all);
                    }
                })
            );
            return operations;
        },
        replace(find: RegExp | string, replace: string | Function) {
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
