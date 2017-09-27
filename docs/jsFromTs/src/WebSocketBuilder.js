import 'rxjs/add/operator/filter';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Channel } from './Channel';
import { isBrowser, isURL } from './misc/Util';
const CONNECT_TIMEOUT_FOR_NODE = 3000;
const listenSubject = new BehaviorSubject('');
/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {
    static listen() {
        return listenSubject;
    }
    static newIncomingSocket(wc, ws, senderId) {
        wc.webSocketBuilder.channelsSubject.next(new Channel(wc, ws, { id: senderId }));
    }
    constructor(wc) {
        this.wc = wc;
        this.channelsSubject = new Subject();
    }
    get onChannel() {
        return this.channelsSubject.asObservable();
    }
    /**
     * Establish `WebSocket` with a server.
     *
     * @param url Server url
     */
    connect(url) {
        return new Promise((resolve, reject) => {
            try {
                if (isURL(url) && url.search(/^wss?/) !== -1) {
                    const ws = new global.WebSocket(url);
                    ws.onopen = () => resolve(ws);
                    ws.onclose = (closeEvt) => reject(new Error(`WebSocket connection to '${url}' failed with code ${closeEvt.code}: ${closeEvt.reason}`));
                    if (!isBrowser) {
                        // Timeout for node (otherwise it will loop forever if incorrect address)
                        setTimeout(() => {
                            if (ws.readyState !== ws.OPEN) {
                                reject(new Error(`WebSocket ${CONNECT_TIMEOUT_FOR_NODE}ms connection timeout with ${url}`));
                            }
                        }, CONNECT_TIMEOUT_FOR_NODE);
                    }
                }
                else {
                    throw new Error(`${url} is not a valid URL`);
                }
            }
            catch (err) {
                console.error('WebSocketBuilder ERROR');
                reject(err);
            }
        });
    }
    /**
     * Establish a `Channel` with a server peer identified by `id`.
     *
     * @param url Server url
     * @param id  Peer id
     */
    connectTo(url, id) {
        const fullUrl = `${url}/internalChannel?wcId=${this.wc.id}&senderId=${this.wc.myId}`;
        return new Promise((resolve, reject) => {
            if (isURL(url) && url.search(/^wss?/) !== -1) {
                const ws = new global.WebSocket(fullUrl);
                const channel = new Channel(this.wc, ws, { id });
                ws.onopen = () => resolve(channel);
                ws.onclose = (closeEvt) => reject(new Error(`WebSocket connection to '${url}' failed with code ${closeEvt.code}: ${closeEvt.reason}`));
                if (!isBrowser) {
                    // Timeout for node (otherwise it will loop forever if incorrect address)
                    setTimeout(() => {
                        if (ws.readyState !== ws.OPEN) {
                            reject(new Error(`WebSocket ${CONNECT_TIMEOUT_FOR_NODE}ms connection timeout with ${url}`));
                        }
                    }, CONNECT_TIMEOUT_FOR_NODE);
                }
            }
            else {
                throw new Error(`${url} is not a valid URL`);
            }
        });
    }
}
