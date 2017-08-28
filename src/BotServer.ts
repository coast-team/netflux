import { WebSocketBuilder } from './WebSocketBuilder'
import { WebChannel } from './service/WebChannel'
import { Channel } from './Channel'
import { defaults, WebChannelOptions, BotOptions, } from './defaults'

const url = require('url')

/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export class BotServer {

  public server: any
  public webChannels: WebChannel[]
  public onWebChannel: (wc: WebChannel) => void
  public onError: (err) => void

  private wcSettings: WebChannelOptions
  private botSettings: BotOptions
  private serverSettings: {
    perMessageDeflate: boolean,
    verifyClient: (info: any) => boolean,
    server: any
  }

  /**
   * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
   * plus `host` and `port` parameters.
   *
   * @param {Object} options
   * @param {FULL_MESH} [options.topology=FULL_MESH] Fully connected topology is the only one available for now
   * @param {string} [options.signalingURL='wss://www.coedit.re:10443'] Signaling server url
   * @param {RTCIceServer} [options.iceServers=[{urls:'stun3.l.google.com:19302'}]] Set of ice servers for WebRTC
   * @param {Object} [options.bot] Options for bot server
   * @param {string} [options.bot.url=''] Bot public URL to be shared on the p2p network
   * @param {Object} [options.bot.server=null] A pre-created Node.js HTTP server
   */
  constructor (options: any = {}) {
    const botDefaults = {
      bot: {
        url: '',
        server: undefined,
        perMessageDeflate: false
      }
    }

    let wcOptions = Object.assign({}, defaults, options)
    this.wcSettings = {
      topology: wcOptions.topology,
      signalingURL: wcOptions.signalingURL,
      iceServers: wcOptions.iceServers,
      autoRejoin: false
    }
    this.botSettings = Object.assign({}, botDefaults.bot, options.bot)
    this.serverSettings = {
      perMessageDeflate: this.botSettings.perMessageDeflate,
      verifyClient: (info) => this.validateConnection(info),
      server: this.botSettings.server
    }

    /**
     * @type {WebSocketServer}
     */
    this.server = null

    /**
     * @type {WebChannel[]}
     */
    this.webChannels = []

    /**
     * @type {function(wc: WebChannel)}
     */
    this.onWebChannel = () => {}

    this.onError = () => {}

    this.init()
  }

  get url (): string {
    if (this.botSettings.url !== '') {
      return this.botSettings.url
    } else {
      const address = this.serverSettings.server.address()
      return `ws://${address.address}:${address.port}`
    }
  }

  init (): void {
    this.server = new (require('uws').Server)(this.serverSettings)
    const serverListening = this.serverSettings.server || this.server
    serverListening.on('listening', () => WebSocketBuilder.listen().next(this.url))

    this.server.on('error', err => {
      WebSocketBuilder.listen().next('')
      this.onError(err)
    })

    this.server.on('connection', ws => {
      const {pathname, query} = url.parse(ws.upgradeReq.url, true)
      const wcId = Number(query.wcId)
      let wc = this.getWebChannel(wcId)
      const senderId = Number(query.senderId)
      switch (pathname) {
      case '/invite': {
        if (wc && wc.members.length === 0) {
          this.removeWebChannel(wc)
        }
        // FIXME: it is possible to create multiple WebChannels with the same ID
        wc = new WebChannel(this.wcSettings)
        wc.id = wcId
        this.addWebChannel(wc)
        this.onWebChannel(wc)
        wc.join(new Channel(wc, ws, {id: senderId}))
        break
      }
      case '/internalChannel': {
        if (wc !== undefined) {
          WebSocketBuilder.newIncomingSocket(wc, ws, senderId)
        } else {
          console.error('Cannot find WebChannel for a new internal channel')
        }
        break
      }
      }
    })
  }

  /**
   * Get `WebChannel` identified by its `id`.
   */
  getWebChannel (id: number): WebChannel {
    for (let wc of this.webChannels) {
      if (id === wc.id) {
        return wc
      }
    }
    return undefined
  }

  /**
   * Add `WebChannel`.
   */
  addWebChannel (wc: WebChannel): void {
    this.webChannels[this.webChannels.length] = wc
  }

  /**
   * Remove `WebChannel`.
   */
  removeWebChannel (wc: WebChannel): void {
    this.webChannels.splice(this.webChannels.indexOf(wc), 1)
  }

  validateConnection (info: any): boolean {
    const {pathname, query} = url.parse(info.req.url, true)
    const wcId = query.wcId ? Number(query.wcId) : undefined
    switch (pathname) {
    case '/invite':
      if (wcId) {
        const wc = this.getWebChannel(wcId)
        return (wc === undefined || wc.members.length === 0) && query.senderId
      }
      return false
    case '/internalChannel':
      return query.senderId && wcId && this.getWebChannel(wcId) !== undefined
    default:
      return false
    }
  }
}
