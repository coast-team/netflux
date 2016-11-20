import Util from 'Util'
import Service from 'service/Service'
const WebSocket = Util.getLib(Util.WEB_SOCKET_LIB)

const CONNECT_TIMEOUT = 10000

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
            reject(`WebSocket connection timeout with ${url}`)
          }
        }, CONNECT_TIMEOUT)
      } catch (err) {
        reject(err.message)
      }
    })
  }

}

export default WebSocketService
