/// <reference types="node" />
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { IBotOptions as BotOptions } from './Bot';
import { WebGroup } from './WebChannelFacade';
export { BotOptions };
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
 * const server = http.createServer()
 * const bot = new Bot({
 *   server,
 *   webGroupOptions: {
 *     signalingServer: 'wss://mysignaling.com',
 *     rtcConfiguration: {
 *       iceServers: [
 *         {
 *           urls: 'stun.l.google.com:19302'
 *         },
 *         {
 *           urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
 *           username: 'user',
 *           password: 'password'
 *         }
 *       ]
 *     }
 *   }
 * })
 *
 * bot.onWebGroup = (wg) => {
 *   // YOUR CODE
 * }
 *
 * bot.onError = (err) => {
 *   // YOUR CODE
 * }
 *
 * server.listen(BOT_PORT, BOT_HOST)
 */
export declare class Bot {
    server: HttpServer | HttpsServer;
    perMessageDeflate: boolean;
    webGroups: Map<number, WebGroup>;
    url: string;
    leaveOnceAlone: boolean;
    onWebGroup: (((wg: WebGroup) => void)) | undefined | null;
    onError: (((err: Error) => void)) | undefined | null;
    /**
     * @param {BotOptions} options
     * @param {HttpServer|HttpsServer} options.server NodeJS http(s) server.
     * @param {string} [options.url] Bot server URL.
     * @param {boolean} [options.perMessageDeflate=false] Enable/disable permessage-deflate.
     * @param {boolean} [options.leaveOnceAlone=false] If true, bot will live (disconnect from the signaling server) if no other peers left in the group.
     * @param {WebGroupOptions} options.webGroupOptions Options for each {@link WebGroup} the bot is member of.
     * @param {Topology} [options.webGroupOptions.topology=Topology.FULL_MESH]
     * @param {string} [options.webGroupOptions.signalingServer='wss://signaling.netflux.coedit.re']
     * @param {RTCConfiguration} [options.webGroupOptions.rtcConfiguration={iceServers: [{urls: 'stun:stun3.l.google.com:19302'}]}]
     * @param {boolean} [options.webGroupOptions.autoRejoin=true]
     */
    constructor(options: BotOptions);
}
