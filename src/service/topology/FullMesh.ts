import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Subscription } from 'rxjs/Subscription'

import { Channel } from '../../Channel'
import { log } from '../../misc/Util'
import { fullMesh, IMessage } from '../../proto'
import { IServiceMessageDecoded, Service } from '../Service'
import { WebChannel, WebChannelState } from '../WebChannel'
import { ITopology, TopologyStateEnum } from './Topology'

/**
 * {@link FullMesh} identifier.
 * @ignore
 * @type {number}
 */
export const FULL_MESH = 3

const REQUEST_MEMBERS_INTERVAL = 5000

const MAX_ROUTE_DISTANCE = 3

const HEARTBEAT_INTERVAL = 3000
const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_MESSAGE = Service.encodeServiceMessage(FULL_MESH,
  fullMesh.Message.encode(fullMesh.Message.create({ heartbeat: true })).finish())

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 */
export class FullMesh extends Service implements ITopology {

  private wc: WebChannel

  /**
   * Neighbours peers.
   */
  private channels: Map<number, Channel>

  /**
   * Associate joining peer id to his intermediary peer accordingly.
   * When the connection with a joining peer is established, his id is removed
   * from this map and his associated channel is added to the `channels` property.
   */
  private distantPeers: Map<number, { intermediaryIds: number[], missedHeartbeat: number }>

  private stateSubject: Subject<TopologyStateEnum>

  private isConnecting: boolean
  private heartbeatInterval: any
  private requestMembersInterval: any

