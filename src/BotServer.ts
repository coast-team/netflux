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
      const { route, wcId, senderId } = this.readUrl((ws as any).upgradeReq.url) as {
        route: string
        wcId: number
        senderId: number | undefined
      }
      let wg = this.webGroups.get(wcId) as WebGroup
      if (route === Route.INTERNAL) {
        if (wg) {
          const wc = wcs.get(wg) as WebChannel
          wc.webSocketBuilder.newInternalWebSocket(ws, senderId as number)
        } else {
          ws.close(4000, 'WebGroup no longer exist')
        }
      } else if (route === Route.INVITE || route === Route.JOIN) {
        if (!wg || wg.members.length === 1) {
          wg = new WebGroup(this.wcOptions)
          this.webGroups.set(wcId, wg)
          this.onWebGroup(wg)
        }
        // FIXME: it is possible to create multiple WebChannels with the same ID
        const wc = wcs.get(wg) as WebChannel
        wc.id = wcId
        if (route === Route.INVITE) {
          wc.webSocketBuilder.newInviteWebSocket(ws, senderId as number)
        } else {
          wc.webSocketBuilder.newJoinWebSocket(ws)
        }
      } else {
        ws.close(4000, 'Unknown route')
      }
    })
  }

  private validateConnection(info: any): boolean {
    const { route, wcId, senderId } = this.readUrl(info.req.url)
    if (wcId === undefined) {
      return false
    }
    switch (route) {
      case Route.INTERNAL:
        return !!senderId && this.webGroups.has(wcId)
      case Route.INVITE:
        const wg = this.webGroups.get(wcId)
        return (wg === undefined || wg.members.length === 1) && !!senderId
      case Route.JOIN:
        return wg !== undefined && wg.members.length > 1
      default:
        return false
    }
  }

  private readUrl(
    url: string
  ): { route: string; wcId: number | undefined; senderId: number | undefined } {
    const {
      pathname,
      query: { senderId, wcId },
    }: { pathname: string; query: { senderId: string; wcId: string } } = urlLib.parse(url, true)
    return {
      route: pathname.replace('/', ''),
      wcId: wcId ? Number(wcId) : undefined,
      senderId: senderId ? Number(senderId) : undefined,
    }
  }
}
