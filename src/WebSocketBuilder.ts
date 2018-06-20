import { BehaviorSubject, Observable, Subject } from 'rxjs'

import { Channel } from './Channel'
import { env } from './misc/env'
import { validateWebSocketURL } from './misc/util'
import { WebChannel } from './WebChannel'

export const CONNECT_TIMEOUT = 4000

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {
  public static readonly listenUrl = new BehaviorSubject('')

  private readonly wc: WebChannel
  private readonly channelsSubject: Subject<{ id: number; channel: Channel }>

  constructor(wc: WebChannel) {
    this.wc = wc
    this.channelsSubject = new Subject()
  }

  get channels(): Observable<{ id: number; channel: Channel }> {
    return this.channelsSubject.asObservable()
  }

  newWebSocket(ws: WebSocket, id: number, type: number) {
    this.channelsSubject.next({ id, channel: new Channel(this.wc, ws, type, id) })
  }

  async connect(url: string, type: number, targetId: number, myId: number, wcId: number) {
    validateWebSocketURL(url)

    const fullUrl = this.composeUrl(url, Channel.remoteType(type), wcId, myId)

    const ws = new env.WebSocket(fullUrl)
    const channel = (await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (ws.readyState !== ws.OPEN) {
          ws.close()
          reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`))
        }
      }, CONNECT_TIMEOUT)
      ws.onopen = () => {
        clearTimeout(timeout)
        resolve(new Channel(this.wc, ws, type, targetId))
      }
      ws.onerror = (err) => reject(err)
      ws.onclose = (closeEvt) => {
        reject(new Error(`WebSocket with '${url}' closed ${closeEvt.code}: ${closeEvt.reason}`))
      }
    })) as Channel
    this.channelsSubject.next({ id: targetId, channel })
  }

  private composeUrl(url: string, type: number, wcId: number, senderId: number): string {
    let result = `${url}/?type=${type}&wcId=${wcId}&senderId=${senderId}`
    if (type !== Channel.WITH_INTERNAL) {
      result += `&key=${this.wc.key}`
    }
    return result
  }
}