  constructor (wc) {
    super(FULL_MESH, fullMesh.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.channels = new Map()
    this.distantPeers = new Map()
    this.stateSubject = new Subject()
    this.onServiceMessage.subscribe((msg) => this.handleSvcMsg(msg))
    this.wc.channelBuilder.onChannel.subscribe((ch) => this.addDirectMember(ch))
  }

  get onState (): Observable<TopologyStateEnum> {
    return this.stateSubject.asObservable()
  }

  clean () {
    this.distantPeers.clear()
    clearInterval(this.heartbeatInterval)
    this.heartbeatInterval = undefined
    clearInterval(this.requestMembersInterval)
    this.requestMembersInterval = undefined
  }

  addJoining (ch: Channel): void {
    this.addDirectMember(ch)
  }

  initJoining (ch: Channel, ids: number[]): void {
    this.addDirectMember(ch)
    this.connectTo(ch.id, ids)
    this.stateSubject.next(TopologyStateEnum.JOINED)
    this.requestMembers()
  }

  send (msg: IMessage): void {
    const bytes = this.wc.encode(msg)
    this.channels.forEach((ch) => ch.send(bytes))
    this.distantPeers.forEach((peer, id) => {
      for (const iid of peer.intermediaryIds) {
        const ch = this.channels.get(iid)
        if (ch) {
          this.wc.sendToProxy({ recipientId: id, isService: msg.isService, content: msg.content })
          break
        }
      }
    })
  }

  forward (msg: IMessage): void {
    if (msg.recipientId > 1) {
      this.sendTo(msg)
    }
  }

  sendTo (msg: IMessage): void {
    const channel = this.channels.get(msg.recipientId)
    if (channel) {
      // GOOD: recipient is one of my neighbour
      channel.send(this.wc.encode(msg))
      return
    } else {
      // NO LUCK: recepient is not directly connected to me, thus check distant peers
      // First those who are at distance 1, then 2 etc. up to MAX_ROUTE_DISTANCE
      // (Peer X has a distance equals to 1 if I am not directly connected to X and
      // there is a peer Y which is directly connected to X and to me)
      for (let d = 1; d <= MAX_ROUTE_DISTANCE; d++) {
        const ch = this.findRoutedChannel(msg.recipientId, d)
        if (ch) {
          ch.send(this.wc.encode(msg))
          return
        }
      }
      // Either the recipient has gone or there is an error in the route algorithm
      // const err = (new Error()).stack
      // console.log(err)
      console.warn(`${this.wc.myId}: the recipient ${msg.recipientId} could not be found`)
    }
  }

  leave (): void {
    this.channels.forEach((ch) => ch.close())
    this.clean()
  }

  onChannelClose (event: Event, channel: Channel): void {
    if (this.channels.delete(channel.id)) {
      this.wc.onMemberLeaveProxy(channel.id)
      if (this.channels.size === 0) {
        this.clean()
      } else {
        this.neighboursChanged()
      }
    }
  }

  onChannelError (evt: Event, channel: Channel): void {
    console.warn(`Channel error: ${evt.type}`)
  }

  private handleSvcMsg ({channel, senderId, recipientId, msg}: IServiceMessageDecoded): void {
    switch (msg.type) {
    case 'members': {
      this.connectTo(senderId, msg.members.ids)
      break
    }
    case 'requestMembers': {
      channel.send(this.wc.encode({
        recipientId: channel.id,
        content: super.encode({ members: { ids: this.wc.members } }),
      }))
      break
    }
    case 'intermediaryIds': {
      // Set distant peer only if the direct channel to him does not exist already
      if (!this.channels.has(senderId)) {

        // If it the first time you have met this ID (msg.senderId), then send him
        // your neighbours' ids and consider him as a joined member. Otherwise just
        // update the list of distant peer's neighbours
        if (!this.distantPeers.has(senderId)) {
          this.distantPeers.set(senderId, { intermediaryIds: msg.intermediaryIds.ids, missedHeartbeat: 0 })
          this.wc.sendToProxy({
            recipientId: senderId,
            content: super.encode({ intermediaryIds: { ids: Array.from(this.channels.keys()) } }),
          })
          this.wc.onMemberJoinProxy(senderId)
        } else {
          this.distantPeers.set(senderId, { intermediaryIds: msg.intermediaryIds.ids, missedHeartbeat: 0 })
        }
      }
      break
    }
    case 'heartbeat': {
      const distantPeer = this.distantPeers.get(senderId)
      if (distantPeer) {
        distantPeer.missedHeartbeat = 0
      } else {
        channel.missedHeartbeat = 0
      }
      break
    }
    }
  }

  private addDirectMember (channel: Channel): void {
    this.distantPeers.delete(channel.id)
    const oldChannelRef = this.channels.get(channel.id)
    channel.updateHeartbeatMsg(HEARTBEAT_MESSAGE)
    this.channels.set(channel.id, channel)
    if (this.channels.size === 1) {
      this.startIntervals()
    }
    if (oldChannelRef) {
      oldChannelRef.closeQuietly()
    } else {
      this.wc.onMemberJoinProxy(channel.id)
      this.neighboursChanged()
    }
  }

  private startIntervals () {
    this.clean()
    this.requestMembersInterval = setInterval(() => this.requestMembers(), REQUEST_MEMBERS_INTERVAL)
    this.heartbeatInterval = global.setInterval(() => {
      this.channels.forEach((ch) => {
        try {
          ch.missedHeartbeat++
          if (ch.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
            throw new Error('Too many missed heartbeats')
          }
          ch.sendHeartbeat()
        } catch (err) {
          log.info(`Closing connection with ${ch.id}. Reason: ${err.message}`)
          ch.close()
        }
      })
      this.distantPeers.forEach((peer, id) => {
        try {
          peer.missedHeartbeat++
          if (peer.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
            throw new Error('Too many missed heartbeats')
          }
          this.wc.sendToProxy({ recipientId: id, content: HEARTBEAT_MESSAGE })
        } catch (err) {
          log.info(`${id} has left. Reason: ${err.message}`)
          this.distantPeers.delete(id)
          this.wc.onMemberLeaveProxy(id)
        }
      })
    }, HEARTBEAT_INTERVAL)
  }

  private connectTo (memberId: number, ids: number[]) {
    this.isConnecting = true
    const attempts = []

    // It's important to notify all peers (in ids) about my intermediaryIds first
    // for some specific case such when you should connect to a peer with
    // distance more than 1
    ids.forEach((id) => {
      if (!this.channels.has(id)) {
        this.distantPeers.set(id, { intermediaryIds: [memberId], missedHeartbeat: 0 })
        this.wc.onMemberJoinProxy(id)
        this.wc.sendToProxy({
          recipientId: id,
          content: super.encode({ intermediaryIds: { ids: Array.from(this.channels.keys()) } }),
        })
      }
    })
    ids.forEach((id) => {
      if (!this.channels.has(id)) {
        attempts[attempts.length] = this.wc.channelBuilder.connectTo(id)
          .then((ch) => this.addDirectMember(ch))
          .catch((err) => log.info(`${this.wc.myId} failed to connect to ${id}: ${err.message}`))
      }
    })

    // Send a request to a group member in order to verify and compare members list
    Promise.all(attempts).then(() => {
      this.isConnecting = false
      if (this.distantPeers.size === 0) {
        this.stateSubject.next(TopologyStateEnum.STABLE)
      }
    })
  }

  private requestMembers () {
    if (this.channels.size !== 0 && !this.isConnecting) {
      // Randomly choose a group member to send him a request for his member list
      const index = Math.floor(Math.random() * this.channels.size)
      const iterator = this.channels.values()
      for (let i = 0; i < index; i++) {
        iterator.next()
      }
      const channel = iterator.next().value
      channel.send(this.wc.encode({
        recipientId: channel.id,
        content: super.encode({ requestMembers: true }),
      }))
    }
  }

  private findRoutedChannel (id: number, distance: number): Channel {
    const peer = this.distantPeers.get(id)
    if (peer) {
      for (const [neighbourId, ch] of this.channels) {
        if (peer.intermediaryIds.includes(neighbourId)) {
          return ch
        }
      }
      if (distance !== 0) {
        for (const intermediaryId of peer.intermediaryIds) {
          const ch = this.findRoutedChannel(intermediaryId, distance - 1)
          if (ch) {
            return ch
          }
        }
      }
      return undefined
    }
    return undefined
  }

  private neighboursChanged () {
    this.distantPeers.forEach((peer, id) => this.wc.sendToProxy({
      recipientId: id,
      content: super.encode({ intermediaryIds: Array.from(this.channels.keys()) }),
    }))
  }
}
