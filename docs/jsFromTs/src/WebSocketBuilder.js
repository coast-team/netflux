import { BehaviorSubject, Subject } from 'rxjs';
import { Channel } from './Channel';
import { env } from './misc/env';
import { validateWebSocketURL } from './misc/util';
export const CONNECT_TIMEOUT = 4000;
/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {
    constructor(wc) {
        this.wc = wc;
        this.channelsSubject = new Subject();
    }
    get channels() {
        return this.channelsSubject.asObservable();
    }
    newWebSocket(ws, id, type) {
        this.channelsSubject.next({ id, channel: new Channel(this.wc, ws, type, id) });
    }
    async connect(url, type, targetId, myId, wcId) {
        validateWebSocketURL(url);
        const fullUrl = this.composeUrl(url, Channel.remoteType(type), wcId, myId);
        const ws = new env.WebSocket(fullUrl);
        const channel = (await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (ws.readyState !== ws.OPEN) {
                    ws.close();
                    reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`));
                }
            }, CONNECT_TIMEOUT);
            ws.onopen = () => {
                clearTimeout(timeout);
                resolve(new Channel(this.wc, ws, type, targetId));
            };
            ws.onerror = (err) => reject(err);
            ws.onclose = (closeEvt) => {
                reject(new Error(`WebSocket with '${url}' closed ${closeEvt.code}: ${closeEvt.reason}`));
            };
        }));
        this.channelsSubject.next({ id: targetId, channel });
    }
    composeUrl(url, type, wcId, senderId) {
        let result = `${url}/?type=${type}&wcId=${wcId}&senderId=${senderId}`;
        if (type !== Channel.WITH_INTERNAL) {
            result += `&key=${this.wc.key}`;
        }
        return result;
    }
}
WebSocketBuilder.listenUrl = new BehaviorSubject('');
