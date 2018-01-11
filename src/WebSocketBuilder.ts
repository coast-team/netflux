import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { Channel } from './Channel'
import { isBrowser, isURL } from './misc/Util'
import { WebChannel } from './service/WebChannel'

const CONNECT_TIMEOUT = 5000
const listenSubject = new BehaviorSubject('')

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {

  static listen (): BehaviorSubject<string> {
    return listenSubject
  }

  static newIncomingSocket (wc, ws, senderId) {
    wc.webSocketBuilder.channelsSubject.next(new Channel(wc, ws, {id: senderId}))
  }

  private wc: WebChannel
  private channelsSubject: Subject<Channel>

  constructor (wc: WebChannel) {
    this.wc = wc
    this.channelsSubject = new Subject()
  }

  get onChannel (): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  /**
   * Establish `WebSocket` with a server if `id` is not specified,
   * otherwise return an opened `Channel` with a peer identified by the
   * specified `id`.
   *
   * @param url Server URL
   * @param id  Peer id
   */
  connect (url: string, id?: number): Promise<WebSocket | Channel> {
    return new Promise((resolve, reject) => {
      try {
        if (isURL(url) && url.search(/^wss?/) !== -1) {
          const fullUrl = id !== undefined ? `${url}/internalChannel?wcId=${this.wc.id}&senderId=${this.wc.myId}` : url
          const ws = new global.WebSocket(fullUrl)
          const timeout = setTimeout(() => {
            if (ws.readyState !== ws.OPEN) {
              reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`))
            }
          }, CONNECT_TIMEOUT)
          ws.onopen = () => {
            clearTimeout(timeout)
            if (id === undefined) {
              resolve(ws)
            } else {
              resolve(new Channel(this.wc, ws, {id}))
            }
          }
          ws.onerror = (err) => reject(err)
          ws.onclose = (closeEvt) => reject(new Error(
            `WebSocket connection to '${url}' failed with code ${closeEvt.code}: ${closeEvt.reason}`,
          ))
        } else {
          reject(new Error(`${url} is not a valid URL`))
        }
      } catch (err) {
        reject(err)
      }
    })
  }
}
