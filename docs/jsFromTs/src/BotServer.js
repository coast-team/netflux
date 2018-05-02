// import { log } from './misc/Util'
import { defaultOptions } from './WebChannel';
import { wcs, WebGroup } from './WebChannelFacade';
import { Route, WebSocketBuilder } from './WebSocketBuilder';
const urlLib = require('url');
const uws = require('uws');
export class BotServer {
    constructor({ url = '', perMessageDeflate = false, server, webGroupOptions = {
            topology: defaultOptions.topology,
            signalingServer: defaultOptions.signalingServer,
            rtcConfiguration: defaultOptions.rtcConfiguration,
            autoRejoin: false,
        }, }) {
        this.wcOptions = Object.assign({}, defaultOptions, { autoRejoin: false }, webGroupOptions);
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
            const { route, wcId, senderId } = this.readUrl(ws.upgradeReq.url);
            let wg = this.webGroups.get(wcId);
            if (route === Route.INTERNAL) {
                if (wg) {
                    const wc = wcs.get(wg);
                    wc.webSocketBuilder.newInternalWebSocket(ws, senderId);
                }
                else {
                    ws.close(4000, 'WebGroup no longer exist');
                }
            }
            else if (route === Route.INVITE || route === Route.JOIN) {
                if (!wg || wg.members.length === 1) {
                    wg = new WebGroup(this.wcOptions);
                    this.webGroups.set(wcId, wg);
                    this.onWebGroup(wg);
                }
                // FIXME: it is possible to create multiple WebChannels with the same ID
                const wc = wcs.get(wg);
                wc.id = wcId;
                if (route === Route.INVITE) {
                    wc.webSocketBuilder.newInviteWebSocket(ws, senderId);
                }
                else {
                    wc.webSocketBuilder.newJoinWebSocket(ws);
                }
            }
            else {
                ws.close(4000, 'Unknown route');
            }
        });
    }
    validateConnection(info) {
        const { route, wcId, senderId } = this.readUrl(info.req.url);
        if (wcId === undefined) {
            return false;
        }
        switch (route) {
            case Route.INTERNAL:
                return !!senderId && this.webGroups.has(wcId);
            case Route.INVITE:
                const wg = this.webGroups.get(wcId);
                return (wg === undefined || wg.members.length === 1) && !!senderId;
            case Route.JOIN:
                return wg !== undefined && wg.members.length > 1;
            default:
                return false;
        }
    }
    readUrl(url) {
        const { pathname, query: { senderId, wcId }, } = urlLib.parse(url, true);
        return {
            route: pathname.replace('/', ''),
            wcId: wcId ? Number(wcId) : undefined,
            senderId: senderId ? Number(senderId) : undefined,
        };
    }
}
