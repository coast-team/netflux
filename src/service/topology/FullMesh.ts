import { Channel, ChannelType, IChannelInitData, MAXIMUM_MISSED_HEARTBEAT } from '../../Channel'
import { isBrowser, log } from '../../misc/util'
import { fullMesh as proto } from '../../proto'
import { InWcMsg, WebChannel } from '../../WebChannel'
import { ConnectionError } from '../channelBuilder/ConnectionError'
import { ITopology, Topology, TopologyState } from './Topology'

interface IDistantMember {
  adjacentIds: number[]
  missedHeartbeat: number
}

const REQUEST_MEMBERS_INTERVAL = 6000
const MAX_ROUTE_DISTANCE = 3
const HEARTBEAT_INTERVAL = 3000
const DELAYED_TIMEOUT = 60000

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 */
export class FullMesh extends Topology<proto.IMessage, proto.Message> implements ITopology {
  public static readonly SERVICE_ID = 74315

  /**
   * Directly connected peers.
   */
  private adjacentMembers: Map<number, Channel>

  /**
   * Peers that are not adjacent. When the connection with a distant peer is established,
   * his id is removed from this map a new entry is added to the `adjacentMembers` property.
   */
  private distantMembers: Map<number, IDistantMember>
  private antecedentId: number
  private heartbeatInterval: any
  private delayedMembers: Set<number>
  private delayedMembersTimers: Set<number>
  private membersCheckInterval: any
  private heartbeatMsg: Uint8Array

  constructor(wc: WebChannel) {
    super(wc, FullMesh.SERVICE_ID, proto.Message)
    this.adjacentMembers = new Map()
    this.distantMembers = new Map()
    this.antecedentId = 0
    this.delayedMembers = new Set()
    this.delayedMembersTimers = new Set()

    // Encode message beforehand for optimization
    this.heartbeatMsg = super.encode({ heartbeat: true })

    // Subscribe to WebChannel stream
    this.wcStream.message.subscribe(({ channel, senderId, msg }) =>
      this.handleServiceMessage(channel, senderId, msg as proto.Message)
    )

    // Set onConnectionRequest callback for ChannelBuilder
    this.wc.channelBuilder.onConnectionRequest = (data: Uint8Array) => {
      const { id, adjacentIds } = proto.ConnectionRequest.decode(data)
      return this.createOrUpdateDistantMember(id, adjacentIds)
    }

    // Subscribe to channels from ChannelBuilder
    this.wc.channelBuilder.onChannel.subscribe((ch) => {
      log.topology('Adding new adjacent member: ', ch.id)
      this.distantMembers.delete(ch.id)
      const am = this.adjacentMembers.get(ch.id)
      if (am) {
        log.topology('Replacing the same channel')
        am.close()
      }
      this.adjacentMembers.set(ch.id, ch)
      this.updateAntecedentId()
      this.notifyDistantMembers()
      if (!this.heartbeatInterval) {
        this.startHeartbeatInterval()
      }

      if (ch.type === ChannelType.JOINING) {
        super.setState(TopologyState.CONSTRUCTING)
        const { members } = ch.initData as IChannelInitData
        this.connectToMembers(members, ch.id).then(() => {
          super.setState(TopologyState.CONSTRUCTED)
          if (!this.membersCheckInterval) {
            this.startMembersCheckIntervals()
          }
        })
      }
      this.wc.onMemberJoinProxy(ch.id)
    })

    if (isBrowser) {
      ;(window as any).fullmesh = () => {
        log.topology('Fullmesh info:', {
          myId: this.wc.myId,
          signalingState: this.wc.signaling.state,
          webGroupState: this.wc.state,
          topologyState: TopologyState[this.state],
          adjacentMembers: Array.from(this.adjacentMembers.keys()).toString(),
          distantMembers: Array.from(this.distantMembers.keys()).toString(),
          distantMembersDETAILS: Array.from(this.distantMembers.keys()).map((id: number) => {
            const adjacentMembers = this.distantMembers.get(id)
            return { id, adjacentMembers: adjacentMembers ? adjacentMembers.adjacentIds : [] }
          }),
        })
      }
    }
  }

