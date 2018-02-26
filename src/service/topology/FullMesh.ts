import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { Channel } from '../../Channel'
import { log } from '../../misc/Util'
import { fullMesh, IMessage } from '../../proto'
import { SignalingState } from '../../Signaling'
import { IServiceMessageDecoded, Service } from '../Service'
import { WebChannel, WebChannelState } from '../WebChannel'
import { ITopology, TopologyStateEnum } from './Topology'

/**
 * {@link FullMesh} identifier.
 * @ignore
 * @type {number}
 */
export const FULL_MESH = 3

interface IDistantPeer {
  adjacentIds: number[],
  missedHeartbeat: number
}

const REQUEST_MEMBERS_INTERVAL = 6000

const MAX_ROUTE_DISTANCE = 3

const HEARTBEAT_INTERVAL = 3000
const MAXIMUM_MISSED_HEARTBEAT = 3

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 */
export class FullMesh extends Service implements ITopology {

  readonly heartbeat: Uint8Array

  private wc: WebChannel

  /**
   * Directly connected peers.
   */
  private adjacentMembers: Map<number, Channel>

  /**
   * Peers that are not adjacent. When the connection with a distant peer is established,
   * his id is removed from this map a new entry is added to the `adjacentMembers` property.
   */
  private distantMembers: Map<number, IDistantPeer>

  /**
   * Set of peers among `distantMembers` to whom you are connecting right now.
   */
  private connectingMembers: Set<number>

  private stateSubject: Subject<TopologyStateEnum>
  private _state: TopologyStateEnum

  private heartbeatInterval: any
  private membersRequestInterval: any

