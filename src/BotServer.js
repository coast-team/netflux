import { BotHelper } from 'service/WebSocketService'
import { WebChannel } from 'WebChannel'
import { Util } from 'Util'
import { defaults } from 'defaults'
import * as log from 'log'

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
   * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
   * @param {string} [options.signalingURL='wss://www.coedit.re:10473'] Signaling server url
   * @param {RTCIceServer} [options.iceServers=[{urls:'stun3.l.google.com:19302'}]] Set of ice servers for WebRTC
   * @param {Object} [options.bot] Options for bot server
   * @param {string} [options.bot.protocol='wss'] Bot protocol to be transmitted to other peers to connect to bot
   * @param {string} [options.bot.host='127.0.0.1'] Bot hostname where to bing the server
   * @param {number} [options.bot.port=8080] Bot port where to bind the server
   * @param {Object} [options.bot.server=null] A pre-created Node.js HTTP server
   */
  constructor (options = {}) {
    const botDefaults = {
      bot: {
        protocol: 'wss',
        host: '127.0.0.1',
        port: 8080,
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
      verifyClient: (info) => this.validateConnection(info)
    }
    if (this.botSettings.server) {
      this.serverSettings.server = this.botSettings.server
    } else {
      this.serverSettings.host = this.botSettings.host
      this.serverSettings.port = this.botSettings.port
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
    return `${this.botSettings.protocol}://${this.host}:${this.port}`
  }

  get host () {
    if (this.serverSettings.server) {
      return this.serverSettings.server.address().address
    } else {
      return this.serverSettings.host
    }
  }

  get port () {
    if (this.serverSettings.server) {
      return this.serverSettings.server.address().port
    } else {
      return this.serverSettings.port
    }
  }

  init () {
    let WebSocketServer = this.selectWebSocketServer()
    this.server = new WebSocketServer(this.serverSettings)
    const serverListening = this.serverSettings.server || this.server
    serverListening.on('listening', () => BotHelper.listen(this.url))

    this.server.on('error', err => {
      BotHelper.listen('')
      this.onError(err)
    })

    this.server.on('connection', ws => {
      const {pathname, query} = url.parse(ws.upgradeReq.url, true)
      const wcId = Number(query.wcId)
      let wc = this.getWebChannel(wcId)
      switch (pathname) {
        case '/invite': {
          if (wc && wc.members.length === 0) {
            this.removeWebChannel(wc)
          }
          wc = new WebChannel(this.wcSettings)
          wc.id = wcId
          log.info('Bot invitation', {wcId})
          this.addWebChannel(wc)
          this.onWebChannel(wc)
          wc.join(ws).then(() => {
            log.info('Bot successfully joined', {wcId})
            this.onWebChannelReady(wc)
          })
          break
        }
        case '/internalChannel': {
          const senderId = Number(query.senderId)
          log.info('Bot internal channel', {wcId, senderId})
          BotHelper.wsStream.next({wc, ws, senderId})
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
          return wc === undefined || wc.members.length === 0
        }
        return false
      case '/internalChannel':
        return query.senderId && wcId && this.getWebChannel(wcId)
      default:
        return false
    }
  }

  selectWebSocketServer () {
    let WebSocketServer
    try {
      WebSocketServer = require('uws').Server
      return WebSocketServer
    } catch (err) {
      console.log(`${err.message}. Try to use ws module.`)
      WebSocketServer = Util.require('ws').Server
      return WebSocketServer
    }
  }
}