  send(msg: InWcMsg): void {
    this.adjacentMembers.forEach((ch) => ch.encodeAndSend(msg))
    this.distantMembers.forEach((distantMember, id) => {
      this.sendToDistantPeer(distantMember, Object.assign(msg, { recipientId: id }))
    })
  }

  sendTo(msg: InWcMsg): void {
    const ch = this.adjacentMembers.get(msg.recipientId)
    if (ch) {
      ch.encodeAndSend(msg)
    } else {
      this.sendToDistantPeer(this.distantMembers.get(msg.recipientId), msg)
    }
  }

  forward(msg: InWcMsg): void {
    this.sendTo(msg)
  }

  leave(): void {
    if (this.state !== TopologyState.IDLE) {
      this.clean()
      this.adjacentMembers.forEach((ch) => ch.close())
      log.topology('onAdjacentMembersLeaveProxy: leave ')
      this.wc.onAdjacentMembersLeaveProxy(Array.from(this.adjacentMembers.keys()))
      this.adjacentMembers.clear()
      super.setState(TopologyState.IDLE)
    }
  }

  onChannelClose(channel: Channel): void {
    if (this.adjacentMembers.delete(channel.id)) {
      if (this.adjacentMembers.size === 0) {
        this.clean()
      } else {
        this.notifyDistantMembers()
        this.updateAntecedentId()
      }
      log.topology('onAdjacentMembersLeaveProxy: onChannelClose ')
      this.wc.onAdjacentMembersLeaveProxy([channel.id])
    }
  }

  get neighbors(): Channel[] {
    return Array.from(this.adjacentMembers.values())
  }

  private clean() {
    log.topology('onDistantMembersLeaveProxy: clean ')
    this.wc.onDistantMembersLeaveProxy(Array.from(this.distantMembers.keys()))
    this.distantMembers.clear()

    this.antecedentId = 0
    clearInterval(this.heartbeatInterval)
    this.heartbeatInterval = undefined
    clearInterval(this.membersCheckInterval)
    this.membersCheckInterval = undefined
    this.delayedMembers.clear()
    this.delayedMembersTimers.forEach((t) => clearTimeout(t))
    this.delayedMembersTimers.clear()
  }

  private handleServiceMessage(channel: Channel, senderId: number, msg: proto.Message): void {
    switch (msg.type) {
      case 'members': {
        this.connectToMembers((msg.members as proto.Peers).ids, senderId)
        break
      }
      case 'adjacentMembers': {
        const ids = (msg.adjacentMembers as proto.Peers).ids
        this.createOrUpdateDistantMember(senderId, ids)
        break
      }
      case 'heartbeat': {
        const distantMember = this.distantMembers.get(senderId)
        if (distantMember) {
          distantMember.missedHeartbeat = 0
        }
        break
      }
    }
  }

  private connectToMembers(ids: number[], adjacentId: number): Promise<void | void[]> {
    const missingIds = ids.filter(
      (id) => !this.adjacentMembers.has(id) && !this.delayedMembers.has(id) && id !== this.wc.myId
    )
    if (missingIds.length !== 0) {
      const attempts: Array<Promise<void>> = []
      const msg = proto.ConnectionRequest.encode(
        proto.ConnectionRequest.create({
          id: this.wc.myId,
          adjacentIds: Array.from(this.adjacentMembers.keys()),
        })
      ).finish()

      for (const id of missingIds) {
        if (!this.distantMembers.has(id)) {
          this.distantMembers.set(id, {
            adjacentIds: [adjacentId],
            missedHeartbeat: 0,
          })
        }

        attempts[attempts.length] = this.wc.channelBuilder
          .connectOverWebChannel(
            id,
            () => {
              this.wc.onMemberJoinProxy(id)
              this.updateAntecedentId()
            },
            msg
          )
          .catch((err) => {
            if (
              err.message === ConnectionError.CONNECTION_TIMEOUT ||
              err.message === ConnectionError.NEGOTIATION_ERROR
            ) {
              this.delayedMembers.add(id)
              const timer = setTimeout(() => {
                this.delayedMembers.delete(id)
                this.delayedMembersTimers.delete(timer)
              }, DELAYED_TIMEOUT)
              this.delayedMembersTimers.add(timer)
            }
          })
      }

      return Promise.all(attempts)
    }
    return Promise.resolve()
  }

