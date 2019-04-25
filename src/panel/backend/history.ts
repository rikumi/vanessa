import { Middleware, Context } from 'koa';
import * as isLocalhost from 'is-localhost';
import { recentContexts } from '../../middleware/functional/counter';

const summarize = (ctx: Context): any => {
    let { id, method, url, ip, status, res, response: { type }} = ctx;
    if (!res.finished) {
        status = 0;
        type = '';
    }

    return { id, method, url, ip, status, type };
};

const shouldShow = (currentContext: Context, otherContext: Context) => {
    return isLocalhost(currentContext.ip) || currentContext.ip === otherContext.ip;
}

const getHistory: Middleware = (ctx) => {
    let from = Number(ctx.params.from || -50);
    ctx.body = recentContexts.slice(from)
        .filter(k => shouldShow(ctx, k))
        .map(k => summarize(k));
};

const getHistoryDetail: Middleware = (ctx) => {
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

const getRequestBody: Middleware = (ctx) => {
    let id = Number(ctx.params.id);
    let detail = recentContexts.get(id);
    if (detail == null) {
        ctx.throw(404);
    } else if (!shouldShow(ctx, detail)) {
        ctx.throw(403);
    } else {
        let body = detail.request['body'];
        if (body == null) {
            ctx.throw(404);
        } else {
            ctx.body = body;
        }
    }
};

const getResponseBody: Middleware = (ctx) => {
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

export {
    getHistory,
    getHistoryDetail,
    getRequestBody,
    getResponseBody
};
