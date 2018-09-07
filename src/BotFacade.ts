import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Bot as BotServer, IBotOptions as BotOptions } from './Bot'
import { WebGroup } from './WebChannelFacade'

let botServer: BotServer
export { BotOptions }

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
export class Bot {
  public server: HttpServer | HttpsServer
  public perMessageDeflate: boolean
  public webGroups: Map<number, WebGroup>
  public url: string
  public leaveOnceAlone: boolean
  public onWebGroup: (((wg: WebGroup) => void)) | undefined | null
  public onError: (((err: Error) => void)) | undefined | null

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
  constructor(options: BotOptions) {
    botServer = new BotServer(options)

    /**
     * Read-only NodeJS http server instance.
     * @type {HttpServer|HttpsServer}
     */
    this.server = undefined as any
    Reflect.defineProperty(this, 'server', {
      configurable: false,
      enumerable: true,
      get: () => botServer.server,
    })

    /**
     * Read-only property of WebSocket server: permessage-deflate.
     * @type {HttpServer|HttpsServer}
     */
    this.perMessageDeflate = undefined as any
    Reflect.defineProperty(this, 'perMessageDeflate', {
      configurable: false,
      enumerable: true,
      get: () => botServer.perMessageDeflate,
    })

    /**
     * Read-only property leaveOnceAlone.
     * @type {HttpServer|HttpsServer}
     */
    this.leaveOnceAlone = undefined as any
    Reflect.defineProperty(this, 'leaveOnceAlone', {
      configurable: false,
      enumerable: true,
      get: () => botServer.leaveOnceAlone,
    })

    /**
     * Read-only set of web groups the bot is member of.
     * @type {Set<WebGroup>}
     */
    this.webGroups = undefined as any
    Reflect.defineProperty(this, 'webGroups', {
      configurable: false,
      enumerable: true,
      get: () => botServer.webGroups,
    })

    /**
     * Bot server url. Used to invite the bot in a web group via {@link WebGroup#invite} method.
     * @type {string}
     */
    this.url = undefined as any
    Reflect.defineProperty(this, 'url', {
      configurable: false,
      enumerable: true,
      get: () => botServer.url,
    })

    /**
     * This handler is called when the bot has been invited into a group by one of its members.
     * @type  {function(wg: WebGroup)} handler
     */
    this.onWebGroup = undefined as any
    Reflect.defineProperty(this, 'onWebGroup', {
      configurable: true,
      enumerable: true,
      get: () => (botServer.onWebGroup.name === 'none' ? undefined : botServer.onWebGroup),
      set: (handler: (wg: WebGroup) => void) => {
        if (typeof handler !== 'function') {
          botServer.onWebGroup = function none() {}
        } else {
          botServer.onWebGroup = handler
        }
      },
    })

    /**
     * This handler is called when an error occurs on WebSocket server.
     * @type  {function(err: Error)}
     */
    this.onError = undefined as any
    Reflect.defineProperty(this, 'onError', {
      configurable: true,
      enumerable: true,
      get: () => (botServer.onError.name === 'none' ? undefined : botServer.onError),
      set: (handler: (err: Error) => void) => {
        if (typeof handler !== 'function') {
          botServer.onError = function none() {}
        } else {
          botServer.onError = handler
        }
      },
    })
  }
}
