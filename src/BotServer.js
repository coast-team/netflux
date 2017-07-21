import { WebSocketBuilder } from './WebSocketBuilder'
import { WebChannel } from './service/WebChannel'
import { Channel } from './Channel'
import { defaults } from './defaults'
import * as log from './log'

const url = require('url')

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
  constructor (options = {}) {
    const botDefaults = {
      bot: {
        url: '',
        server: undefined,
        perMessageDeflate: false
      }
    }

    let wcOptions = Object.assign({}, defaults, options)
    this.wcSettings = {
      topology: wcOptions.topology,
      signalingURL: wcOptions.signalingURL,
      iceServers: wcOptions.iceServers
    }
    this.botSettings = Object.assign({}, botDefaults.bot, options.bot)
    this.serverSettings = {
      perMessageDeflate: this.botSettings.perMessageDeflate,
      verifyClient: (info) => this.validateConnection(info),
      server: this.botSettings.server
    }

    /**
     * @type {WebSocketServer}
     */
    this.server = null

    /**
     * @type {WebChannel[]}
     */
    this.webChannels = []

    /**
     * @type {function(wc: WebChannel)}
     */
    this.onWebChannel = () => {}

    this.onWebChannelReady = () => {}

    this.onError = () => {}

    this.init()
  }

  get url () {
    if (this.botSettings.url !== '') {
      return this.botSettings.url
    } else {
      const address = this.serverSettings.server.address()
      return `ws://${address.address}:${address.port}`
    }
  }

  init () {
    let WebSocketServer = require('uws').Server
    this.server = new WebSocketServer(this.serverSettings)
    const serverListening = this.serverSettings.server || this.server
    serverListening.on('listening', () => WebSocketBuilder.listen().next(this.url))

    this.server.on('error', err => {
      WebSocketBuilder.listen().next('')
      this.onError(err)
    })

    this.server.on('connection', ws => {
      const {pathname, query} = url.parse(ws.upgradeReq.url, true)
      const wcId = Number(query.wcId)
      let wc = this.getWebChannel(wcId)
      const senderId = Number(query.senderId)
      switch (pathname) {
        case '/invite': {
          if (wc && wc.members.length === 0) {
            this.removeWebChannel(wc)
          }
          wc = new WebChannel(this.wcSettings)
          wc.id = wcId
          this.addWebChannel(wc)
          this.onWebChannel(wc)
          wc.join(new Channel(ws, wc, senderId)).then(() => {
            this.onWebChannelReady(wc)
          })
          break
        }
        case '/internalChannel': {
          if (wc !== undefined) {
            WebSocketBuilder.newIncomingSocket(wc, ws, senderId)
          } else {
            log.error('Cannot find WebChannel for a new internal channel')
          }
          break
        }
      }
    })
  }

  /**
   * Get `WebChannel` identified by its `id`.
   *
   * @param {number} id
   *
   * @returns {WebChannel|null}
   */
  getWebChannel (id) {
    for (let wc of this.webChannels) {
      if (id === wc.id) return wc
    }
    return undefined
  }

  /**
   * Add `WebChannel`.
   *
   * @param {WebChannel} wc
   */
  addWebChannel (wc) {
    this.webChannels[this.webChannels.length] = wc
  }

  /**
   * Remove `WebChannel`
   *
   * @param {WebChannel} wc
   */
  removeWebChannel (wc) {
    this.webChannels.splice(this.webChannels.indexOf(wc), 1)
  }

  validateConnection (info) {
    const {pathname, query} = url.parse(info.req.url, true)
    const wcId = query.wcId ? Number(query.wcId) : undefined
    switch (pathname) {
      case '/invite':
        if (wcId) {
          const wc = this.getWebChannel(wcId)
          return (wc === undefined || wc.members.length === 0) && query.senderId
        }
        return false
      case '/internalChannel':
        return query.senderId && wcId && this.getWebChannel(wcId)
      default:
        return false
    }
  }
}
