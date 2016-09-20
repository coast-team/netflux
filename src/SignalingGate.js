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
  constructor (onClose = () => {}) {
    /**
     * Web socket with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket}
     */
    this.ws = null

    /**
     * Access data. When the gate is open this object is not empty.
     * @type {SignalingGate~AccessData}
     */
    this.accessData = {}

    /**
     * Close event handler.
     * @private
     * @type {CloseEventHandler}
     */
    this.onClose = onClose
  }

  /**
   * Open the gate.
   * @param {channelEventHandler} onChannel Channel event handler
   * @param {SignalingGate~AccessData} accessData - Access data
   * @return {Promise}
   */
  open (onChannel, options) {
    let url = options.signaling

    return new Promise((resolve, reject) => {
      let webRTCService = provide(WEBRTC)
      let webSocketService = provide(WEBSOCKET)
      let key = 'key' in options ? options.key : this.generateKey()
      webSocketService.connect(url)
        .then(ws => {
          ws.onclose = closeEvt => {
            this.onClose(closeEvt)
            reject(closeEvt.reason)
          }
          ws.onerror = err => {
            console.log('ERROR: ', err)
            reject(err.message)
          }
          ws.onmessage = evt => {
            let msg
            try {
              msg = JSON.parse(evt.data)
            } catch (err) {
              reject('Server responce is not a JSON string: ' + err.message)
            }
            if ('isKeyOk' in msg) {
              if (msg.isKeyOk) {
                webRTCService.listenFromSignaling(ws, onChannel)

                resolve(this.accessData)
              } else {
                reject(`The key: ${key} is not suitable`)
              }
            } else {
              reject(`Unknown server message: ${evt.data}`)
            }
          }
          this.ws = ws
          this.accessData.key = key
          this.accessData.url = url
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

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.ws.close()
      this.accessData = {}
      this.ws = null
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
