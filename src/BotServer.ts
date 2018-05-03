import { Server as NodeJSHttpServer } from 'http'
import { Server as NodeJSHttpsServer } from 'https'

// import { log } from './misc/Util'
import { defaultOptions, IWebChannelOptions, WebChannel } from './WebChannel'
import { wcs, WebGroup } from './WebChannelFacade'
import { Route, WebSocketBuilder } from './WebSocketBuilder'

const urlLib = require('url')
const uws = require('uws')

export interface IBotServerOptions {
  url?: string
  server: NodeJSHttpServer | NodeJSHttpsServer
  perMessageDeflate?: boolean
  webGroupOptions?: IWebChannelOptions
}

export class BotServer {
  public server: NodeJSHttpServer | NodeJSHttpsServer
  public perMessageDeflate: boolean
  public webGroups: Map<number, WebGroup>
  public onWebGroup: (wg: WebGroup) => void
  public onError: (err: Error) => void

  private listenUrl: string
  private webSocketServer: any
  private wcOptions: IWebChannelOptions

  constructor({
    url = '',
    perMessageDeflate = false,
    server,
    webGroupOptions = {
      topology: defaultOptions.topology,
      signalingServer: defaultOptions.signalingServer,
      rtcConfiguration: defaultOptions.rtcConfiguration,
      autoRejoin: false,
    },
  }: IBotServerOptions) {
    this.wcOptions = Object.assign({}, defaultOptions, { autoRejoin: false }, webGroupOptions)
    this.server = server
    this.listenUrl = url
    this.perMessageDeflate = perMessageDeflate
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
        senderId: number | undefined
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
          wc.webSocketBuilder.newJoinWebSocket(ws)
          break
        }
        case Route.INVITE: {
          const wg = new WebGroup(this.wcOptions)
          this.webGroups.set(wcId, wg)
          const wc = wcs.get(wg) as WebChannel
          wc.init(key as string, wcId)
          this.onWebGroup(wg)
          wc.webSocketBuilder.newInviteWebSocket(ws, senderId as number)
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
        return (wg === undefined || wg.members.length === 1) && !!key
      }
      case Route.JOIN: {
        const wg = this.webGroups.get(wcId)
        return wg !== undefined && wg.members.length > 0 && !!key && wg.key === key
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
    return {
      route: pathname.replace('/', ''),
      wcId: wcId ? Number(wcId) : undefined,
      senderId: senderId ? Number(senderId) : undefined,
      key,
    }
  }
}
