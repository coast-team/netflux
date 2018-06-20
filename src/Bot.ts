import { WebGroupState } from './index.common.doc'
import { NodeJSHttpServer, NodeJSHttpsServer } from './misc/env'
import { IWebChannelOptions, WebChannel, webChannelDefaultOptions } from './WebChannel'
import { wcs, WebGroup } from './WebChannelFacade'
import { Route, WebSocketBuilder } from './WebSocketBuilder'

declare const require: any

const urlLib = require('url')
const uws = require('uws')

export interface IBotOptions {
  url?: string
  server: NodeJSHttpServer | NodeJSHttpsServer
  perMessageDeflate?: boolean
  leaveOnceAlone?: boolean
  webGroupOptions?: IWebChannelOptions
}

interface IBotFullOptions {
  url: string
  server: NodeJSHttpServer | NodeJSHttpsServer
  perMessageDeflate: boolean
  leaveOnceAlone: boolean
  webGroupOptions: IWebChannelOptions
}

const botDefaultOptions: IBotFullOptions = {
  url: '',
  perMessageDeflate: false,
  leaveOnceAlone: true,
  server: undefined,
  webGroupOptions: webChannelDefaultOptions,
}

export class Bot {
  public server: NodeJSHttpServer | NodeJSHttpsServer
  public perMessageDeflate: boolean
  public webGroups: Map<number, WebGroup>
  public onWebGroup: (wg: WebGroup) => void
  public onError: (err: Error) => void
  public leaveOnceAlone: boolean

  private listenUrl: string
  private webSocketServer: any
  private wcOptions: IWebChannelOptions

  constructor(options: IBotOptions) {
    this.wcOptions = Object.assign({}, webChannelDefaultOptions, options.webGroupOptions)
    const fullOptions = Object.assign({}, botDefaultOptions, options)
    fullOptions.webGroupOptions = this.wcOptions
    this.leaveOnceAlone = fullOptions.leaveOnceAlone
    this.server = fullOptions.server
    this.listenUrl = fullOptions.url
    this.perMessageDeflate = fullOptions.perMessageDeflate
    this.webGroups = new Map()
    this.onWebGroup = function none() {}
    this.onError = function none() {}

    // initialize server
    this.init()
  }

  get url(): string {
    if (this.listenUrl !== '') {
      return this.listenUrl
    } else {
      const info = this.server.address()
      return `ws://${info.address}:${info.port}`
    }
  }

  private init(): void {
    this.webSocketServer = new uws.Server({
      perMessageDeflate: this.perMessageDeflate,
      verifyClient: (info: any) => this.validateConnection(info),
      server: this.server,
    })
    const serverListening = this.server || this.webSocketServer
    serverListening.on('listening', () => WebSocketBuilder.listenUrl.next(this.url))

    this.webSocketServer.on('error', (err: Error) => {
      WebSocketBuilder.listenUrl.next('')
      this.onError(err)
    })

    this.webSocketServer.on('connection', (ws: WebSocket) => {
      const { route, wcId, senderId, key } = this.readUrl((ws as any).upgradeReq.url) as {
        route: string
        wcId: number
        senderId: number
        key: string | undefined
      }
      switch (route) {
        case Route.INTERNAL: {
          const wg = this.webGroups.get(wcId) as WebGroup
          const wc = wcs.get(wg) as WebChannel
          wc.webSocketBuilder.newInternalWebSocket(ws, senderId as number)
          break
        }
        case Route.JOIN: {
          const wg = this.webGroups.get(wcId) as WebGroup
          const wc = wcs.get(wg as WebGroup) as WebChannel
          wc.webSocketBuilder.newJoinWebSocket(ws, senderId)
          break
        }
        case Route.INVITE: {
          const wg = new WebGroup(this.wcOptions)
          this.webGroups.set(wcId, wg)
          const wc = wcs.get(wg) as WebChannel
          if (this.leaveOnceAlone) {
            wc.onAlone = () => {
              wc.leave()
              this.webGroups.delete(wcId)
            }
          }
          wc.init(key as string, wcId)
          this.onWebGroup(wg)
          wc.webSocketBuilder.newInviteWebSocket(ws, senderId)
          break
        }
      }
    })
  }

  private validateConnection(info: any): boolean {
    const { route, wcId, senderId, key } = this.readUrl(info.req.url)
    if (wcId === undefined) {
      return false
    }

    switch (route) {
      case Route.INTERNAL:
        return this.webGroups.has(wcId) && !!senderId
      case Route.INVITE: {
        const wg = this.webGroups.get(wcId)
        return !!key && (wg === undefined || wg.state === WebGroupState.LEFT) && !!senderId
      }
      case Route.JOIN: {
        const wg = this.webGroups.get(wcId)
        return (
          !!key &&
          wg !== undefined &&
          wg.key === key &&
          wg.state !== WebGroupState.LEFT &&
          !!senderId
        )
      }
      default:
        return false
    }
  }

  private readUrl(
    url: string
  ): {
    route: string
    wcId: number | undefined
    senderId: number | undefined
    key: string | undefined
  } {
    const {
      pathname,
      query: { senderId, wcId, key },
    }: {
      pathname: string
      query: { senderId: string | undefined; wcId: string; key: string | undefined }
    } = urlLib.parse(url, true)
    let lastRoute = pathname
    if (pathname.endsWith('/')) {
      lastRoute = pathname.substr(0, pathname.length - 1)
    }
    lastRoute = lastRoute.split('/').pop() as string
    return {
      route: lastRoute,
      wcId: wcId ? Number(wcId) : undefined,
      senderId: senderId ? Number(senderId) : undefined,
      key,
    }
  }
}
