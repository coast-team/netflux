export class PendingRequests {
    constructor(wcStreamId) {
        this.wcStreamId = wcStreamId;
        this.wcReqs = {
            connectReqs: new Map(),
            pingReqs: new Map(),
        };
        this.sigReqs = {
            connectReqs: new Map(),
            pingReqs: new Map(),
        };
    }
    add(streamId, id, timeout) {
        const reqs = this.getReqsByStreamId(streamId);
        return this.addRequest(reqs.connectReqs, id, timeout);
    }
    addPing(streamId, id, timeout) {
        const reqs = this.getReqsByStreamId(streamId);
        return this.addRequest(reqs.pingReqs, id, timeout);
    }
    get(streamId, id) {
        const req = this.getReqsByStreamId(streamId).connectReqs.get(id);
        return req && req.promise ? req : undefined;
    }
    getPing(streamId, id) {
        const req = this.getReqsByStreamId(streamId).pingReqs.get(id);
        return req && req.promise ? req : undefined;
    }
    getCreatedDate(streamId, id) {
        const req = this.getReqsByStreamId(streamId).pingReqs.get(id);
        return req ? req.created : undefined;
    }
    clean() {
        this.cleanAll(this.wcReqs.connectReqs);
        this.cleanAll(this.wcReqs.pingReqs);
        this.cleanAll(this.sigReqs.connectReqs);
        this.cleanAll(this.sigReqs.pingReqs);
    }
    cleanAll(requests) {
        requests.forEach((req) => req.reject(new Error('clean')));
        requests.clear();
    }
    getReqsByStreamId(streamId) {
        return streamId === this.wcStreamId ? this.wcReqs : this.sigReqs;
    }
    addRequest(requests, id, timeout) {
        const req = { created: Date.now() };
        req.promise = new Promise((resolve, reject) => {
            const timer = setTimeout(() => req.reject(new Error(`Request ${timeout}ms timeout`)), timeout);
            const clean = () => {
                clearTimeout(timer);
                req.promise = undefined;
            };
            req.resolve = () => {
                clean();
                resolve();
            };
            req.reject = (err) => {
                if (req.promise) {
                    // This is necessary for some scenarios in order rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
                    req.promise.catch(() => { });
                }
                clean();
                reject(err);
            };
            requests.set(id, req);
        });
        return req;
    }
}
