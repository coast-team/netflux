import 'rxjs/add/operator/map'
import { Subscription } from 'rxjs/Subscription'

import { TopologyInterface } from './TopologyInterface'
import { fullMesh } from '../../Protobuf'
import { WebChannel } from '../WebChannel'
import { Channel } from '../../Channel'
import { Service } from '../Service'
import { MessageI, ServiceMessageDecoded } from '../../Util'

/**
 * {@link FullMesh} identifier.
 * @ignore
 * @type {number}
 */
export const FULL_MESH = 3

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */
export class FullMesh extends Service implements TopologyInterface {

  private wc: WebChannel
  private channels: Set<Channel>
  private jps: Map<number, Channel>
  private channelsSubs: Subscription

  constructor (wc) {
    super(FULL_MESH, fullMesh.Message, wc._svcMsgStream)
    this.wc = wc
    this.init()
  }

  private init (): void {
    this.channels = new Set()
    this.jps = new Map()
    this.svcMsgStream.subscribe(
      msg => this.handleSvcMsg(msg),
      err => console.error('FullMesh Message Stream Error', err),
      () => this.leave()
    )
    this.channelsSubs = this.wc.channelBuilder.channels().subscribe(
      ch => this.peerJoined(ch),
      err => console.error('FullMesh set joining peer Error', err)
    )
  }

  clean () {}

  addJoining (ch: Channel): void {
    console.info(this.wc.myId + ' addJoining ' + ch.peerId)
    const peers = this.wc.members.slice() // FIXME: without slice, tests fail.
    this.peerJoined(ch)
    // First joining peer
    if (peers.length === 0) {
      ch.send(this.wc._encode({
        recipientId: ch.peerId,
        content: super.encode({ joinSucceed: true })
      }))

    // There are at least 2 members in the network
    } else {
      this.wc._send({ content: super.encode({ joiningPeerId: ch.peerId }) })
      ch.send(this.wc._encode({
        recipientId: ch.peerId,
        content: super.encode({ connectTo: { peers } })
      }))
    }
  }

  initJoining (ch: Channel): void {
    console.info(this.wc.myId + ' initJoining ' + ch.peerId)
    this.jps.set(this.wc.myId, ch)
    this.peerJoined(ch)
  }

  send (msg: MessageI): void {
    const bytes = this.wc._encode(msg)
    for (let ch of this.channels) {
      ch.send(bytes)
    }
  }

  forward (msg: MessageI): void { /* Nothing to do for this topology */ }

  sendTo (msg: MessageI): void {
    const bytes = this.wc._encode(msg)
    for (let ch of this.channels) {
      if (ch.peerId === msg.recipientId) {
        return ch.send(bytes)
      }
    }
    for (let [id, ch] of this.jps) {
      if (id === msg.recipientId || id === this.wc.myId) {
        return ch.send((bytes))
      }
    }
    return console.error(this.wc.myId + ' The recipient could not be found', msg.recipientId)
  }

  forwardTo (msg: MessageI): void { this.sendTo(msg) }

  leave (): void {
    for (let ch of this.channels) {
      ch.close()
    }
    for (let ch of this.jps.values()) {
      ch.close()
    }
    this.channels.clear()
    this.jps.clear()
    this.channelsSubs.unsubscribe()
  }

  onChannelClose (closeEvt: CloseEvent, channel: Channel): void {
    const me = this.jps.get(this.wc.myId)

    if (me !== undefined) {
      // I am joining a network

      if (me.peerId === channel.peerId) {
        // Channel with intermediary peer has closed
        this.wc._joinResult.next(new Error(this.wc.myId + ' intermediary peer has gone: ' + closeEvt.reason))
        this.leave()
      } else {
        // Another channel has closed
        this.channels.delete(channel)
        this.jps.delete(channel.peerId)
        console.info(this.wc.myId + ' _onPeerLeave while I am joining ' + channel.peerId)
        this.wc._onPeerLeave(channel.peerId)
      }
    } else {
      for (let [id, ch] of this.jps) {
        if (id === channel.peerId) {
          this.jps.delete(id)
          if (ch.peerId === this.wc.myId) {
            this.wc._send({ content: super.encode({ joinFailedPeerId: id }) })
          }
          break
        }
      }
      if (this.channels.has(channel)) {
        this.channels.delete(channel)
        console.info(this.wc.myId + ' _onPeerLeave ' + channel.peerId)
        this.wc._onPeerLeave(channel.peerId)
      }
    }
  }

  onChannelError (evt: Event, channel: Channel): void {
    console.error(`Channel error with id: ${channel.peerId}: `, evt)
  }

  private handleSvcMsg ({channel, senderId, recipientId, msg}: ServiceMessageDecoded): void {
    switch (msg.type) {
    case 'connectTo': {
      const peers = msg.connectTo.peers
      const connectedToIds = []
      const connectingFinish = []

      // Filter those peers to whom you are already connected
      for (let ch of this.channels) {
        const index = peers.indexOf(ch.peerId)
        if (index !== -1) {
          peers.splice(index, 1)
        }
        if (ch.peerId !== senderId) {
          connectedToIds[connectedToIds.length] = ch.peerId
        }
      }

      // Establish connection to the missing peers
      for (let id of peers) {
        connectingFinish[connectingFinish.length] = new Promise(resolve => {
          this.wc.channelBuilder.connectTo(id)
            .then(ch => {
              this.peerJoined(ch)
              connectedToIds[connectedToIds.length] = id
              resolve()
            })
            .catch(err => {
              console.warn(this.wc.myId + ' failed to connect to ' + id, err.message)
              resolve()
            })
        })
      }

      // Notify the network member after all necessary connection are established.
      Promise.all(connectingFinish).then(() => {
        channel.send(this.wc._encode({
          recipientId: channel.peerId,
          content: super.encode({ connectedTo: { peers: connectedToIds } })
        }))
      })
      break
    }
    case 'connectedTo': {
      let peers = msg.connectedTo.peers
      if (this.wc.members.length === peers.length + 1) {
        let succeed = true
        for (let id of peers) {
          if (!this.wc.members.includes(id) ) {
            succeed = false
            break
          }
        }
        if (succeed) {
          channel.send(this.wc._encode({
            recipientId: channel.peerId,
            content: super.encode({ joinSucceed: true })
          }))
          return
        }
      }

      // Joining did not finished, resend my neighbor peers
      peers = []
      for (let id of this.wc.members) {
        if (id !== senderId) {
          peers[peers.length] = id
        }
      }
      channel.send(this.wc._encode({
        recipientId: channel.peerId,
        content: super.encode({ connectTo: { peers } })
      }))
      break
    }
    case 'joiningPeerId': {
      this.jps.set(msg.joiningPeerId, channel)
      break
    }
    case 'joinSucceed': {
      this.jps.delete(this.wc.myId)
      this.wc._joinResult.next()
      console.info(this.wc.myId + ' _joinSucceed ')
      break
    }
    case 'joinFailedPeerId': {
      this.jps.delete(this.wc.myId)
      console.info(this.wc.myId + ' joinFailed ' + msg.joinFailedPeerId)
      break
    }
    }
  }

  private peerJoined (ch: Channel): void {
    this.channels.add(ch)
    this.jps.delete(ch.peerId)
    this.wc._onPeerJoin(ch.peerId)
    console.info(this.wc.myId + ' _onPeerJoin ' + ch.peerId)
  }
}
