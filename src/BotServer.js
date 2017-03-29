import ServiceFactory, {WEB_SOCKET, CHANNEL_BUILDER, FULLY_CONNECTED} from 'ServiceFactory'
import WebChannel from 'WebChannel'
import Util from 'Util'

const MESSAGE_TYPE_ERROR = 4000
const WEB_CHANNEL_NOT_FOUND = 4001

/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
class BotServer {
  /**
   * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
   * plus `host` and `port` parameters.
   *
   * @param {Object} options
   * @param {WEB_RTC|WEB_SOCKET} [options.connector=WEB_SOCKET] Which connector is preferable during connection establishment
   * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
   * @param {string} [options.signalingURL='wss://sigver-coastteam.rhcloud.com:8443'] Signaling server url
   * @param {RTCIceServer} [options.iceServers=[{urls:'stun:turn01.uswest.xirsys.com'}]] Set of ice servers for WebRTC
   * @param {string} [options.host='localhost']
   * @param {number} [options.port=9000]
   */
  constructor (options = {}) {
    /**
     * Default settings.
     * @private
     * @type {Object}
     */
    this.defaultSettings = {
      connector: WEB_SOCKET,
      topology: FULLY_CONNECTED,
      signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'}
      ],
      host: 'localhost',
      port: 9000
    }

    /**
     * @private
     * @type {Object}
     */
    this.settings = Object.assign({}, this.defaultSettings, options)
    this.settings.listenOn = `ws://${this.settings.host}:${this.settings.port}`

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
        console.log('uws module would be used for Bot server')
        WebSocketServer = require('uws').Server
      } catch (err) {
        try {
          console.log(`${err.message}. ws module will be used for Bot server instead`)
          WebSocketServer = Util.require('ws').Server
        } catch (err) {
          console.log(`${err.message}. Bot server cannot be run`)
        }
      }
      if (WebSocketServer === undefined) {
        console.log('Could not find uws module, thus ws module will be used for Bot server instead')
        WebSocketServer = Util.require('ws').Server
      }

      this.server = new WebSocketServer({
        host: this.settings.host,
        port: this.settings.port
      }, resolve)

      for (let wc of this.webChannels) {
        wc.settings.listenOn = this.settings.listenOn
      }

      this.server.on('error', (err) => {
        console.error('Server error: ', err)
        for (let wc of this.webChannels) {
          wc.settings.listenOn = ''
        }
        reject(err)
      })

      this.server.on('connection', ws => {
        ws.onmessage = msgEvt => {
          try {
            const msg = JSON.parse(msgEvt.data)
            if ('join' in msg) {
              const wc = this.getWebChannel(msg.join)
              if (wc === null) {
                ws.send(JSON.stringify({first: false, useThis: false}))
              } else {
                ws.send(JSON.stringify({first: false, useThis: true}))
                wc.invite(ws)
              }
            } else if ('wcId' in msg) {
              let wc = this.getWebChannel(msg.wcId)
              if ('senderId' in msg) {
                if (wc !== null) {
                  ServiceFactory.get(CHANNEL_BUILDER).onChannel(wc, ws, msg.senderId)
                } else {
                  ws.close(WEB_CHANNEL_NOT_FOUND, `${msg.wcId} webChannel was not found (message received from ${msg.senderId})`)
                  console.error(`${msg.wcId} webChannel was not found (message received from ${msg.senderId})`)
                }
              } else {
                if (wc === null) {
                  wc = new WebChannel(this.settings)
                  wc.id = msg.wcId
                  this.addWebChannel(wc)
                  wc.join(ws).then(() => { this.onWebChannel(wc) })
                } else if (wc.members.length === 0) {
                  this.removeWebChannel(wc)
                  wc = new WebChannel(this.settings)
                  wc.id = msg.wcId
                  this.addWebChannel(wc)
                  wc.join(ws).then(() => { this.onWebChannel(wc) })
                } else {
                  console.error(`Bot refused to join ${msg.wcId} webChannel, because it is already in use`)
                }
              }
            }
          } catch (err) {
            ws.close(MESSAGE_TYPE_ERROR, `Unsupported message type: ${err.message}`)
            console.error(`Unsupported message type: ${err.message}`)
          }
        }
      })
    })
  }

  /**
   * Stops listen on web socket.
   */
  stop () {
    for (let wc of this.webChannels) {
      wc.settings.listenOn = ''
    }
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
    return null
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
}

export default BotServer
