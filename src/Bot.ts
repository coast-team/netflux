import { Channel } from './Channel'
import { WebGroupState } from './index.common.doc'
import { NodeJSHttpServer, NodeJSHttpsServer } from './misc/env'
import { log } from './misc/util'
import { IWebChannelOptions, WebChannel, webChannelDefaultOptions } from './WebChannel'
import { wcs, WebGroup } from './WebChannelFacade'
import { WebSocketBuilder } from './WebSocketBuilder'

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
      verifyClient: (info: any) => this.validateURLQuery(info),
      server: this.server,
    })
    const serverListening = this.server || this.webSocketServer
    serverListening.on('listening', () => WebSocketBuilder.listenUrl.next(this.url))

    this.webSocketServer.on('error', (err: Error) => {
      WebSocketBuilder.listenUrl.next('')
      this.onError(err)
    })

    this.webSocketServer.on('connection', (ws: WebSocket) => {
      const { type, wcId, senderId, key } = this.readURLQuery((ws as any).upgradeReq.url)
      let webSocketBuilder: WebSocketBuilder
      if (type === Channel.WITH_MEMBER) {
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
        wc.onMyId(wc.myId)
        webSocketBuilder = wc.webSocketBuilder
      } else {
        const wg = this.webGroups.get(wcId) as WebGroup
        const wc = wcs.get(wg) as WebChannel
        webSocketBuilder = wc.webSocketBuilder
      }
      webSocketBuilder.newWebSocket(ws, senderId, type)
    })
  }

  private validateURLQuery(info: any): boolean {
    try {
      const { type, wcId, key } = this.readURLQuery(info.req.url)
      switch (type) {
        case Channel.WITH_INTERNAL:
          return this.webGroups.has(wcId)
        case Channel.WITH_MEMBER: {
          const wg = this.webGroups.get(wcId)
          return !!key && (wg === undefined || wg.state === WebGroupState.LEFT)
        }
        case Channel.WITH_JOINING: {
          const wg = this.webGroups.get(wcId)
          return !!key && wg !== undefined && wg.key === key && wg.state !== WebGroupState.LEFT
        }
        default:
          return false
      }
    } catch (err) {
      log.warn(err.message)
      return false
    }
  }

  private readURLQuery(
    url: string
  ): {
    type: number
    wcId: number
    senderId: number
    key: string | undefined
  } {
    const { type, wcId, senderId, key } = urlLib.parse(url, true).query
    if (!type) {
      throw new Error('Query parse error: "type" parameter is undefined')
    }
    if (!wcId) {
      throw new Error('Query parse error: "wcId" parameter is undefined')
    }
    if (!senderId) {
      throw new Error('Query parse error: "senderId" parameter is undefined')
    }

    return {
      type: Number.parseInt(type, 10),
      wcId: Number.parseInt(wcId, 10),
      senderId: Number.parseInt(senderId, 10),
      key,
    }
  }
}
