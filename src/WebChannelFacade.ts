import { WebChannel, WebChannelOptions, WebChannelState } from './service/WebChannel'
import { Topology } from './service/topology/Topology'
import { SignalingState } from './Signaling'

export class WebGroup {

  private wc: WebChannel

  constructor (options: WebChannelOptions) {
    this.wc = new WebChannel(options)
  }

  get id (): number { return this.wc.id }
  get myId (): number { return this.wc.myId }
  get members (): number[] { return this.wc.members }
  get topology (): Topology { return this.wc.topology }
  get state (): WebChannelState { return this.wc.state }
  get signalingState (): SignalingState { return this.wc.signaling.state }
  get signalingURL (): string { return this.wc.signaling.url }

  get autoRejoin (): boolean { return this.wc.autoRejoin }
  set autoRejoin (value: boolean) { this.wc.autoRejoin = value }

  set onMessage (handler: (id: number, msg: string | Uint8Array, isBroadcast: boolean) => void) { this.wc.onMessage = handler }
  set onPeerJoin (handler: (id: number) => void) { this.wc.onPeerJoin = handler }
  set onPeerLeave (handler: (id: number) => void) { this.wc.onPeerLeave = handler }
  set onStateChanged (handler: (state: WebChannelState) => void) { this.wc.onStateChanged = handler }
  set onSignalingStateChanged (handler: (state: SignalingState) => void) { this.wc.onSignalingStateChanged = handler }

  join (key: string): void { return this.wc.join(key) }

  invite (url: string): void { return this.wc.invite(url) }

  closeSignaling (): void { return this.wc.closeSignaling() }

  leave () { return this.wc.leave() }

  send (data: string | Uint8Array): void { return this.wc.send(data) }

  sendTo (id: number, data: string | Uint8Array): void { return this.wc.sendTo(id, data) }

  ping (): Promise<number> { return this.wc.ping() }
}
