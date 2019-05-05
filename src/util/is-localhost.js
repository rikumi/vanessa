const os = require('os');
const ip = require('ip');
const ifs = os.networkInterfaces()
const addresses = Object.getOwnPropertyNames(ifs)
    .map(k => ifs[k])
    .reduce((a, b) => a.concat(b), [])
    .map(k => k.address)

module.exports = (host) => {
    return !!addresses.find(k => ip.isEqual(k, host));
}