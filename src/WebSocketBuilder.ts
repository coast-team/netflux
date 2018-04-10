import { Channel } from './Channel'
import { isURL, isWebRTCSupported } from './misc/Util'
import { WebChannel } from './service/WebChannel'

export const CONNECT_TIMEOUT = 6000

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class WebSocketBuilder {
  private wc: WebChannel

  constructor(wc: WebChannel) {
    this.wc = wc
  }

  /**
   * Establish `WebSocket` with a server if `id` is not specified,
   * otherwise return an opened `Channel` with a peer identified by the
   * specified `id`.
   *
   * @param url Server URL
   * @param id  Peer id
   */
  connect(url: string, id?: number): Promise<WebSocket | Channel> {
    if (isWebRTCSupported()) {
      return new Promise((resolve, reject) => {
        try {
          if (isURL(url) && url.search(/^wss?/) !== -1) {
            const fullUrl =
              id !== undefined
                ? `${url}/internalChannel?wcId=${this.wc.id}&senderId=${this.wc.myId}`
                : url
            const ws = new global.WebSocket(fullUrl)
            const timeout = setTimeout(() => {
              if (ws.readyState !== ws.OPEN) {
                ws.close()
                reject(new Error(`WebSocket ${CONNECT_TIMEOUT}ms connection timeout with '${url}'`))
              }
            }, CONNECT_TIMEOUT)
            const result = id === undefined ? ws : new Channel(this.wc, ws, { id })
            ws.onopen = () => {
              clearTimeout(timeout)
              resolve(result)
            }
            ws.onerror = (err) => reject(err)
            ws.onclose = (closeEvt) =>
              reject(
                new Error(
                  `WebSocket connection to '${url}' failed with code ${closeEvt.code}: ${
                    closeEvt.reason
                  }`
                )
              )
          } else {
            reject(new Error(`${url} is not a valid URL`))
          }
        } catch (err) {
          reject(err)
        }
      })
    } else {
      return Promise.reject(new Error('WebSocket is not supported by your environment'))
    }
  }
}
