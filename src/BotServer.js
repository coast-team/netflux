import { BotHelper } from 'service/WebSocketService'
import { WebChannel } from 'WebChannel'
import { Util } from 'Util'
import { defaults } from 'defaults'

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
    let host
    let port
    if (this.botSettings.server) {
      this.serverSettings.server = this.botSettings.server
      host = this.settings.bot.server.address().address
      port = this.settings.bot.server.address().port
    } else {
      host = this.botSettings.host
      port = this.botSettings.port
      this.serverSettings.host = host
      this.serverSettings.port = port
    }
    this.url = `${this.botSettings.protocol}://${host}:${port}`

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
  }

  /**
   * Starts listen on socket.
   *
   * @returns {Promise<undefined,string>}
   */
  start () {
    return new Promise((resolve, reject) => {
      let WebSocketServer
      try {
        WebSocketServer = require('uws').Server
      } catch (err) {
        try {
          console.log(`${err.message}. ws module will be used for Bot server instead`)
          WebSocketServer = Util.require('ws').Server
        } catch (err) {
          console.log(`${err.message}. Bot server cannot be run`)
          reject(err)
        }
      }

      try {
        this.server = new WebSocketServer(this.serverSettings)
        BotHelper.listen(this.url)

        this.server.on('error', err => {
          BotHelper.listen('')
          reject(err)
        })

        this.server.on('connection', ws => {
          const {pathname, query} = url.parse(ws.upgradeReq.url, true)
          const wcId = Number(query.wcId)
          let wc = this.getWebChannel(wcId)
          switch (pathname) {
            case '/invite':
              console.log('Inviting to ' + wcId)
              if (wc && wc.members.length === 0) {
                this.removeWebChannel(wc)
              }
              wc = new WebChannel(this.wcSettings)
              wc.id = wcId
              this.addWebChannel(wc)
              wc.join(ws).then(() => this.onWebChannel(wc))
              break
            case '/internalChannel':
              BotHelper.wsStream.next({wc, ws, senderId: query.senderId})
              break
          }
        })
      } catch (err) {
        console.log('Bot server Error: ' + err.message)
        reject(err)
      }
    })
  }

  /**
   * Stops listen on web socket.
   */
  stop () {
    BotHelper.listen('')
    this.server.close()
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
}
