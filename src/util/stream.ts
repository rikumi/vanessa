import { Readable } from 'stream';

const fromString = (str: string) => {
    let readable = new Readable();
    readable.push(str);
    return readable;
}

const toString = async (stream: Readable) => {
    return new Promise<string>((resolve, reject) => {
        let buffer = new Buffer('');
        stream.on('data', (chunk) => buffer.write(chunk));
        stream.on('end', () => resolve(buffer.toString()));
        stream.on('error', reject);
    });
};

const steal = async (stream: any) => {
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

export {
    fromString,
    toString,
    steal
}