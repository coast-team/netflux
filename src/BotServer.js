import WebChannel from 'WebChannel'
import {provide, WEB_SOCKET, CHANNEL_BUILDER, FULLY_CONNECTED} from 'serviceProvider'

const MESSAGE_TYPE_ERROR = 4000
const MESSAGE_UNKNOWN_ATTRIBUTE = 4001

/**
 * @external {WebSocketServer} https://github.com/websockets/ws/blob/master/doc/ws.md#class-wsserver
 */

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
   * @property {WEB_RTC|WEB_SOCKET} [options.connector=WEB_SOCKET] Which connector is preferable during connection establishment
   * @property {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
   * @property {string} [options.signalingURL='wss://sigver-coastteam.rhcloud.com:8443'] Signaling server url
   * @property {RTCIceServer} [options.iceServers=[{urls:'stun:turn01.uswest.xirsys.com'}]] Set of ice servers for WebRTC
   * @property {string} [options.host='localhost']
   * @property {number} [options.port=9000]
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
    this.onWebChannel = wc => {}
  }

  /**
   * Starts listen on socket.
   *
   * @returns {Promise<, string>}
   */
  start () {
    return new Promise((resolve, reject) => {
      let WebSocketServer = require('ws').Server
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
        reject(`Server error: ${err.messsage}`)
      })

      this.server.on('connection', ws => {
        ws.onmessage = msgEvt => {
          try {
            let msg = JSON.parse(msgEvt.data)
            if ('join' in msg) {
              let wc = this.getWebChannel(msg.join)
              if (wc === null) {
                ws.send(JSON.stringify({isKeyOk: false}))
              } else {
                ws.send(JSON.stringify({isKeyOk: true, useThis: true}))
                wc.invite(ws)
              }
            } else if ('wcId' in msg) {
              let wc = this.getWebChannel(msg.wcId)
              if (wc === null) {
                console.log('Listen on: ' + this.settings.listenOn)
                if (wc === null) wc = new WebChannel(this.settings)
                wc.id = msg.wcId
                this.addWebChannel(wc)
                wc.join(ws).then(() => { this.onWebChannel(wc) })
              } else if ('senderId' in msg) {
                provide(CHANNEL_BUILDER).onChannel(wc, ws, msg.senderId)
              } else {
                ws.close(MESSAGE_UNKNOWN_ATTRIBUTE, 'Unsupported message protocol')
              }
            }
          } catch (err) {
            ws.close(MESSAGE_TYPE_ERROR, 'msg')
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
   * @param {type} wc Description
   *
   * @returns {type} Description
   */
  addWebChannel (wc) {
    this.webChannels[this.webChannels.length] = wc
  }
}

export default BotServer
