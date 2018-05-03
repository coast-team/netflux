import { BehaviorSubject, Observable, Subject } from 'rxjs'

import { Channel, ChannelType } from './Channel'
import { isURL } from './misc/Util'
import { WebChannel } from './WebChannel'

export const CONNECT_TIMEOUT = 6000

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
  private readonly channelsSubject: Subject<Channel>

  constructor(wc: WebChannel) {
    this.wc = wc
    this.channelsSubject = new Subject()
  }

  onChannel(): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  async connectToInvite(url: string): Promise<void> {
    if (isURL(url) && url.search(/^wss?/) !== -1) {
      const fullUrl = this.composeUrl(url, Route.INVITE)
      this.channelsSubject.next(await this.connect(fullUrl, ChannelType.INVITED))
    } else {
      throw new Error(`Invalid URL format: ${url}`)
    }
  }

  newInviteWebSocket(ws: WebSocket, id: number) {
    this.channelsSubject.next(new Channel(this.wc, ws, ChannelType.JOINING))
  }

  async connectToJoin(url: string, wcId: number): Promise<void> {
    if (isURL(url) && url.search(/^wss?/) !== -1) {
      // FIXME: wcId should be the one received via signaling server
      const fullUrl = this.composeUrl(url, Route.JOIN, wcId)
      this.channelsSubject.next(await this.connect(fullUrl, ChannelType.JOINING))
    } else {
      throw new Error(`Invalid URL format: ${url}`)
    }
  }

  newJoinWebSocket(ws: WebSocket) {
    this.channelsSubject.next(new Channel(this.wc, ws, ChannelType.INVITED))
  }

  async connectInternal(url: string): Promise<void> {
    if (isURL(url) && url.search(/^wss?/) !== -1) {
      const fullUrl = this.composeUrl(url, Route.INTERNAL)
      this.channelsSubject.next(await this.connect(fullUrl, ChannelType.INTERNAL))
    } else {
      throw new Error(`Invalid URL format: ${url}`)
    }
  }

  newInternalWebSocket(ws: WebSocket, id: number) {
    this.channelsSubject.next(new Channel(this.wc, ws, ChannelType.INTERNAL, id))
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
    if (isURL(url) && url.search(/^wss?/) !== -1) {
    } else {
      throw new Error(`${url} is not a valid URL`)
    }
    const ws = new global.WebSocket(url)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (ws.readyState !== ws.OPEN) {
          ws.close()
          reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`))
        }
      }, CONNECT_TIMEOUT)
      const channel = new Channel(this.wc, ws, type, id)
      ws.onopen = () => {
        clearTimeout(timeout)
        if (type === ChannelType.INVITED) {
          channel.initialize()
        }
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

  private composeUrl(url: string, route: Route, wcId = this.wc.id): string {
    if (route === Route.INTERNAL) {
      return `${url}/${route}?wcId=${wcId}&senderId=${this.wc.myId}`
    } else {
      return `${url}/${route}?wcId=${wcId}&key=${this.wc.key}`
    }
  }
}
