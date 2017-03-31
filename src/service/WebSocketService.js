import * as Rx from 'node_modules/rxjs/Subject'
import 'node_modules/rxjs/add/operator/filter'

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
      if (Util.isURL(url) && url.search(/^wss?/) !== -1) {
        const ws = new WebSocket(url)
        ws.onopen = () => resolve(ws)
        // Timeout for node (otherwise it will loop forever if incorrect address)
        setTimeout(() => {
          if (ws.readyState !== ws.OPEN) {
            reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with ${url}`))
          }
        }, CONNECT_TIMEOUT)
      } else {
        throw new Error(`${url} is not a valid URL`)
      }
    })
  }

  subject (url) {
    return this.connect(url)
      .then(socket => {
        const subject = new Rx.Subject()
        socket.onmessage = evt => {
          try {
            subject.next(JSON.parse(evt.data))
          } catch (err) {
            console.error(`Unknown message from websocket : ${socket.url}` + evt.data)
            socket.close(4000, err.message)
          }
        }
        socket.onerror = err => subject.error(err)
        socket.onclose = closeEvt => {
          if (closeEvt.code === 1000 || closeEvt.code === 0) {
            subject.complete()
          } else {
            subject.error(new Error(`${closeEvt.code}: ${closeEvt.reason}`))
          }
        }
        subject.send = msg => socket.send(msg)
        subject.close = (code, reason) => socket.close(code, reason)
        subject.socket = socket
        return subject
      })
  }
}

export default WebSocketService
