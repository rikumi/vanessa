const isLocalhost = require('../../util/is-localhost');

const isAdmin = async (ctx) => {
    ctx.body = isLocalhost(ctx.ip);
};

module.exports = isAdmin;