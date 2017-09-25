/// <reference types="node" />
import { Server as NodeJSHttpServer } from 'http';
import { Server as NodeJSHttpsServer } from 'https';
import { IBotServerOptions as WebGroupBotServerOptions } from './BotServer';
import { WebGroup } from './WebChannelFacade';
export { WebGroupBotServerOptions };
/**
 * Bot server may be a member of severals groups. Each group is isolated.
 * He can be invited by a group member via {@link WebGroup#invite} method.
 * @example
 * // In NodeJS:
 * // Create a bot server with full mesh topology, without autorejoin feature
 * // and with specified Signaling and ICE servers for WebRTC.
 * // Bot server is listening on 'ws://BOT_HOST:BOT_PORT'.
 *
 * const http = require('http')
 * const server = http.createServer(app.callback())
 * const bot = new WebGroupBotServer({
 *   server,
 *   webGroupOptions: {
 *     signalingURL: 'wss://mysignaling.com'
 *     iceServers: [
 *       {
 *         urls: 'stun.l.google.com:19302'
 *       },
 *       {
 *         urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
 *         username: 'user',
 *         password: 'password'
 *       }
 *     ]
 *   }
 * })
 *
 * bot.onWebGroup = (wg) => {
 *   // TODO...
 * }
 *
 * bot.onError = (err) => {
 *   // TODO...
 * }
 *
 * server.listen(BOT_PORT, BOT_HOST)
 */
export declare class WebGroupBotServer {
    server: NodeJSHttpServer | NodeJSHttpsServer;
    perMessageDeflate: boolean;
    webGroups: Set<WebGroup>;
    url: string;
    onWebGroup: (wg: WebGroup) => void;
    onError: (err: Error) => void;
    /**
     * @param {WebGroupBotServerOptions} options
     * @param {NodeJSHttpServer|NodeJSHttpsServer} options.server NodeJS http(s) server.
     * @param {string} [options.url] Bot server URL.
     * @param {boolean} [options.perMessageDeflate=false] Enable/disable permessage-deflate.
     * @param {WebGroupOptions} options.webGroupOptions Options for each {@link WebGroup} the bot is member of.
     * @param {Topology} [options.webGroupOptions.topology=Topology.FULL_MESH]
     * @param {string} [options.webGroupOptions.signalingURL='wss://www.coedit.re:30443']
     * @param {RTCIceServer[]} [options.webGroupOptions.iceServers=[{urls: 'stun:stun3.l.google.com:19302'}]]
     * @param {boolean} [options.webGroupOptions.autoRejoin=false]
     */
    constructor(options: WebGroupBotServerOptions);
}
