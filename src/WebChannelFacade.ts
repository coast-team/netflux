import { WebChannel, WebChannelOptions as WebGroupOptions, WebChannelState } from './service/WebChannel'
import { Topology } from './service/topology/Topology'
import { SignalingState } from './Signaling'

export const wcs: WeakMap<WebGroup, WebChannel> = new WeakMap()

/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export class WebGroup {

  /**
   * Create instance of WebGroup.
   * @param {WebGroupOptions} options [description]
   */
  constructor (options: WebGroupOptions) {
    wcs.set(this, new WebChannel(options))
  }

  /**
   * WebGroup id. The same value for all members.
   */
  get id (): number { return wcs.get(this).id }

  /**
   * Your unique member id.
   */
  get myId (): number { return wcs.get(this).myId }

  /**
   * An array of member ids.
   */
  get members (): number[] { return wcs.get(this).members }

  /**
   * Topology id.
   */
  get topology (): Topology { return wcs.get(this).topology }
  get state (): WebChannelState { return wcs.get(this).state }
  get signalingState (): SignalingState { return wcs.get(this).signaling.state }
  get signalingURL (): string { return wcs.get(this).signaling.url }

  get autoRejoin (): boolean { return wcs.get(this).autoRejoin }
  set autoRejoin (value: boolean) { wcs.get(this).autoRejoin = value }

  set onMessage (handler: (id: number, msg: string | Uint8Array, isBroadcast: boolean) => void) { wcs.get(this).onMessage = handler }
  set onPeerJoin (handler: (id: number) => void) { wcs.get(this).onPeerJoin = handler }
  set onPeerLeave (handler: (id: number) => void) { wcs.get(this).onPeerLeave = handler }
  set onStateChanged (handler: (state: WebChannelState) => void) { wcs.get(this).onStateChanged = handler }
  set onSignalingStateChanged (handler: (state: SignalingState) => void) { wcs.get(this).onSignalingStateChanged = handler }

  join (key: string): void { return wcs.get(this).join(key) }

  invite (url: string): void { return wcs.get(this).invite(url) }

  closeSignaling (): void { return wcs.get(this).closeSignaling() }

  leave () { return wcs.get(this).leave() }

  send (data: string | Uint8Array): void { return wcs.get(this).send(data) }

  sendTo (id: number, data: string | Uint8Array): void { return wcs.get(this).sendTo(id, data) }

  ping (): Promise<number> { return wcs.get(this).ping() }
}
