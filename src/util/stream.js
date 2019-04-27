const { Readable, Writable } = require('stream');
const collect = require('collect-all');

const fromString = (str) => {
    let readable = new Readable();
    readable.push(str);
    return readable;
}

const toString = async (stream) => {
    return new Promise((resolve) => {
        stream.pipe(collect((buffer) => resolve(buffer.toString())));
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

module.exports = {
    fromString,
    toString,
    steal
};