import { Subject } from 'node_modules/rxjs/Subject'
import { BehaviorSubject } from 'node_modules/rxjs/BehaviorSubject'
import 'node_modules/rxjs/add/operator/filter'

import { Util } from 'Util'
import { Channel } from 'Channel'
const WebSocket = Util.require(Util.WEB_SOCKET)

const CONNECT_TIMEOUT = 3000
const listenSubject = new BehaviorSubject('')

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {
  constructor (wc) {
    this.wc = wc
    this.channelStream = new Subject()
  }

  static listen () {
    return listenSubject
  }

  static newIncomingSocket (wc, ws, senderId) {
    wc.webSocketBuilder.channelStream.next(new Channel(ws, wc, senderId))
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
        const channel = new Channel(ws, this.wc, id)
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
}
