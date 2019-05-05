const stringify = require('json-stringify-safe');
const _stringify = JSON.stringify;

let nested = false;

JSON.stringify = (...args) => {
    let [obj, serializer = null, indent = null] = args;
    if (nested) {
        return _stringify(obj, serializer, indent);
    } else {
        nested = true;
        let res = stringify(obj, serializer, indent, () => '[Circular]');
        nested = false;
        return res;
    }
}