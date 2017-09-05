import { WebSocketBuilder } from './WebSocketBuilder'
import { WebGroup } from './WebChannelFacade'
import { BotServer, BotServerOptions } from './BotServer'

let botServer: BotServer

/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export class WebGroupBotServer {

  /**
   * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
   * plus `host` and `port` parameters.
   */
  constructor (options: BotServerOptions) {
    botServer = new BotServer(options)
  }

  get server (): any { return botServer.server }
  get webGroups (): Set<WebGroup> { return botServer.webGroups }
  get url (): string { return botServer.url }

  set onWebGroup (handler: (wg: WebGroup) => void) { botServer.onWebGroup = handler }

}
