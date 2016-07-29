import {isBrowser} from 'helper'
import ServiceInterface from 'service/ServiceInterface'

const CONNECT_TIMEOUT = 5000
const WebSocket = isBrowser() ? window.WebSocket : require('ws')
const OPEN = WebSocket.OPEN

class WebSocketService extends ServiceInterface {

  constructor() { super() }

  /**
   * Creates WebSocket with server.
   * @param {string} url - Server url
   * @return {Promise} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        let ws = new WebSocket(url)
        ws.onopen = () => resolve(ws)
        ws.onerror = (evt) => {
          console.error(`WebSocket with ${url}: ${evt.type}`)
          reject(evt.type)
        }
        ws.onclose = (closeEvt) => {
          if (closeEvt.code !== 1000) {
            console.error(`WebSocket with ${url} closed. ${closeEvt.code}: ${closeEvt.reason}`)
            reject(closeEvt.reason)
          }
        }
        // Timeout for node (otherwise it will loop forever if incorrect address)
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            reject(`WebSocket connection timeout with ${url}`)
          }
        }, CONNECT_TIMEOUT)
      } catch (err) { reject(err.message) }
    })
  }

}

export default WebSocketService
export {OPEN}
