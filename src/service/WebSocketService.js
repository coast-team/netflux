import { Subject } from 'node_modules/rxjs/Subject'
import { BehaviorSubject } from 'node_modules/rxjs/BehaviorSubject'
import 'node_modules/rxjs/add/operator/filter'

import { Util } from 'Util'
const WebSocket = Util.require(Util.WEB_SOCKET)

const CONNECT_TIMEOUT = 3000
const listenSubject = new BehaviorSubject('')

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketService {
  constructor (wc) {
    this.wc = wc
    this.channelStream = new Subject()
  }

  static listen () {
    return listenSubject
  }

  static newIncomingSocket (wc, ws, senderId) {
    wc.webSocketSvc.channelStream.next(wc._initConnection(ws, senderId))
  }

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

  connectTo (url, id) {
    const fullUrl = `${url}/internalChannel?wcId=${this.wc.id}&senderId=${this.wc.myId}`
    return new Promise((resolve, reject) => {
      if (Util.isURL(url) && url.search(/^wss?/) !== -1) {
        const ws = new WebSocket(fullUrl)
        const channel = this.wc._initConnection(ws, id)
        ws.onopen = () => resolve(channel)
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

  channels () {
    return this.channelStream.asObservable()
  }

  connectToSignaling (url) {
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
