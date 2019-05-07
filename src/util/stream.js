const { Readable } = require('stream');
const streamReplace = require('replacestream');
const streamCollect = require('collect-all');
const streamThrottle = require('brake');
const streamDelay = require('delay-stream');
const intoStream = require('into-stream');
const toDuplex = require('duplexify');
const PassthroughDuplex = require('minipass');
const { NullWritable } = require('null-writable');

const toStream = (data) => {
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
    return intoStream(data);
}

const toString = async (stream) => {
    if (stream.finished) {
        console.log('stream ended');
        return '';
    }
    return new Promise((resolve) => {
        stream.pipe(streamCollect((buffer) => resolve(buffer.toString())));
    });
};

const steal = async (stream) => {
    if (stream.readable) {
        return new Promise((resolve, reject) => {
            let pipe = stream.pipe;
            stream.pipe = (dest, ...args) => {
                steal(dest).then(resolve).catch(() => {});
                return pipe.call(stream, dest, ...args);
            };
            stream.once('error', reject);
        });
    } else {
        return new Promise((resolve, reject) => {
            let buffer = new Buffer(0);

            let write = stream.write;
            stream.write = (chunk, ...args) => {
                buffer = Buffer.concat([buffer, chunk]);
                return write.call(stream, chunk, ...args);
            };

            stream.once('finish', () => {
                resolve(buffer);
            });

            stream.once('error', reject);
        });
    }
}

const overwriteStream = (pipeFunc, data) => {
    pipeFunc(toDuplex(new NullWritable(), toStream(data)));
}

const getStreamOperations = (pipeFunc) => {
    let operations = {
        // TODO: Not working yet
        async all() {
            return new Promise((resolve) => pipeFunc(streamCollect(resolve)));
        },
        overwrite(data) {
            overwriteStream(pipeFunc, data);
            return operations;
        },
        // TODO: Not tested yet
        transform(transform) {
            pipeFunc(transform);
            return operations;
        },
        replace(find, replace) {
            // RegExp literals in sandboxes are not `instanceof` RegExp.
            if (find.constructor.name === 'RegExp') {
                find = new RegExp(find, find.flags);
            }
            pipeFunc(streamReplace(find, replace));
            return operations;
        },
        // TODO: Not working yet
        prepend(data) {
            let dup = new PassthroughDuplex();
            dup.write(data);
            pipeFunc(dup);
            return operations;
        },
        // TODO: Not working yet
        append(data) {
            let dup = new PassthroughDuplex();
            pipeFunc(dup);
            let end = dup.end.bind(dup);
            dup.end = (chunk, encoding, cb) => {
                dup.write(chunk, encoding);
                dup.write(data);
                end(null, null, cb);
            };
            return operations;
        },
        delay(ms) {
            pipeFunc(streamDelay(ms));
            return operations;
        },
        throttle(bytesPerSecond) {
            pipeFunc(streamThrottle(bytesPerSecond));
            return operations;
        }
    };
    return operations;
}

module.exports = {
    toStream,
    toString,
    steal,
    overwriteStream,
    getStreamOperations,
};