  private notifyDistantMembers() {
    if (this.distantMembers.size !== 0) {
      const msg = super.encode({
        adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) },
      })
      this.distantMembers.forEach((dm, id) => this.wcStream.send(msg, id))
    }
  }

  private startMembersCheckIntervals() {
    this.updateAntecedentId()
    this.membersCheckInterval = setInterval(() => {
      if (this.antecedentId) {
        this.wcStream.send({ members: { ids: this.wc.members } }, this.antecedentId)
      }
    }, REQUEST_MEMBERS_INTERVAL)
  }

  private startHeartbeatInterval() {
    this.heartbeatInterval = setInterval(() => {
      this.adjacentMembers.forEach((ch) => ch.sendHeartbeat())
      this.distantMembers.forEach((peer, id) => {
        peer.missedHeartbeat++
        if (peer.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT + 1) {
          log.topology(`Distant peer ${id} has left: too many missed heartbeats`)
          if (this.distantMembers.delete(id)) {
            this.wc.onDistantMembersLeaveProxy([id])
            this.updateAntecedentId()
          }
        }
        this.wcStream.send(this.heartbeatMsg, id)
      })
    }, HEARTBEAT_INTERVAL)
  }

  private sendToDistantPeer(distantMember: IDistantMember | undefined, msg: any) {
    // NO LUCK: recepient is not directly connected to me, thus check distant peers
    // First those who are at distance 1, then 2 etc. up to MAX_ROUTE_DISTANCE
    // (Peer X has a distance equals to 1 if I am not directly connected to X and
    // there is a peer Y which is directly connected to X and to me)
    for (let d = 1; d <= MAX_ROUTE_DISTANCE; d++) {
      const ch = this.findRoutedChannel(distantMember, d)
      if (ch) {
        ch.encodeAndSend(msg)
        return
      }
    }
  }

  private findRoutedChannel(
    distantMember: IDistantMember | undefined,
    distance: number
  ): Channel | undefined {
    if (distantMember) {
      for (const [neighbourId, ch] of this.adjacentMembers) {
        if (distantMember.adjacentIds.includes(neighbourId)) {
          return ch
        }
      }
      if (distance !== 0) {
        for (const id of distantMember.adjacentIds) {
          const ch = this.findRoutedChannel(this.distantMembers.get(id), distance - 1)
          if (ch) {
            return ch
          }
        }
      }
    }
    return undefined
  }

  private createOrUpdateDistantMember(id: number, ids: number[]): boolean {
    if (!this.adjacentMembers.has(id)) {
      const distantMember = this.distantMembers.get(id)
      if (distantMember) {
        distantMember.adjacentIds = ids
      } else {
        this.distantMembers.set(id, {
          adjacentIds: ids,
          missedHeartbeat: 0,
        })
      }
      return true
    }
    return false
  }

  private updateAntecedentId() {
    if (this.adjacentMembers.size > 0 && this.state === TopologyState.CONSTRUCTED) {
      let maxId = this.wc.members[0]
      let found = false
      for (const id of this.wc.members) {
        if (id < this.wc.myId && (!this.antecedentId || id > this.antecedentId)) {
          this.antecedentId = id
          found = true
        }
        if (maxId < id) {
          maxId = id
        }
      }
      if (!found) {
        this.antecedentId = maxId
      }
    } else {
      this.antecedentId = 0
    }
  }
}
