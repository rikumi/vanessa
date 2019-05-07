const { Stream, Readable } = require('stream');
const streamReplace = require('replacestream');
const streamCollect = require('raw-body');
const streamThrottle = require('brake');
const streamDelay = require('delay-stream');
const intoStream = require('into-stream');
const toDuplex = require('duplexify');
const { NullWritable } = require('null-writable');
const MiniPass = require('minipass');

const streamProto = Object.create(Stream.prototype);

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

const overwriteStream = (pipeThrough, data) => {
    pipeThrough(toDuplex(new NullWritable(), toStream(data)));
}

const getStreamOperations = (ctx, type) => {
    // response.body is not available right now, and should be read later when the response comes.
    let requestOrResponse = ctx[type];

    let pipeThrough = (dup) => requestOrResponse.body = (requestOrResponse.body.pipe(dup));
    let ensurePhase = (operation = 'write') => {
        if (ctx.phase === 'request' && type === 'response') {
            throw new Error('Cannot access response body during request phase.');
        } else if (ctx.phase === 'response' && type === 'request' && operation === 'write') {
            throw new Error('Cannot modify request body during response phase.');
        }
    };

    let operations = {
        async all() {
            ensurePhase('read');
            return await streamCollect(requestOrResponse.body);
        },
        // TODO: Not tested yet
        transform(transform) {
            ensurePhase('write');
            pipeThrough(transform);
            return operations;
        },
        replace(find, replace) {
            ensurePhase('write');
            // RegExp literals in sandboxes are not `instanceof` RegExp.
            if (find.constructor.name === 'RegExp') {
                find = new RegExp(find, find.flags);
            }
            pipeThrough(streamReplace(find, replace));
            return operations;
        },
        prepend(data) {
            ensurePhase('write');
            let dup = new MiniPass();
            // Modify the MiniPass prototype to extend Stream.prototype
            // so as to not be treated by koa as JSON response.
            dup.__proto__.__proto__ = streamProto;
            dup.write(data);
            pipeThrough(dup);
            return operations;
        },
        append(data) {
            ensurePhase('write');
            let dup = new MiniPass();
            // Modify the MiniPass prototype to extend Stream.prototype
            // so as to not be treated by koa as JSON response.
            dup.__proto__.__proto__ = streamProto;
            pipeThrough(dup);
            let end = dup.end.bind(dup);
            dup.end = (chunk, encoding, cb) => {
                dup.write(chunk, encoding);
                dup.write(data);
                end(null, null, cb);
            };
            return operations;
        },
        delay(ms) {
            ensurePhase('write');
            pipeThrough(streamDelay(ms));
            return operations;
        },
        throttle(bytesPerSecond) {
            ensurePhase('write');
            pipeThrough(streamThrottle(bytesPerSecond));
            return operations;
        }
    };
    return operations;
}

module.exports = {
    toStream,
    steal,
    overwriteStream,
    getStreamOperations,
};