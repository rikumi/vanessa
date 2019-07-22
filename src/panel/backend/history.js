const isLocalhost = require('../../util/is-localhost');
const { recentContexts } = require('../../middleware/functional/context');

const summarize = (ctx) => {
    let { id, method, url, ip, status, res, response: { type }} = ctx;
    if (!res.finished) {
        status = 0;
        type = '';
    }
    
    if (isLocalhost(ip)) {
        ip = 'localhost';
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
        let { summary, request, response } = detail;
        if (!detail.res.finished) {
            response = {};
        }
        ctx.body = {
            id,
            request,
            response,
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
        let body = detail.request.finalBody;
        if (body == null) {
            ctx.throw(404);
        } else {
            ctx.set('content-type', detail.get('content-type') || 'text/plain');
            ctx.set('content-length', detail.get('content-length'));
            ctx.set('content-encoding', detail.get('content-encoding'));
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
        let body = detail.response.finalBody;
        if (body == null) {
            ctx.throw(404);
        } else {
            ctx.set('content-type', detail.response.headers['content-type'] || 'text/plain');
            ctx.set('content-length', detail.response.headers['content-length']);
            ctx.set('content-encoding', detail.response.headers['content-encoding']);
            ctx.set('content-disposion', detail.response.headers['content-disposion']);
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
