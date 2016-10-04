import {isBrowser} from 'helper'
import ServiceInterface from 'service/ServiceInterface'

const WebSocket = isBrowser() ? window.WebSocket : require('ws')
const CONNECT_TIMEOUT = 10000
const OPEN = WebSocket.OPEN

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
class WebSocketService extends ServiceInterface {

  /**
   * Creates WebSocket with server.
   *
   * @param {string} url - Server url
   * @returns {Promise<WebSocket, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        let ws = new WebSocket(url)
        ws.onopen = () => resolve(ws)
        // Timeout for node (otherwise it will loop forever if incorrect address)
        setTimeout(() => {
          if (ws.readyState !== OPEN) {
            reject(`WebSocket connection timeout with ${url}`)
          }
        }, CONNECT_TIMEOUT)
      } catch (err) { reject(err.message) }
    })
  }

}

export default WebSocketService
export {OPEN}
