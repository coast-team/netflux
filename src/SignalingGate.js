import {provide, WEBRTC, WEBSOCKET} from 'serviceProvider'
import {OPEN} from 'service/WebSocketService'

/**
 * This class represents a door of the *WebChannel* for this peer. If the door
 * is open, then clients can join the *WebChannel* through this peer, otherwise
 * they cannot.
 */
class SignalingGate {

  /**
   * Necessary data to join the *WebChannel*.
   * @typedef {Object} SignalingGate~AccessData
   * @property {string} url - Signaling server url
   * @property {string} key - The unique key to join the *WebChannel*
   */

  /**
   * @param {closeEventListener} onClose - close event handler
   */
  constructor (webChannel) {
    this.webChannel = webChannel
    this.url = null
    this.key = null
    /**
     * Web socket with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket}
     */
    this.ws = null
  }

  /**
   * Open the gate.
   * @param {channelEventHandler} onChannel Channel event handler
   * @param {SignalingGate~AccessData} accessData - Access data
   * @return {Promise}
   */
  open (url, onChannel, key = null) {
    return new Promise((resolve, reject) => {
      if (key === null) key = this.generateKey()
      provide(WEBSOCKET).connect(url)
        .then(ws => {
          ws.onclose = closeEvt => {
            this.key = null
            this.ws = null
            this.url = null
            this.webChannel.onClose(closeEvt)
            reject(closeEvt.reason)
          }
          ws.onerror = err => reject(err.message)
          ws.onmessage = evt => {
            try {
              let msg = JSON.parse(evt.data)
              if ('isKeyOk' in msg) {
                if (msg.isKeyOk) {
                  provide(WEBRTC, this.webChannel.settings.iceServers)
                    .listenFromSignaling(ws, onChannel)
                  this.ws = ws
                  this.key = key
                  this.url = url
                  resolve({url, key})
                } else reject(`The key "${key}" already exists`)
              } else reject(`Unknown message from ${url}: ${evt.data}`)
            } catch (err) {
              reject('Server responce is not a JSON string: ' + err.message)
            }
          }
          ws.send(JSON.stringify({key}))
        })
        .catch(reject)
    })
  }

  /**
   * Check if the door is opened or closed.
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.ws !== null && this.ws.readyState === OPEN
  }

  getOpenData () {
    if (this.isOpen()) {
      return {
        url: this.url,
        key: this.key
      }
    }
    return null
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.ws.close()
    }
  }

  /**
   * Generate random key which will be used to join the *WebChannel*.
   * @private
   * @returns {string} - Generated key
   */
  generateKey () {
    const MIN_LENGTH = 5
    const DELTA_LENGTH = 0
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * (MASK.length - 1))]
    }
    return result
  }
}

export default SignalingGate
