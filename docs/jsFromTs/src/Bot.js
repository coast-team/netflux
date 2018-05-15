// import { log } from './misc/util'
import { WebGroupState } from './index.common.doc';
import { webChannelDefaultOptions } from './WebChannel';
import { wcs, WebGroup } from './WebChannelFacade';
import { Route, WebSocketBuilder } from './WebSocketBuilder';
const urlLib = require('url');
const uws = require('uws');
const botDefaultOptions = {
    url: '',
    perMessageDeflate: false,
    leaveOnceAlone: true,
    server: undefined,
    webGroupOptions: webChannelDefaultOptions,
};
export class Bot {
    constructor(options) {
        this.wcOptions = Object.assign({}, webChannelDefaultOptions, options.webGroupOptions);
        const fullOptions = Object.assign({}, botDefaultOptions, options);
        fullOptions.webGroupOptions = this.wcOptions;
        console.log('full options: ', fullOptions);
        this.leaveOnceAlone = fullOptions.leaveOnceAlone;
        this.server = fullOptions.server;
        this.listenUrl = fullOptions.url;
        this.perMessageDeflate = fullOptions.perMessageDeflate;
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
            const info = this.server.address();
            return `ws://${info.address}:${info.port}`;
        }
    }
    init() {
        this.webSocketServer = new uws.Server({
            perMessageDeflate: this.perMessageDeflate,
            verifyClient: (info) => this.validateConnection(info),
            server: this.server,
        });
        const serverListening = this.server || this.webSocketServer;
        serverListening.on('listening', () => WebSocketBuilder.listenUrl.next(this.url));
        this.webSocketServer.on('error', (err) => {
            WebSocketBuilder.listenUrl.next('');
            this.onError(err);
        });
        this.webSocketServer.on('connection', (ws) => {
            const { route, wcId, senderId, key } = this.readUrl(ws.upgradeReq.url);
            switch (route) {
                case Route.INTERNAL: {
                    const wg = this.webGroups.get(wcId);
                    const wc = wcs.get(wg);
                    wc.webSocketBuilder.newInternalWebSocket(ws, senderId);
                    break;
                }
                case Route.JOIN: {
                    const wg = this.webGroups.get(wcId);
                    const wc = wcs.get(wg);
                    wc.webSocketBuilder.newJoinWebSocket(ws);
                    break;
                }
                case Route.INVITE: {
                    const wg = new WebGroup(this.wcOptions);
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
                    wc.webSocketBuilder.newInviteWebSocket(ws);
                    break;
                }
            }
        });
    }
    validateConnection(info) {
        const { route, wcId, senderId, key } = this.readUrl(info.req.url);
        if (wcId === undefined) {
            return false;
        }
        switch (route) {
            case Route.INTERNAL:
                return this.webGroups.has(wcId) && !!senderId;
            case Route.INVITE: {
                const wg = this.webGroups.get(wcId);
                return !!key && (wg === undefined || wg.state === WebGroupState.LEFT);
            }
            case Route.JOIN: {
                const wg = this.webGroups.get(wcId);
                return !!key && wg !== undefined && wg.key === key && wg.state !== WebGroupState.LEFT;
            }
            default:
                return false;
        }
    }
    readUrl(url) {
        const { pathname, query: { senderId, wcId, key }, } = urlLib.parse(url, true);
        return {
            route: pathname.replace('/', ''),
            wcId: wcId ? Number(wcId) : undefined,
            senderId: senderId ? Number(senderId) : undefined,
            key,
        };
    }
}
