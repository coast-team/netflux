import {ServiceInterface} from '../service'

/**
 * This class represents a door of the *WebChannel* for this peer. If the door
 * is open, then clients can join the *WebChannel* through this peer, otherwise
 * they cannot.
 */
class WebChannelGate {

  /**
   * @typedef {Object} WebChannelGate~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * @param {WebChannelGate~onClose} onClose - close event handler
   */
  constructor (onCloseHandler) {
    /**
     * Web socket which holds the connection with the signaling server.
     * @private
     * @type {external:WebSocket}
     */
    this.door = null

    /**
     * Web socket which holds the connection with the signaling server.
     * @private
     * @type {WebChannel~AccessData}
     */
    this.accessData = null

    /**
     * Close event handler.
     * @private
     * @type {WebChannelGate~onClose}
     */
    this.onCloseHandler = onCloseHandler
  }

  /**
   * Get access data.
   * @returns {WebChannel~AccessData|null} - Returns access data if the door
   * is opened and *null* if it closed
   */
  getAccessData () {
    return this.accessData
  }

  /**
   * Check if the door is opened or closed.
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.door !== null
  }

  /**
   * Open the door.
   * @param {external:WebSocket} door - Web socket to signalign server
   * @param {WebChannel~AccessData} accessData - Access data to join the
   * *WebChannel
   */
  setOpen (door, accessData) {
    this.door = door
    this.door.onclose = this.onCloseHandler
    this.accessData = accessData
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.door.close()
      this.door = null
    }
  }
}

class GateService extends ServiceInterface {
  constructor () {
    super()
  }

  create (wc, url) {
    return new Promise((resolve, reject) => {
      try {
        let socket = new window.WebSocket(url)
        socket.onopen = () => { wc.gate = socket }
        socket.onerror = (evt) => {
          console.error(`Error occured on WebChannel gate to ${url}. ${evt.type}`)
        }
        socket.onclose = (closeEvt) => {
          if (closeEvt.code !== 1000) {
            console.error(`WebChannel gate to ${url} has closed. ${closeEvt.code}: ${closeEvt.reason}`)
            reject(closeEvt.reason)
          }
        }
      } catch (err) {
        reject(err.message)
      }
    })
  }

  close (wc) {
    wc.gate.close()
  }
}

export {GateService}
