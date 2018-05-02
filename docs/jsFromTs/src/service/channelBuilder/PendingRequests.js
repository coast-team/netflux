import { log } from '../../misc/Util';
export class PendingRequests {
    constructor() {
        this.requests = new Map();
        this.timeoutDates = new Map();
    }
    add(id, timeout) {
        const req = { date: global.Date.now() };
        req.promise = new Promise((resolve, reject) => {
            // Set request Timeout
            const timer = setTimeout(() => {
                this.requests.delete(id);
                this.timeoutDates.set(id, req.date);
                log.channelBuilder('Timer EXECUTED for ' + id, timer);
                reject(new Error(`Request ${timeout}ms timeout`));
            }, timeout);
            log.channelBuilder('Timer SET for ' + id, timer);
            const beforeFullfilled = () => {
                log.channelBuilder('Timer CLEARED for ' + id, timer);
                clearTimeout(timer);
                this.requests.delete(id);
            };
            // Add resolve and reject attrebutes
            req.resolve = () => {
                beforeFullfilled();
                resolve();
            };
            req.reject = (err) => {
                beforeFullfilled();
                reject(err);
            };
            this.requests.set(id, req);
        });
        log.channelBuilder('Pending Request: ', req);
        return req;
    }
    get(id) {
        return this.requests.get(id);
    }
    getTimeoutDate(id) {
        return this.timeoutDates.get(id);
    }
}
