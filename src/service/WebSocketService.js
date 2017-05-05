import { Subject } from 'node_modules/rxjs/Subject'
import { BehaviorSubject } from 'node_modules/rxjs/BehaviorSubject'
import 'node_modules/rxjs/add/operator/filter'

import { Util } from 'Util'
import { Service } from 'service/Service'
const WebSocket = Util.require(Util.WEB_SOCKET)

const CONNECT_TIMEOUT = 3000
const isListening = new BehaviorSubject(false)
const wsStream = new Subject()
let url = ''

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketService extends Service {
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

  onWebSocket (wc) {
    if (url) {
      return wsStream.asObservable()
    }
    throw new Error('Peer is not listening on WebSocket')
  }

  subject (url) {
    return this.connect(url)
      .then(socket => {
        const subject = new Subject()
        socket.onmessage = evt => {
          try {
            subject.next(JSON.parse(evt.data))
          } catch (err) {
            console.error(`WebSocket message error from ${socket.url}: ${err.message}` + evt.data)
            socket.close(4000, err.message)
          }
        }
        socket.onerror = err => subject.error(err)
        socket.onclose = closeEvt => {
          if (closeEvt.code === 1000) {
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

export class WebSocketChecker {
  static isListening () {
    return isListening.asObservable()
  }

  static get url () {
    return url
  }
}

export class BotHelper {
  static listen (serverUrl) {
    url = serverUrl
    if (serverUrl) {
      isListening.next(true)
    } else {
      isListening.next(false)
    }
  }

  static get wsStream () { return wsStream }
}
