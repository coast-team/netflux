import { Server as NodeJSHttpServer } from 'http'
import { Server as NodeJSHttpsServer } from 'https'

import { Channel } from './Channel'
import { defaultOptions, IWebChannelOptions, WebChannel } from './service/WebChannel'
import { wcs, WebGroup } from './WebChannelFacade'
import { WebSocketBuilder } from './WebSocketBuilder'

const url = require('url')
const uws = require('uws')

export interface IBotServerOptions {
  url?: string,
  server: any,
  perMessageDeflate?: boolean
}

export const bsDefaults = {
  bot: {
    url: '',
    server: undefined,
    perMessageDeflate: false,
  },
}

/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export class BotServer {

  public server: NodeJSHttpServer | NodeJSHttpsServer
  public webGroups: Set<WebGroup>
  public onWebGroup: (wg: WebGroup) => void
  public onError: (err) => void

  private wcSettings: IWebChannelOptions
  private botSettings: IBotServerOptions
  private serverSettings: {
    perMessageDeflate: boolean,
    verifyClient: (info: any) => boolean,
    server: any,
  }

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
  constructor (options: any = {}) {
    const botDefaults = {
      bot: {
        url: '',
        server: undefined,
        perMessageDeflate: false,
      },
    }

    const wcOptions = Object.assign({}, defaultOptions, options)
    this.wcSettings = {
      topology: wcOptions.topology,
      signalingURL: wcOptions.signalingURL,
      iceServers: wcOptions.iceServers,
      autoRejoin: false,
    }
    this.botSettings = Object.assign({}, botDefaults.bot, options.bot)
    this.serverSettings = {
      perMessageDeflate: this.botSettings.perMessageDeflate,
      verifyClient: (info) => this.validateConnection(info),
      server: this.botSettings.server,
    }

    /**
     * @type {WebSocketServer}
     */
    this.server = null

    /**
     * @type {WebChannel[]}
     */
    this.webGroups = new Set()

    /**
     * @type {function(wc: WebChannel)}
     */
    this.onWebGroup = () => {}

    this.onError = () => {}

    this.init()
  }

  get url (): string {
    if (this.botSettings.url !== '') {
      return this.botSettings.url
    } else {
      const address = this.serverSettings.server.address()
      return `ws://${address.address}:${address.port}`
    }
  }

  /**
   * Get `WebChannel` identified by its `id`.
   */
  private getWebGroup (id: number): WebGroup {
    for (const wg of this.webGroups) {
      if (id === wg.id) {
        return wg
      }
    }
    return undefined
  }

  private init (): void {
    this.server = new uws.Server(this.serverSettings)
    const serverListening = this.serverSettings.server || this.server
    serverListening.on('listening', () => WebSocketBuilder.listen().next(this.url))

    this.server.on('error', (err) => {
      WebSocketBuilder.listen().next('')
      this.onError(err)
    })

    this.server.on('connection', (ws) => {
      const {pathname, query} = url.parse(ws.upgradeReq.url, true)
      const wcId = Number(query.wcId)
      let wg = this.getWebGroup(wcId)
      const senderId = Number(query.senderId)
      switch (pathname) {
      case '/invite': {
        if (wg && wg.members.length === 0) {
          this.webGroups.delete(wg)
        }
        // FIXME: it is possible to create multiple WebChannels with the same ID
        wg = new WebGroup(this.wcSettings)
        const wc = wcs.get(wg)
        wc.id = wcId
        this.webGroups.add(wg)
        this.onWebGroup(wg)
        const ch = new Channel(wc, ws, {id: senderId})
        break
      }
      case '/internalChannel': {
        if (wg !== undefined) {
          WebSocketBuilder.newIncomingSocket(wcs.get(wg), ws, senderId)
        } else {
          console.error('Cannot find WebChannel for a new internal channel')
        }
        break
      }
      }
    })
  }

  private validateConnection (info: any): boolean {
    const {pathname, query} = url.parse(info.req.url, true)
    const wcId = query.wcId ? Number(query.wcId) : undefined
    switch (pathname) {
    case '/invite':
      if (wcId) {
        const wg = this.getWebGroup(wcId)
        return (wg === undefined || wg.members.length === 0) && query.senderId
      }
      return false
    case '/internalChannel':
      return query.senderId && wcId && this.getWebGroup(wcId) !== undefined
    default:
      return false
    }
  }
}
