import { BehaviorSubject, Subject } from 'rxjs';
import { Channel, ChannelType } from './Channel';
import { isURL } from './misc/util';
export const CONNECT_TIMEOUT = 4000;
export var Route;
(function (Route) {
    Route["JOIN"] = "join";
    Route["INVITE"] = "invite";
    Route["INTERNAL"] = "internal";
})(Route || (Route = {}));
/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {
    constructor(wc) {
        this.wc = wc;
        this.channelsSubject = new Subject();
    }
    onChannel() {
        return this.channelsSubject.asObservable();
    }
    async connectToInvite(url) {
        if (isURL(url) && url.search(/^wss?/) !== -1) {
            const fullUrl = this.composeUrl(url, Route.INVITE);
            this.channelsSubject.next(await this.connect(fullUrl, ChannelType.INVITED));
        }
        else {
            throw new Error(`Invalid URL format: ${url}`);
        }
    }
    newInviteWebSocket(ws) {
        this.channelsSubject.next(new Channel(this.wc, ws, ChannelType.JOINING));
    }
    async connectToJoin(url, wcId) {
        if (isURL(url) && url.search(/^wss?/) !== -1) {
            // FIXME: wcId should be the one received via signaling server
            const fullUrl = this.composeUrl(url, Route.JOIN, wcId);
            this.channelsSubject.next(await this.connect(fullUrl, ChannelType.JOINING));
        }
        else {
            throw new Error(`Invalid URL format: ${url}`);
        }
    }
    newJoinWebSocket(ws) {
        const ch = new Channel(this.wc, ws, ChannelType.INVITED);
        ch.initialize();
        this.channelsSubject.next(ch);
    }
    async connectInternal(url, id) {
        if (isURL(url) && url.search(/^wss?/) !== -1) {
            const fullUrl = this.composeUrl(url, Route.INTERNAL);
            this.channelsSubject.next(await this.connect(fullUrl, ChannelType.INTERNAL, id));
        }
        else {
            throw new Error(`Invalid URL format: ${url}`);
        }
    }
    newInternalWebSocket(ws, id) {
        this.channelsSubject.next(new Channel(this.wc, ws, ChannelType.INTERNAL, id));
    }
    /**
     * Establish `WebSocket` with a server if `id` is not specified,
     * otherwise return an opened `Channel` with a peer identified by the
     * specified `id`.
     *
     * @param url Server URL
     * @param id  Peer id
     */
    async connect(url, type, id) {
        if (isURL(url) && url.search(/^wss?/) !== -1) {
        }
        else {
            throw new Error(`${url} is not a valid URL`);
        }
        const ws = new global.WebSocket(url);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (ws.readyState !== ws.OPEN) {
                    ws.close();
                    reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`));
                }
            }, CONNECT_TIMEOUT);
            const channel = new Channel(this.wc, ws, type, id);
            ws.onopen = () => {
                clearTimeout(timeout);
                if (type === ChannelType.INVITED) {
                    channel.initialize();
                }
                resolve(channel);
            };
            ws.onerror = (err) => reject(err);
            ws.onclose = (closeEvt) => {
                reject(new Error(`WebSocket connection to '${url}' failed with code ${closeEvt.code}: ${closeEvt.reason}`));
            };
        });
    }
    composeUrl(url, route, wcId = this.wc.id) {
        if (route === Route.INTERNAL) {
            return `${url}/${route}?wcId=${wcId}&senderId=${this.wc.myId}`;
        }
        else {
            return `${url}/${route}?wcId=${wcId}&key=${this.wc.key}`;
        }
    }
}
WebSocketBuilder.listenUrl = new BehaviorSubject('');
