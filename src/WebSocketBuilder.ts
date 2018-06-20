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
  private wc: WebChannel
  private readonly channelsSubject: Subject<{ id: number; channel: Channel }>

  constructor(wc: WebChannel) {
    this.wc = wc
    this.channelsSubject = new Subject()
  }

  onChannel(): Observable<{ id: number; channel: Channel }> {
    return this.channelsSubject.asObservable()
  }

  newWebSocket(ws: WebSocket, senderId: number, type: number) {
    const channel =
      type === Channel.WITH_INTERNAL
        ? new Channel(this.wc, ws, type, senderId)
        : new Channel(this.wc, ws, type)
    this.channelsSubject.next({ id: senderId, channel })
  }

  async connect(url: string, type: number, targetId: number, myId: number, wcId: number) {
    validateWebSocketURL(url)

    const targetType =
      type === Channel.WITH_INTERNAL
        ? Channel.WITH_INTERNAL
        : type === Channel.WITH_JOINING
          ? Channel.WITH_MEMBER
          : Channel.WITH_JOINING
    const fullUrl = this.composeUrl(url, targetType, wcId, myId)

    const ws = new env.WebSocket(fullUrl)
    const channel = (await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (ws.readyState !== ws.OPEN) {
          ws.close()
          reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${fullUrl}'`))
        }
      }, CONNECT_TIMEOUT)
      ws.onopen = () => {
        clearTimeout(timeout)
        const ch =
          type === Channel.WITH_INTERNAL
            ? new Channel(this.wc, ws, type, targetId)
            : new Channel(this.wc, ws, type)
        resolve(ch)
      }
      ws.onerror = (err) => reject(err)
      ws.onclose = (closeEvt) => {
        reject(
          new Error(
            `WebSocket connection to '${fullUrl}' failed with code ${closeEvt.code}: ${
              closeEvt.reason
            }`
          )
        )
      }
    })) as Channel
    this.channelsSubject.next({ id: targetId, channel })
  }

  private composeUrl(url: string, type: number, wcId: number, senderId: number): string {
    validateWebSocketURL(url)
    let result = `${url}/?type=${type}&wcId=${wcId}&senderId=${senderId}`
    if (type !== Channel.WITH_INTERNAL) {
      result += `&key=${this.wc.key}`
    }
    return result
  }
}
