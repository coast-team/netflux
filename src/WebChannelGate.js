import {provide, WEBRTC} from './serviceProvider'

/**
 * This class represents a door of the *WebChannel* for this peer. If the door
 * is open, then clients can join the *WebChannel* through this peer, otherwise
 * they cannot.
 */
class WebChannelGate {

  /**
   * When the *WebChannel* is open, any clients should you this data to join
   * the *WebChannel*.
   * @typedef {Object} WebChannelGate~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * @typedef {Object} WebChannelGate~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * @param {WebChannelGate~onClose} onClose - close event handler
   */
  constructor (onClose) {
    /**
     * Web socket which holds the connection with the signaling server.
     * @private
     * @type {external:WebSocket}
     */
    this.socket = null

    /**
     * // TODO: add doc
     * @private
     * @type {WebChannelGate~AccessData}
     */
    this.accessData = {}

    /**
     * Close event handler.
     * @private
     * @type {WebChannelGate~onClose}
     */
    this.onClose = onClose
  }

  /**
   * Get access data.
   * @returns {WebChannelGate~AccessData|null} - Returns access data if the door
   * is opened and *null* if it closed
   */
  getAccessData () {
    return this.accessData
  }

  /**
   * Open the door.
   * @param {external:WebSocket} socket - Web socket to signalign server
   * @param {WebChannelGate~AccessData} accessData - Access data to join the
   * *WebChannel
   */
  open (onChannel, url) {
    return new Promise((resolve, reject) => {
      let cBuilder = provide(WEBRTC)
      let key = this.generateKey()
      try {
        let socket = new window.WebSocket(url)
        socket.onopen = () => {
          this.socket = socket
          this.accessData.key = key
          this.accessData.url = url
          try {
            socket.send(JSON.stringify({key}))
          } catch (err) {
            reject(err.message)
          }
          // TODO: find a better solution than setTimeout. This is for the case when the key already exists and thus the server will close the socket, but it will close it after this function resolves the Promise.
          setTimeout(() => { resolve(this.accessData) }, 100, {url, key})
        }
        socket.onerror = (evt) => {
          console.error(`Error occured on WebChannel gate to ${url}. ${evt.type}`)
        }
        socket.onclose = (closeEvt) => {
          if (closeEvt.code !== 1000) {
            console.error(`WebChannel gate to ${url} has closed. ${closeEvt.code}: ${closeEvt.reason}`)
            reject(closeEvt.reason)
          }
          this.onClose(closeEvt)
        }
        cBuilder.listenFromSignaling(socket, onChannel)
      } catch (err) {
        reject(err.message)
      }
    })
  }

  /**
   * Check if the door is opened or closed.
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.socket.close()
      this.socket = null
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

export default WebChannelGate
