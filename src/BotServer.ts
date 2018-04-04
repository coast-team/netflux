import { Server as NodeJSHttpServer } from 'http'
import { Server as NodeJSHttpsServer } from 'https'

import { Channel } from './Channel'
import { defaultOptions, IWebChannelOptions, WebChannel } from './service/WebChannel'
import { wcs, WebGroup } from './WebChannelFacade'
import { WebSocketBuilder } from './WebSocketBuilder'

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
  public webGroups: Set<WebGroup>
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
    // public
    this.wcOptions = Object.assign({}, defaultOptions, { autoRejoin: false }, webGroupOptions)
    this.server = server
    this.listenUrl = url
    this.perMessageDeflate = perMessageDeflate

    // private
    this.webGroups = new Set()
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

  private getWebGroup(id: number): WebGroup | undefined {
    for (const wg of this.webGroups) {
      if (id === wg.id) {
        return wg
      }
    }
    return undefined
  }

  private init(): void {
    this.webSocketServer = new uws.Server({
      perMessageDeflate: this.perMessageDeflate,
      verifyClient: (info: any) => this.validateConnection(info),
      server: this.server,
    })
    const serverListening = this.server || this.webSocketServer
    serverListening.on('listening', () => WebSocketBuilder.listen().next(this.url))

    this.webSocketServer.on('error', (err: Error) => {
      WebSocketBuilder.listen().next('')
      this.onError(err)
    })

    this.webSocketServer.on('connection', (ws: WebSocket) => {
      const { pathname, query } = urlLib.parse((ws as any).upgradeReq.url, true)
      const wcId = Number(query.wcId)
      let wg = this.getWebGroup(wcId)
      const senderId = Number(query.senderId)
      if (pathname.endsWith('/invite')) {
        if (wg && wg.members.length === 1) {
          this.webGroups.delete(wg)
        }
        // FIXME: it is possible to create multiple WebChannels with the same ID
        wg = new WebGroup(this.wcOptions)
        const wc = wcs.get(wg) as WebChannel
        wc.id = wcId
        this.webGroups.add(wg)
        this.onWebGroup(wg)
        new Channel(wc, ws, { id: senderId }) // tslint:disable-line
      } else if (pathname.endsWith('/internalChannel')) {
        if (wg !== undefined) {
          WebSocketBuilder.newIncomingSocket(wcs.get(wg) as WebChannel, ws, senderId)
        } else {
          console.error('Cannot find WebChannel for a new internal channel')
        }
      }
    })
  }

  private validateConnection(info: any): boolean {
    const { pathname, query } = urlLib.parse(info.req.url, true)
    const wcId = query.wcId ? Number(query.wcId) : undefined
    if (pathname.endsWith('/invite')) {
      if (wcId) {
        const wg = this.getWebGroup(wcId)
        return (wg === undefined || wg.members.length === 1) && query.senderId
      }
    } else if (pathname.endsWith('/internalChannel')) {
      return query.senderId !== undefined && wcId !== undefined && this.getWebGroup(wcId) !== undefined
    }
    return false
  }
}
