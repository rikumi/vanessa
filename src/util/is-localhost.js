const os = require('os');
const ip = require('ip');
const ifs = os.networkInterfaces();
const addresses = [].concat(...Object.getOwnPropertyNames(ifs).map(k => ifs[k])).map(k => k.address);

module.exports = (host) => {
    // TODO: resolve localhost with other domain names
    if (host === 'localhost') return true;
    if (!/^[\da-f\.:]+$/i.test(host)) return false;
    return !!addresses.find(k => ip.isEqual(k, host));
}