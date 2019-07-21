const { Stream, Readable, PassThrough } = require('stream');
const streamReplace = require('replacestream');
const streamCollect = require('raw-body');
const streamThrottle = require('brake');
const streamDelay = require('delay-stream');
const intoStream = require('into-stream');
const toDuplex = require('duplexify');
const { NullWritable } = require('null-writable');
const cheerio = require('cheerio');

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
            let buffer = Buffer.from('');

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
        async json() {
            return JSON.parse(await operations.all());
        },
        async cheerio() {
            return cheerio.load(await operations.all());
        },
        // TODO: Not tested yet
        transform(transform) {
            ensurePhase('write');
            if (requestOrResponse.headers) {
                delete requestOrResponse.headers['content-length'];
            }
            pipeThrough(transform);
            return operations;
        },
        replace(find, replace) {
            ensurePhase('write');
            if (requestOrResponse.headers) {
                delete requestOrResponse.headers['content-length'];
            }
            // RegExp literals in sandboxes are not `instanceof` RegExp.
            if (find.constructor.name === 'RegExp') {
                find = new RegExp(find, find.flags);
            }
            pipeThrough(streamReplace(find, replace));
            return operations;
        },
        prepend(data) {
            ensurePhase('write');
            if (requestOrResponse.headers) {
                let length = Number(requestOrResponse.headers['content-length']);
                if (!Number.isNaN(length)) {
                    length += Buffer.from(data).length;
                    requestOrResponse.headers['content-length'] = length.toString();
                }
            }
            let dup = new PassThrough();
            dup.write(data);
            pipeThrough(dup);
            return operations;
        },
        append(data) {
            ensurePhase('write');
            if (requestOrResponse.headers) {
                let length = Number(requestOrResponse.headers['content-length']);
                if (!Number.isNaN(length)) {
                    length += Buffer.from(data).length;
                    requestOrResponse.headers['content-length'] = length.toString();
                }
            }
            let dup = new PassThrough();
            pipeThrough(dup);
            let end = dup.end.bind(dup);
            dup.end = (chunk, encoding, cb) => {
                chunk && dup.write(chunk, encoding);
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