import { BehaviorSubject, Observable, Subject } from 'rxjs'

import { Channel, ChannelType } from './Channel'
import { env } from './misc/env'
import { validateWebSocketURL } from './misc/util'
import { WebChannel } from './WebChannel'

export const CONNECT_TIMEOUT = 4000

export enum Route {
  JOIN = 'join',
  INVITE = 'invite',
  INTERNAL = 'internal',
}

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

  async connectWithMember(url: string, recipientId: number, senderId: number): Promise<void> {
    const fullUrl = this.composeUrl(url, Route.INVITE, this.wc.id, senderId)
    const channel = await this.connect(
      fullUrl,
      ChannelType.WITH_JOINING
    )
    this.channelsSubject.next({ id: recipientId, channel })
  }

  newInviteWebSocket(ws: WebSocket, senderId: number) {
    const channel = new Channel(this.wc, ws, ChannelType.WITH_MEMBER)
    this.channelsSubject.next({ id: senderId, channel })
  }

  async connectWithJoining(
    url: string,
    wcId: number,
    recipientId: number,
    senderId: number
  ): Promise<void> {
    const fullUrl = this.composeUrl(url, Route.JOIN, wcId, senderId)
    const channel = await this.connect(
      fullUrl,
      ChannelType.WITH_MEMBER
    )
    this.channelsSubject.next({ id: recipientId, channel })
  }

  newJoinWebSocket(ws: WebSocket, senderId: number) {
    const channel = new Channel(this.wc, ws, ChannelType.WITH_JOINING)
    this.channelsSubject.next({ id: senderId, channel })
  }

  async connectWithInternal(url: string, recipientId: number): Promise<void> {
    const fullUrl = this.composeUrl(url, Route.INTERNAL, this.wc.id)
    const channel = await this.connect(
      fullUrl,
      ChannelType.WITH_INTERNAL,
      recipientId
    )
    this.channelsSubject.next({ id: recipientId, channel })
  }

  newInternalWebSocket(ws: WebSocket, id: number) {
    const channel = new Channel(this.wc, ws, ChannelType.WITH_INTERNAL, id)
    this.channelsSubject.next({ id, channel })
  }

  /**
   * Establish `WebSocket` with a server if `id` is not specified,
   * otherwise return an opened `Channel` with a peer identified by the
   * specified `id`.
   *
   * @param url Server URL
   * @param id  Peer id
   */
  private async connect(url: string, type: ChannelType, id?: number): Promise<Channel> {
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

  private composeUrl(url: string, route: Route, wcId: number, senderId?: number): string {
    validateWebSocketURL(url)
    let result = `${url}/${route}?wcId=${wcId}&senderId=${senderId ? senderId : this.wc.myId}`
    if (route !== Route.INTERNAL) {
      result += `&key=${this.wc.key}`
    }
    return result
  }
}
