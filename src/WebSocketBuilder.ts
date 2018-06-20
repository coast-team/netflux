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

  async connectWithJoining(url: string, recipientId: number, senderId: number): Promise<void> {
    const fullUrl = this.composeUrl(url, Channel.WITH_MEMBER, this.wc.id, senderId)
    const channel = await this.connect(
      fullUrl,
      Channel.WITH_JOINING
    )
    this.channelsSubject.next({ id: recipientId, channel })
  }

  newWebSocket(ws: WebSocket, senderId: number, type: number) {
    const channel =
      type === Channel.WITH_INTERNAL
        ? new Channel(this.wc, ws, type, senderId)
        : new Channel(this.wc, ws, type)
    this.channelsSubject.next({ id: senderId, channel })
  }

  async connectWithMember(
    url: string,
    wcId: number,
    recipientId: number,
    senderId: number
  ): Promise<void> {
    const fullUrl = this.composeUrl(url, Channel.WITH_JOINING, wcId, senderId)
    const channel = await this.connect(
      fullUrl,
      Channel.WITH_MEMBER
    )
    this.channelsSubject.next({ id: recipientId, channel })
  }

  async connectWithInternal(url: string, recipientId: number): Promise<void> {
    const fullUrl = this.composeUrl(url, Channel.WITH_INTERNAL, this.wc.id)
    const channel = await this.connect(
      fullUrl,
      Channel.WITH_INTERNAL,
      recipientId
    )
    this.channelsSubject.next({ id: recipientId, channel })
  }

  /**
   * Establish `WebSocket` with a server if `id` is not specified,
   * otherwise return an opened `Channel` with a peer identified by the
   * specified `id`.
   *
   * @param url Server URL
   * @param id  Peer id
   */
  private async connect(url: string, type: number, id?: number): Promise<Channel> {
    validateWebSocketURL(url)
    const ws = new env.WebSocket(url)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (ws.readyState !== ws.OPEN) {
          ws.close()
          reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`))
        }
      }, CONNECT_TIMEOUT)
      ws.onopen = () => {
        const channel = new Channel(this.wc, ws, type, id)
        clearTimeout(timeout)
        resolve(channel)
      }
      ws.onerror = (err) => reject(err)
      ws.onclose = (closeEvt) => {
        reject(
          new Error(
            `WebSocket connection to '${url}' failed with code ${closeEvt.code}: ${closeEvt.reason}`
          )
        )
      }
    }) as Promise<Channel>
  }

  private composeUrl(url: string, type: number, wcId: number, senderId?: number): string {
    validateWebSocketURL(url)
    let result = `${url}/?type=${type}&wcId=${wcId}&senderId=${senderId ? senderId : this.wc.myId}`
    if (type !== Channel.WITH_INTERNAL) {
      result += `&key=${this.wc.key}`
    }
    return result
  }
}
