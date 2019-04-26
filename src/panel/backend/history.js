const { Middleware, Context } = require('koa');
const isLocalhost = require('is-localhost');
const { recentContexts } = require('../../middleware/functional/counter');

const summarize = (ctx) => {
    let { id, method, url, ip, status, res, response: { type }} = ctx;
    if (!res.finished) {
        status = 0;
        type = '';
    }

    return { id, method, url, ip, status, type };
};

const shouldShow = (currentContext, otherContext) => {
    return isLocalhost(currentContext.ip) || currentContext.ip === otherContext.ip;
}

const getHistory = (ctx) => {
    let from = Number(ctx.params.from || -50);
    ctx.body = recentContexts.slice(from)
        .filter(k => shouldShow(ctx, k))
        .map(k => summarize(k));
};

const getHistoryDetail = (ctx) => {
    let id = Number(ctx.params.id);
    let detail = recentContexts.get(id);
    if (detail == null) {
        ctx.throw(404);
    } else if (!shouldShow(ctx, detail)) {
        ctx.throw(403);
    } else {
        let { summary } = detail;
        let { request, response } = summary;
        ctx.body = {
            id,
            request: {
                body: undefined,
                ...request
            },
            response: {
                body: undefined,
                ...response
            },
            ...summary
        };
    }
};

const getRequestBody = (ctx) => {
    let id = Number(ctx.params.id);
    let detail = recentContexts.get(id);
    if (detail == null) {
        ctx.throw(404);
    } else if (!shouldShow(ctx, detail)) {
        ctx.throw(403);
    } else {
        let body = detail.request.body;
        if (body == null) {
            ctx.throw(404);
        } else {
            ctx.body = body;
        }
    }
};

const getResponseBody = (ctx) => {
    let id = Number(ctx.params.id);
    let detail = recentContexts.get(id);
    if (detail == null) {
        ctx.throw(404);
    } else if (!shouldShow(ctx, detail)) {
        ctx.throw(403);
    } else {
        let body = detail.response.body;
        if (body == null) {
            ctx.throw(404);
        } else {
            ctx.body = body;
        }
    }
};

module.exports = {
    getHistory,
    getHistoryDetail,
    getRequestBody,
    getResponseBody
};
