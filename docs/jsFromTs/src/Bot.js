import * as urlLib from 'url';
import { Server } from 'uws';
import { Channel } from './Channel';
import { WebGroupState } from './index.common.doc';
import { log } from './misc/util';
import { webChannelDefaultOptions } from './WebChannel';
import { wcs, WebGroup } from './WebChannelFacade';
import { WebSocketBuilder } from './WebSocketBuilder';
const botDefaultOptions = {
    url: '',
    perMessageDeflate: false,
    leaveOnceAlone: true,
    server: undefined,
    webGroupOptions: webChannelDefaultOptions,
};
export class Bot {
    constructor(options) {
        this.wcOptions = { ...webChannelDefaultOptions, ...options.webGroupOptions };
        const { leaveOnceAlone, server, url, perMessageDeflate } = { ...botDefaultOptions, ...options };
        this.leaveOnceAlone = leaveOnceAlone;
        this.server = server;
        this.listenUrl = url;
        this.perMessageDeflate = perMessageDeflate;
        this.webGroups = new Map();
        this.onWebGroup = function none() { };
        this.onError = function none() { };
        // initialize server
        this.init();
    }
    get url() {
        if (this.listenUrl !== '') {
            return this.listenUrl;
        }
        else {
            const { address, port } = this.server.address();
            return `ws://${address}:${port}`;
        }
    }
    init() {
        this.webSocketServer = new Server({
            perMessageDeflate: this.perMessageDeflate,
            verifyClient: (info) => this.validateURLQuery(info),
            server: this.server,
        });
        const serverListening = this.server || this.webSocketServer;
        serverListening.on('listening', () => WebSocketBuilder.listenUrl.next(this.url));
        this.webSocketServer.on('error', (err) => {
            WebSocketBuilder.listenUrl.next('');
            this.onError(err);
        });
        this.webSocketServer.on('connection', (ws) => {
            const { type, wcId, senderId, key } = this.readURLQuery(ws.upgradeReq.url);
            let webSocketBuilder;
            let wg = this.webGroups.get(wcId);
            if (type === Channel.WITH_MEMBER && (wg === undefined || wg.state === WebGroupState.LEFT)) {
                wg = new WebGroup(this.wcOptions);
                this.webGroups.set(wcId, wg);
                const wc = wcs.get(wg);
                if (this.leaveOnceAlone) {
                    wc.onAlone = () => {
                        wc.leave();
                        this.webGroups.delete(wcId);
                    };
                }
                wc.init(key, wcId);
                this.onWebGroup(wg);
                wc.onMyId(wc.myId);
                webSocketBuilder = wc.webSocketBuilder;
            }
            else if (wg !== undefined) {
                webSocketBuilder = wcs.get(wg).webSocketBuilder;
            }
            else {
                ws.close();
                return;
            }
            webSocketBuilder.newWebSocket(ws, senderId, type);
        });
    }
    validateURLQuery(info) {
        try {
            const { type, wcId, key } = this.readURLQuery(info.req.url);
            switch (type) {
                case Channel.WITH_INTERNAL:
                    return this.webGroups.has(wcId);
                case Channel.WITH_MEMBER: {
                    const wg = this.webGroups.get(wcId);
                    return !!key && (wg === undefined || wg.state === WebGroupState.LEFT);
                }
                case Channel.WITH_JOINING: {
                    const wg = this.webGroups.get(wcId);
                    return !!key && wg !== undefined && wg.key === key && wg.state !== WebGroupState.LEFT;
                }
                default:
                    return false;
            }
        }
        catch (err) {
            log.warn(err.message);
            return false;
        }
    }
    readURLQuery(url) {
        const prefix = 'Query parse error: ';
        const { type, wcId, senderId, key } = urlLib.parse(url, true).query;
        if (typeof type !== 'string') {
            throw new Error(`${prefix}"type" parameter is not a string `);
        }
        if (typeof wcId !== 'string') {
            throw new Error(`${prefix}"wcId" parameter is not a string `);
        }
        if (typeof senderId !== 'string') {
            throw new Error(`${prefix}"senderId" parameter is not a string `);
        }
        if (typeof key !== 'string' && typeof key !== 'undefined') {
            throw new Error(`${prefix}"type" parameter is not a string `);
        }
        if (!type) {
            throw new Error(`${prefix}"type" parameter is undefined`);
        }
        if (!wcId) {
            throw new Error(`${prefix}"wcId" parameter is undefined`);
        }
        if (!senderId) {
            throw new Error(`${prefix}"senderId" parameter is undefined`);
        }
        return {
            type: Number.parseInt(type, 10),
            wcId: Number.parseInt(wcId, 10),
            senderId: Number.parseInt(senderId, 10),
            key,
        };
    }
}