  constructor (wc: WebChannel) {
    super(FULL_MESH, fullMesh.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.adjacentMembers = new Map()
    this.distantMembers = new Map()
    this.connectingMembers = new Set()
    this.stateSubject = new Subject()
    this.heartbeat = Service.encodeServiceMessage(FULL_MESH,
      fullMesh.Message.encode(fullMesh.Message.create({ heartbeat: true })).finish())
    this._state = TopologyStateEnum.DISCONNECTED
    this.onServiceMessage.subscribe((msg) => this.handleSvcMsg(msg))
    this.wc.channelBuilder.onChannel.subscribe((ch) => this.addAdjacentMember(ch))
    const globalAny = global as any
    globalAny.fullmesh = () => {
      log.topology('Fullmesh info:', {
        myId: this.wc.myId,
        signalingState: SignalingState[this.wc.signaling.state],
        webGroupState: WebChannelState[this.wc.state],
        topologyState: TopologyStateEnum[this._state],
        adjacentMembers: Array.from(this.adjacentMembers.keys()).toString(),
        distantMembers: Array.from(this.distantMembers.keys()).toString(),
        connectingMembers: Array.from(this.connectingMembers.values()).toString(),
        distantMembersDETAILS: Array.from(this.distantMembers.keys()).map((id: number) => {
          const adjacentMembers = this.distantMembers.get(id)
          return {id, adjacentMembers: adjacentMembers ? adjacentMembers.adjacentIds : []}
        }),
      })
    }
  }

  get onState (): Observable<TopologyStateEnum> {
    return this.stateSubject.asObservable()
  }

  get state (): TopologyStateEnum {
    return this._state
  }

  setStable () {
    this.setState(TopologyStateEnum.STABLE)
  }

  addJoining (ch: Channel): void {
    // FIXME: test if `ch` already exists among `adjacentMembers`
    this.addAdjacentMember(ch)
  }

  initJoining (ch: Channel, ids: number[]): void {
    this.setState(TopologyStateEnum.JOINING)
    // FIXME: test if `ch` already exists among `adjacentMembers`
    this.addAdjacentMember(ch)
    if (ids.length === 1) {
      this.setState(TopologyStateEnum.STABLE)
    } else {
      this.connectToMany(ids, ch.id)
        .then(() => {
          this.membersRequest()
          this.setState(TopologyStateEnum.JOINED)
          this.setState(TopologyStateEnum.STABLE)
        })
    }
  }

  send (msg: IMessage): void {
    this.adjacentMembers.forEach((ch) => ch.send(this.wc.encode(msg)))
    this.distantMembers.forEach((distantPeer, id) => {
      this.sendToDistantPeer(distantPeer, { recipientId: id, isService: msg.isService, content: msg.content })
    })
  }

  sendTo (msg: IMessage): void {
    const ch = this.adjacentMembers.get(msg.recipientId as number)
    if (ch) {
      ch.send(this.wc.encode(msg))
    } else {
      this.sendToDistantPeer(this.distantMembers.get(msg.recipientId as number), msg)
    }
  }

  forward (msg: IMessage): void {
    if (msg.recipientId as number > 1) {
      this.sendTo(msg)
    }
  }

  leave (): void {
    if (this._state !== TopologyStateEnum.DISCONNECTED) {
      if (this.adjacentMembers.size === 0) {
        this.clean()
        this.setState(TopologyStateEnum.DISCONNECTED)
      } else {
        this.adjacentMembers.forEach((ch) => this.deleteAdjacentMember(ch))
      }
    }
  }

  onChannelClose (event: Event, channel: Channel): void {
    this.deleteAdjacentMember(channel, false)
  }

  onChannelError (evt: Event): void {
    log.topology(`Channel error: ${evt.type}`)
  }

  private clean () {
    this.distantMembers.forEach((member, id) => this.wc.onMemberLeaveProxy(id))
    this.distantMembers.clear()
    this.connectingMembers.clear()
    clearInterval(this.heartbeatInterval)
    this.heartbeatInterval = undefined
    clearInterval(this.membersRequestInterval)
    this.membersRequestInterval = undefined
  }

  private handleSvcMsg ({channel, senderId, msg}: IServiceMessageDecoded): void {
    switch (msg.type) {
    case 'membersResponse': {
      this.connectToMany(msg.membersResponse.ids, senderId)
      break
    }
    case 'membersRequest': {
      channel.send(this.wc.encode({
        recipientId: channel.id,
        content: super.encode({ membersResponse: { ids: this.wc.members } }),
      }))
      break
    }
    case 'adjacentMembers': {
      if (!this.adjacentMembers.has(senderId) && senderId !== this.wc.myId) {
        const distantPeer = this.distantMembers.get(senderId)

        // If it the first time you have met this ID, then send him your neighbours' ids.
        // Otherwise just update the list of distant peer's neighbours

        if (distantPeer) {
          distantPeer.adjacentIds = msg.adjacentMembers.ids
        } else {
          this.distantMembers.set(senderId, { adjacentIds: msg.adjacentMembers.ids, missedHeartbeat: 0 })
          const adjacentMembers = super.encode({ adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) } })
          this.wc.sendToProxy({ recipientId: senderId, content: adjacentMembers})
          this.connectTo(senderId)
        }
      }
      break
    }
    case 'heartbeat': {
      const distantPeer = this.distantMembers.get(senderId)
      if (distantPeer) {
        distantPeer.missedHeartbeat = 0
      } else if (channel.id === senderId) {
        channel.missedHeartbeat = 0
      }
      break
    }
    }
  }

  private addAdjacentMember (ch: Channel): void {
    if (this._state === TopologyStateEnum.DISCONNECTED) {
      log.topology('Closing channel quietly as the topology state is: ', TopologyStateEnum[this._state])
      ch.closeQuietly()
    } else {
      log.topology('Adding new adjacent member: ', ch.id)
      this.distantMembers.delete(ch.id)
      const member = this.adjacentMembers.get(ch.id)
      if (member) {
        log.topology('Replacing the same channel')
        member.closeQuietly()
      }
      this.adjacentMembers.set(ch.id, ch)
      this.notifyDistantPeers()
      this.wc.onMemberJoinProxy(ch.id)
      if (this.adjacentMembers.size === 1 && this.membersRequestInterval === undefined) {
        this.startIntervals()
      }
    }
  }

  private deleteAdjacentMember (ch: Channel, quietly: boolean = true) {
    log.topology('Removing adjacent member: ', ch.id)
    this.adjacentMembers.delete(ch.id)
    this.wc.onMemberLeaveProxy(ch.id)
    if (this.adjacentMembers.size === 0) {
      this.clean()
      this.setState(TopologyStateEnum.DISCONNECTED)
    } else {
      this.notifyDistantPeers()
    }
    if (quietly) {
      ch.closeQuietly()
    }
  }

  private connectToMany (ids: number[], adjacentId: number): Promise<void|void[]> {
    if (this._state !== TopologyStateEnum.DISCONNECTED) {
      const missingIds = ids.filter((id) => {
        return !this.adjacentMembers.has(id) && !this.connectingMembers.has(id) && id !== this.wc.myId
      })
      if (missingIds.length !== 0) {
        const adjacentMembers = super.encode({ adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) } })
        const connectingAttempts: Array<Promise<void>> = []

        missingIds.forEach((id) => {
          if (!this.distantMembers.has(id)) {
            this.distantMembers.set(id, { adjacentIds: [adjacentId], missedHeartbeat: 0 })
          }

          // It's important to notify all peers about my adjacentIds first
          // for some specific case such when you should connect to a peer with
          // distance more than 1
          this.wc.sendToProxy({ recipientId: id, content: adjacentMembers})

          // Connect only to the peers whose ids are less than my id. Thus it avoids a
          // problematic situation when both peers are trying to connect to each other
          // at the same time.
          connectingAttempts[connectingAttempts.length] = this.connectTo(id)
        })

        return Promise.all(connectingAttempts)
      }
    }
    return Promise.resolve()
  }

  private connectTo (id: number): Promise<void> {
    this.connectingMembers.add(id)
    let result
    if (id < this.wc.myId) {
      result = this.wc.channelBuilder.connectTo(id)
        .then((ch: Channel) => this.addAdjacentMember(ch))
        .catch((err: Error) => {
          if (err.message !== 'pingpong') {
            return this.wc.channelBuilder.isResponding(id)
              .then(() => this.wc.onMemberJoinProxy(id))
          }
          log.topology(`${this.wc.myId} failed to connect to ${id}: ${err.message}`)
          return
        })
        .catch(() => {})
    } else {
      result = this.wc.channelBuilder.isResponding(id)
        .then(() => this.wc.onMemberJoinProxy(id))
        .catch(() => {})
    }
    return result.then(() => { this.connectingMembers.delete(id) })
  }

  private membersRequest () {
    if (this.adjacentMembers.size !== 0) {
      // Randomly choose a group member to send him a request for his member list
      const index = Math.floor(Math.random() * this.adjacentMembers.size)
      const iterator = this.adjacentMembers.values()
      for (let i = 0; i < index; i++) {
        iterator.next()
      }
      const channel = iterator.next().value
      channel.send(this.wc.encode({
        recipientId: channel.id,
        content: super.encode({ membersRequest: true }),
      }))
    }
  }

  private sendToDistantPeer (distantPeer: IDistantPeer | undefined, msg: IMessage) {
    // NO LUCK: recepient is not directly connected to me, thus check distant peers
    // First those who are at distance 1, then 2 etc. up to MAX_ROUTE_DISTANCE
    // (Peer X has a distance equals to 1 if I am not directly connected to X and
    // there is a peer Y which is directly connected to X and to me)
    for (let d = 1; d <= MAX_ROUTE_DISTANCE; d++) {
      const ch = this.findRoutedChannel(distantPeer, d)
      if (ch) {
        ch.send(this.wc.encode(msg))
        return
      }
    }
  }

  private findRoutedChannel (distantPeer: IDistantPeer | undefined, distance: number): Channel | undefined {
    if (distantPeer) {
      for (const [neighbourId, ch] of this.adjacentMembers) {
        if (distantPeer.adjacentIds.includes(neighbourId)) {
          return ch
        }
      }
      if (distance !== 0) {
        for (const id of distantPeer.adjacentIds) {
          const ch = this.findRoutedChannel(this.distantMembers.get(id), distance - 1)
          if (ch) {
            return ch
          }
        }
      }
    }
    return undefined
  }

  private notifyDistantPeers () {
    if (this._state !== TopologyStateEnum.DISCONNECTED) {
      this.distantMembers.forEach((peer, id) => this.wc.sendToProxy({
        recipientId: id,
        content: super.encode({ adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) } }),
      }))
    }
  }

  private setState (state: TopologyStateEnum) {
    if (this._state !== state) {
      this._state = state
      this.stateSubject.next(state)
    }
  }

  private startIntervals () {
    // Members check interval
    this.membersRequestInterval = global.setInterval(() => this.membersRequest(), REQUEST_MEMBERS_INTERVAL)

    // Heartbeat interval
    this.heartbeatInterval = global.setInterval(() => {
      this.adjacentMembers.forEach((ch) => {
        try {
          ch.missedHeartbeat++
          if (ch.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
            throw new Error('Too many missed heartbeats')
          }
          ch.sendHeartbeat()
        } catch (err) {
          log.topology(`Closing connection with ${ch.id}. Reason: ${err.message}`)
          this.deleteAdjacentMember(ch)
        }
      })
      this.distantMembers.forEach((peer, id) => {
        try {
          peer.missedHeartbeat++
          if (peer.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT + 1) {
            throw new Error('Too many missed heartbeats')
          }
          this.wc.sendToProxy({ recipientId: id, content: this.heartbeat })
        } catch (err) {
          log.topology(`Distant peer ${id} has left. Reason: ${err.message}`)
          this.distantMembers.delete(id)
          this.wc.onMemberLeaveProxy(id)
        }
      })
    }, HEARTBEAT_INTERVAL)
  }
}
