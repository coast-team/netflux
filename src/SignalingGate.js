import ServiceFactory, {WEB_RTC, WEB_SOCKET} from 'ServiceFactory'
import {OPEN} from 'service/WebSocketService'

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
class SignalingGate {

  /**
   * @param {WebChannel} wc
   */
  constructor (wc) {
    /**
     * @type {WebChannel}
     */
    this.webChannel = wc
    /**
     * Signaling server url.
     * @private
     * @type {string}
     */
    this.url = null
    /**
     * Key related to the `url`.
     * @private
     * @type {string}
     */
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
   *
   * @param {string} url Signaling server url
   * @param {function(ch: RTCDataChannel)} onChannel
   * @param {string} key
   * @returns {Promise<OpenData, string>}
   */
  open (url, onChannel, key = null) {
    return new Promise((resolve, reject) => {
      if (key === null) key = this.generateKey()
      ServiceFactory.get(WEB_SOCKET).connect(url)
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
              const msg = JSON.parse(evt.data)
              if ('isKeyOk' in msg) {
                if (msg.isKeyOk) {
                  ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
                    .listenFromSignaling(ws, onChannel)
                  this.ws = ws
                  this.key = key
                  this.url = url
                  resolve({url, key})
                } else reject(`${key} key already exists`)
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
   *
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.ws !== null && this.ws.readyState === OPEN
  }

  /**
   * Get open data.
   *
   * @returns {OpenData|null} Open data if the door is open and null otherwise
   */
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
   * Generate random key which will be used to join the `WebChannel`.
   *
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
