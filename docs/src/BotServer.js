import { Channel } from './Channel';
import { defaultOptions } from './service/WebChannel';
import { wcs, WebGroup } from './WebChannelFacade';
import { WebSocketBuilder } from './WebSocketBuilder';
const urlLib = require('url');
const uws = require('uws');
export class BotServer {
    constructor({ url = '', perMessageDeflate = false, server, webGroupOptions = {
            topology: defaultOptions.topology,
            signalingURL: defaultOptions.signalingURL,
            iceServers: defaultOptions.iceServers,
            autoRejoin: false,
        }, } = { server: undefined }) {
        // public
        this.wcOptions = Object.assign({}, defaultOptions, { autoRejoin: false }, webGroupOptions);
        this.server = server;
        this.listenUrl = url;
        this.perMessageDeflate = perMessageDeflate;
        // private
        this.webGroups = new Set();
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
    getWebGroup(id) {
        for (const wg of this.webGroups) {
            if (id === wg.id) {
                return wg;
            }
        }
        return undefined;
    }
    init() {
        this.webSocketServer = new uws.Server({
            perMessageDeflate: this.perMessageDeflate,
            verifyClient: (info) => this.validateConnection(info),
            server: this.server,
        });
        const serverListening = this.server || this.webSocketServer;
        serverListening.on('listening', () => WebSocketBuilder.listen().next(this.url));
        this.webSocketServer.on('error', (err) => {
            WebSocketBuilder.listen().next('');
            this.onError(err);
        });
        this.webSocketServer.on('connection', (ws) => {
            const { pathname, query } = urlLib.parse(ws.upgradeReq.url, true);
            const wcId = Number(query.wcId);
            let wg = this.getWebGroup(wcId);
            const senderId = Number(query.senderId);
            switch (pathname) {
                case '/invite': {
                    if (wg && wg.members.length === 0) {
                        this.webGroups.delete(wg);
                    }
                    // FIXME: it is possible to create multiple WebChannels with the same ID
                    wg = new WebGroup(this.wcOptions);
                    const wc = wcs.get(wg);
                    wc.id = wcId;
                    this.webGroups.add(wg);
                    this.onWebGroup(wg);
                    const ch = new Channel(wc, ws, { id: senderId });
                    break;
                }
                case '/internalChannel': {
                    if (wg !== undefined) {
                        WebSocketBuilder.newIncomingSocket(wcs.get(wg), ws, senderId);
                    }
                    else {
                        console.error('Cannot find WebChannel for a new internal channel');
                    }
                    break;
                }
            }
        });
    }
    validateConnection(info) {
        const { pathname, query } = urlLib.parse(info.req.url, true);
        const wcId = query.wcId ? Number(query.wcId) : undefined;
        switch (pathname) {
            case '/invite':
                if (wcId) {
                    const wg = this.getWebGroup(wcId);
                    return (wg === undefined || wg.members.length === 0) && query.senderId;
                }
                return false;
            case '/internalChannel':
                return query.senderId && wcId && this.getWebGroup(wcId) !== undefined;
            default:
                return false;
        }
    }
}
