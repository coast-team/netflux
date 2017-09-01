import 'rxjs/add/operator/map'
import { Subscription } from 'rxjs/Subscription'

import { TopologyInterface } from './Topology'
import { fullMesh, IMessage } from '../../Protobuf'
import { WebChannel } from '../WebChannel'
import { Channel } from '../../Channel'
import { Service, ServiceMessageDecoded } from '../Service'

/**
 * {@link FullMesh} identifier.
 * @ignore
 * @type {number}
 */
export const FULL_MESH = 3

const MAX_JOIN_ATTEMPTS = 100

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */
export class FullMesh extends Service implements TopologyInterface {

  private wc: WebChannel
  /**
   * Neighbours peers.
   */
  private channels: Set<Channel>
  /**
   * Associate joining peer id to his intermediary peer accordingly.
   * When the connection with a joining peer is established, his id is removed
   * from this map and his associated channel is added to the `channels` property.
   */
  private jps: Map<number, Channel>
  /**
   * The peer through whom you are joining. Equals to undefined if you are no
   * longer joining the network.
   */
  private intermediaryChannel: Channel
  /**
   * Prebuild message for better performance.
   */
  private joinSucceedContent: Uint8Array
  private joinAttempts: number

  constructor (wc) {
    super(FULL_MESH, fullMesh.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.channels = new Set()
    this.jps = new Map()
    this.joinAttempts = 0
    this.intermediaryChannel = undefined
    this.joinSucceedContent = super.encode({ joinSucceed: true })
    this.onServiceMessage.subscribe(msg => this.handleSvcMsg(msg))
    this.wc.channelBuilder.onChannel.subscribe(ch => this.peerJoined(ch))
  }

  clean () {}

  addJoining (ch: Channel, members: [number]): void {
    console.info(this.wc.myId + ' addJoining ' + ch.peerId)
    this.peerJoined(ch)
    this.checkMembers(ch, members)
  }

  initJoining (ch: Channel): void {
    console.info(this.wc.myId + ' initJoining ' + ch.peerId)
    this.peerJoined(ch)
    this.joinAttempts = 0
    this.intermediaryChannel = ch
  }

  send (msg: IMessage): void {
    const bytes = this.wc.encode(msg)
    for (let ch of this.channels) {
      ch.send(bytes)
    }
  }

  forward (msg: IMessage): void { /* Nothing to do for this topology */ }

  sendTo (msg: IMessage): void {
    const bytes = this.wc.encode(msg)
    for (let ch of this.channels) {
      if (ch.peerId === msg.recipientId) {
        ch.send(bytes)
        return
      }
    }
    if (this.intermediaryChannel) {
      this.intermediaryChannel.send((bytes))
      return
    } else {
      for (let [id, ch] of this.jps) {
        if (id === msg.recipientId) {
          ch.send((bytes))
          return
        }
      }
    }
    console.error(this.wc.myId + ' The recipient could not be found', msg.recipientId)
  }

  forwardTo (msg: IMessage): void {
    this.sendTo(msg)
  }

  leave (): void {
    for (let ch of this.channels) {
      ch.close()
    }
    this.jps = new Map()
    this.joinAttempts = 0
    this.intermediaryChannel = undefined
  }

  onChannelClose (event: Event, channel: Channel): void {
    if (this.intermediaryChannel && this.intermediaryChannel === channel) {
      this.leave()
      this.wc.joinSubject.next(new Error(`Intermediary channel closed: ${event.type}`))
    }
    if (this.channels.delete(channel)) {
      this.wc.onPeerLeaveProxy(channel.peerId)
      console.info(this.wc.myId + ' onPeerLeaveProxy ' + channel.peerId)
    }
  }

  onChannelError (evt: Event, channel: Channel): void {
    console.error(`Channel error: ${evt.type}`)
  }

  private handleSvcMsg ({channel, senderId, recipientId, msg}: ServiceMessageDecoded): void {
    switch (msg.type) {
    case 'connectTo': {
      // Filter only missing peers
      const missingPeers = msg.connectTo.members.filter(
        id => id !== this.wc.myId && !this.wc.members.includes(id)
      )

      // Establish connection to the missing peers
      const misssingConnections = []
      for (let id of missingPeers) {
        misssingConnections[misssingConnections.length] = new Promise(resolve => {
          this.wc.channelBuilder.connectTo(id)
            .then(ch => {
              this.peerJoined(ch)
              resolve()
            })
            .catch(err => {
              console.warn(this.wc.myId + ' failed to connect to ' + id, err.message)
              resolve()
            })
        })
      }

      // Notify the intermediary peer about your members
      Promise.all(misssingConnections).then(() => {
        const send = () => channel.send(this.wc.encode({
          recipientId: channel.peerId,
          content: super.encode({ connectedTo: { members: this.wc.members } })
        }))
        if (this.joinAttempts === MAX_JOIN_ATTEMPTS) {
          this.leave()
          this.wc.joinSubject.next(new Error('Failed to join: maximum join attempts has reached'))
        } else if (this.joinAttempts > 0) {
          setTimeout(() => send(), 200 + 100 * Math.random())
        } else {
          send()
        }
        this.joinAttempts++
      })
      break
    }
    case 'connectedTo': {
      this.checkMembers(channel, msg.connectedTo.members)
      break
    }
    case 'joiningPeerId': {
      if (msg.joiningPeerId !== this.wc.myId && !this.wc.members.includes(msg.joiningPeerId)) {
        this.jps.set(msg.joiningPeerId, channel)
      }
      break
    }
    case 'joinSucceed': {
      this.intermediaryChannel = undefined
      this.wc.joinSubject.next()
      console.info(this.wc.myId + ' _joinSucceed ')
      break
    }
    }
  }

  private checkMembers (ch, members: [number]): void {
    // Joining succeed if the joining peer and his intermediary peer
    // have same members (excludings themselves)
    if (this.wc.members.length === members.length && members.every(
        id => id === this.wc.myId || this.wc.members.includes(id))
      ) {
      console.log(this.wc.myId + ' checkMembers JOIN SUCCEED')
      ch.send(this.wc.encode({
        recipientId: ch.peerId,
        content: this.joinSucceedContent
      }))
      return
    }

    // Joining did not finish, resend my members to the joining peer
    this.wc.sendProxy({ content: super.encode({ joiningPeerId: ch.peerId }) })
    ch.send(this.wc.encode({
      recipientId: ch.peerId,
      content: super.encode({ connectTo: { members: this.wc.members } })
    }))
  }

  private peerJoined (ch: Channel): void {
    this.channels.add(ch)
    this.wc.onPeerJoinProxy(ch.peerId)
    this.jps.delete(ch.peerId)
    console.info(this.wc.myId + ' peerJoined ' + ch.peerId)
  }
}
