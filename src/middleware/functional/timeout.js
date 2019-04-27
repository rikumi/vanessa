const timeout = 60000;

const timeoutMiddleware = async (ctx, next) => {
    let timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), timeout);
    });
    let result = await Promise.race([
        timeoutPromise,
        next()
    ]);
    if (result === 'timeout') {
        ctx.throw(408);
    }
};

module.exports = timeoutMiddleware;
