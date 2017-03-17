import Util from 'Util'
import Service from 'service/Service'
const WebSocket = Util.require(Util.WEB_SOCKET)

const CONNECT_TIMEOUT = 3000

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
class WebSocketService extends Service {
  /**
   * Creates WebSocket with server.
   *
   * @param {string} url - Server url
   * @returns {Promise<WebSocket, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url)
        ws.onopen = () => resolve(ws)
        // Timeout for node (otherwise it will loop forever if incorrect address)
        setTimeout(() => {
          if (ws.readyState !== ws.OPEN) {
            reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with ${url}`))
          }
        }, CONNECT_TIMEOUT)
      } catch (err) { reject(err) }
    })
  }
}

export default WebSocketService
