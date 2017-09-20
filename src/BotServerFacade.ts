import { Server as NodeJSHttpServer } from 'http'
import { Server as NodeJSHttpsServer } from 'https'

import { WebSocketBuilder } from './WebSocketBuilder'
import { WebGroup } from './WebChannelFacade'
import { BotServer, BotServerOptions as WebGroupBotServerOptions } from './BotServer'

let botServer: BotServer

export { WebGroupBotServerOptions }

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
 *   signalingURL: 'wss://mysignaling.com'
 *   iceServers: [
 *     {
 *       urls: 'stun.l.google.com:19302'
 *     },
 *     {
 *       urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
 *       username: 'user',
 *       password: 'password'
 *     }
 *   ],
 *   bot: { server }
 * })
 *
 * bot.onWebGroup = (wg) => {
 *   // TODO...
 * }
 *
 * server.listen(BOT_PORT, BOT_HOST)
 */
export class WebGroupBotServer {

  public server: NodeJSHttpServer | NodeJSHttpsServer
  public webGroups: Set<WebGroup>
  public url: string

  /**
   * @param {WebGroupBotServerOptions} options
   * @param {TopologyEnum} [options.topology=TopologyEnum.FULL_MESH]
   * @param {string} [options.signalingURL='wss://www.coedit.re:20473']
   * @param {RTCIceServer[]} [options.iceServers=[{urls: 'stun:stun3.l.google.com:19302'}]]
   * @param {boolean} [options.autoRejoin=false]
   * @param {Object} options.bot
   * @param {NodeJSHttpServer|NodeJSHttpsServer} options.bot.server NodeJS http(s) server.
   * @param {string} [options.bot.url] Bot server URL.
   * @param {boolean} [options.bot.perMessageDeflate=false] Enable/disable permessage-deflate.
   */
  constructor (options: WebGroupBotServerOptions) {
    botServer = new BotServer(options)

    /**
     * NodeJS http server instance (See https://nodejs.org/api/http.html)
     * @type {NodeJSHttpServer|NodeJSHttpsServer}
     */
    this.server = undefined
    Reflect.defineProperty(this, 'server', { configurable: false, enumerable: true, get: () => botServer.server })
    /**
     * Set of web groups the bot is member of.
     * @type {Set<WebGroup>}
     */
    this.webGroups = undefined
    Reflect.defineProperty(this, 'webGroups', { configurable: false, enumerable: true, get: () => botServer.webGroups })
    /**
     * Bot server url. Used to invite the bot in a web group via {@link WebGroup#invite} method.
     * @type {string}
     */
    this.url = undefined
    Reflect.defineProperty(this, 'url', { configurable: false, enumerable: true, get: () => botServer.url })
  }

  /**
   * This handler is called when the bot has been invited into a web group by one its members.
   * @type  {function(wg: WebGroup)} handler
   */
  set onWebGroup (handler: (wg: WebGroup) => void) { botServer.onWebGroup = handler }

}
