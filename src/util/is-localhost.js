const os = require('os');
const ip = require('ip');
const ifs = os.networkInterfaces();
const addresses = [].concat(...Object.getOwnPropertyNames(ifs).map(k => ifs[k])).map(k => k.address);

module.exports = (host) => {
    return !!addresses.find(k => ip.isEqual(k, host));
}