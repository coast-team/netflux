import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/filter'

import { isURL } from './Util'
import { Channel } from './Channel'
import { WebSocket } from './polyfills'
import { WebChannel } from './service/WebChannel'

const CONNECT_TIMEOUT = 3000
const listenSubject = new BehaviorSubject('')

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {

  private wc: WebChannel
  private channelsSubject: Subject<Channel>

  static listen (): BehaviorSubject<string> {
    return listenSubject
  }

  static newIncomingSocket (wc, ws, senderId) {
    wc.webSocketBuilder.channelsSubject.next(new Channel(ws, wc, senderId))
  }

  constructor (wc: WebChannel) {
    this.wc = wc
    this.channelsSubject = new Subject()
  }

  /**
   * Establish `WebSocket` with a server.
   *
   * @param url Server url
   */
  connect (url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (isURL(url) && url.search(/^wss?/) !== -1) {
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

  /**
   * Establish a `Channel` with a server peer identified by `id`.
   *
   * @param url Server url
   * @param id  Peer id
   */
  connectTo (url: string, id: number): Promise<Channel> {
    const fullUrl = `${url}/internalChannel?wcId=${this.wc.id}&senderId=${this.wc.myId}`
    return new Promise((resolve, reject) => {
      if (isURL(url) && url.search(/^wss?/) !== -1) {
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

  channels (): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }
}
