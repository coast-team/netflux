import { WebSocketBuilder } from './WebSocketBuilder';
import { defaultOptions } from './service/WebChannel';
import { WebGroup, wcs } from './WebChannelFacade';
import { Channel } from './Channel';
let uws;
let url;
try {
    url = require('url');
    uws = require('uws');
}
catch (err) {
    console.error(err.message);
}
export const bsDefaults = {
    bot: {
        url: '',
        server: undefined,
        perMessageDeflate: false
    }
};
/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export class BotServer {
    /**
     * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
     * plus `host` and `port` parameters.
     *
     * @param {Object} options
     * @param {FULL_MESH} [options.topology=FULL_MESH] Fully connected topology is the only one available for now
     * @param {string} [options.signalingURL='wss://www.coedit.re:10443'] Signaling server url
     * @param {RTCIceServer} [options.iceServers=[{urls:'stun3.l.google.com:19302'}]] Set of ice servers for WebRTC
     * @param {Object} [options.bot] Options for bot server
     * @param {string} [options.bot.url=''] Bot public URL to be shared on the p2p network
     * @param {Object} [options.bot.server=null] A pre-created Node.js HTTP server
     */
    constructor(options = {}) {
        const botDefaults = {
            bot: {
                url: '',
                server: undefined,
                perMessageDeflate: false
            }
        };
        let wcOptions = Object.assign({}, defaultOptions, options);
        this.wcSettings = {
            topology: wcOptions.topology,
            signalingURL: wcOptions.signalingURL,
            iceServers: wcOptions.iceServers,
            autoRejoin: false
        };
        this.botSettings = Object.assign({}, botDefaults.bot, options.bot);
        this.serverSettings = {
            perMessageDeflate: this.botSettings.perMessageDeflate,
            verifyClient: (info) => this.validateConnection(info),
            server: this.botSettings.server
        };
        /**
         * @type {WebSocketServer}
         */
        this.server = null;
        /**
         * @type {WebChannel[]}
         */
        this.webGroups = new Set();
        /**
         * @type {function(wc: WebChannel)}
         */
        this.onWebGroup = () => { };
        this.onError = () => { };
        this.init();
    }
    get url() {
        if (this.botSettings.url !== '') {
            return this.botSettings.url;
        }
        else {
            const address = this.serverSettings.server.address();
            return `ws://${address.address}:${address.port}`;
        }
    }
    /**
     * Get `WebChannel` identified by its `id`.
     */
    getWebGroup(id) {
        for (let wg of this.webGroups) {
            if (id === wg.id) {
                return wg;
            }
        }
        return undefined;
    }
    init() {
        this.server = new uws.Server(this.serverSettings);
        const serverListening = this.serverSettings.server || this.server;
        serverListening.on('listening', () => WebSocketBuilder.listen().next(this.url));
        this.server.on('error', err => {
            WebSocketBuilder.listen().next('');
            this.onError(err);
        });
        this.server.on('connection', ws => {
            const { pathname, query } = url.parse(ws.upgradeReq.url, true);
            const wcId = Number(query.wcId);
            let wg = this.getWebGroup(wcId);
            const senderId = Number(query.senderId);
            switch (pathname) {
                case '/invite': {
                    if (wg && wg.members.length === 0) {
                        this.webGroups.delete(wg);
                    }
                    // FIXME: it is possible to create multiple WebChannels with the same ID
                    wg = new WebGroup(this.wcSettings);
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
        const { pathname, query } = url.parse(info.req.url, true);
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
