import 'node_modules/rxjs/add/operator/map'

import { TopologyInterface } from 'service/topology/TopologyInterface'
import { fullMesh } from 'Protobuf'
import * as log from 'log'

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
export class FullMesh extends TopologyInterface {
  constructor (wc) {
    super(FULL_MESH, fullMesh.Message, wc._svcMsgStream)
    this.wc = wc
    this.init()
  }

  init () {
    this.channels = new Set()
    this.jps = new Map()
    this.svcMsgStream.subscribe(
      msg => this._handleSvcMsg(msg),
      err => log.error('FullMesh Message Stream Error', err),
      () => this.leave()
    )
    this.channelsSubscription = this.wc.channelBuilder.channels().subscribe(
      ch => (this.jps.set(ch.peerId, ch)),
      err => log.error('FullMesh set joining peer Error', err)
    )
  }

  iJoin () {
    return this.jps.has(this.wc.myId)
  }

  /**
   * Add a peer to the `WebChannel`.
   *
   * @param {WebSocket|RTCDataChannel} channel
   */
  addJoining (channel) {
    log.info(this.wc.myId + ' addJoining ' + channel.peerId)
    const peers = this.wc.members.slice()

    // First joining peer
    if (peers.length === 0) {
      channel.send(this.wc._encode({
        recipientId: channel.peerId,
        content: super.encode({ joinedPeerId: channel.peerId })
      }))
      this.peerJoined(channel)

    // There are at least 2 members in the network
    } else {
      this.jps.set(channel.peerId, channel)
      this.wc._send({ content: super.encode({ joiningPeerId: channel.peerId }) })
      channel.send(this.wc._encode({
        recipientId: channel.peerId,
        content: super.encode({ connectTo: { peers } })
      }))
    }
  }

  initJoining (ch) {
    this.jps.set(this.wc.myId, ch)
    this.channels.add(ch)
    this.wc._onPeerJoin(ch.peerId)
    log.info(this.wc.myId + ' _onPeerJoin ' + ch.peerId)
  }

  /**
   * Send message to all `WebChannel` members.
   *
   * @param {ArrayBuffer} msg
   */
  send (msg) {
    const bytes = this.wc._encode(msg)
    for (let ch of this.channels) {
      ch.send(bytes)
    }
  }

  forward (msg) { /* Nothing to do for this topology */ }

  sendTo (msg) {
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
    return log.error(this.wc.myId + ' The recipient could not be found', msg.recipientId)
  }

  forwardTo (msg) { this.sendTo(msg) }

  leave () {
    for (let ch of this.channels) {
      ch.clearHandlers()
      ch.close()
    }
    for (let ch of this.jps.values()) {
      ch.clearHandlers()
      ch.close()
    }
    this.channels.clear()
    this.jps.clear()
    this.channelsSubscription.unsubscribe()
  }

  onChannelClose (closeEvt, channel) {
    if (this.iJoin()) {
      const firstChannel = this.channels.values().next().value
      if (firstChannel.peerId === channel.peerId) {
        this.wc._joinFailed('Intermediary peer has gone: ' + closeEvt.reason)
        for (let ch of this.channels) {
          ch.clearHandlers()
          ch.close()
        }
        this.channels.clear()
        this.jps.clear()
      } else {
        this.channels.delete(channel)
        log.info(this.wc.myId + ' _onPeerLeave when iJoin ' + channel.peerId)
        this.wc._onPeerLeave(channel.peerId)
      }
    } else {
      for (let [id] of this.jps) {
        if (id === channel.peerId) {
          this.jps.delete(id)
          return
        }
      }
      if (this.channels.has(channel)) {
        this.channels.delete(channel)
        log.info(this.wc.myId + ' _onPeerLeave ' + channel.peerId)
        this.wc._onPeerLeave(channel.peerId)
      }
    }
  }

  /**
   * Error event handler for each `Channel` in the `WebChannel`.
   *
   * @param {Event} evt
   * @param {Channel} channel
   */
  onChannelError (evt, channel) {
    console.error(`Channel error with id: ${channel.peerId}: `, evt)
  }

  _handleSvcMsg ({channel, senderId, recipientId, msg}) {
    switch (msg.type) {
      case 'connectTo': {
        const { peers } = msg.connectTo

        const promises = []
        for (let id of peers) {
          promises[promises.length] = this.wc.channelBuilder.connectTo(id)
        }
        Promise.all(promises)
          .then(channels => {
            for (let ch of channels) {
              this.peerJoined(ch)
            }
            channel.send(this.wc._encode({
              recipientId: channel.peerId,
              content: super.encode({ connectedTo: { peers } })
            }))
          })
          .catch(err => {
            log.error('Failed to join', err)
            channel.send(this.wc._encode({
              recipientId: channel.peerId,
              content: super.encode({ connectedTo: { peers: [] } })
            }))
            this.clean()
            this.wc._joinFailed(err)
          })
        break
      }
      case 'connectedTo': {
        const { peers } = msg.connectedTo
        const missingPeers = []
        for (let id of this.wc.members) {
          if (!peers.includes(id)) {
            missingPeers[missingPeers.length] = id
          }
        }
        if (missingPeers.length === 0) {
          this.jps.delete(channel.peerId)
          this.peerJoined(channel)
          this.wc._send({
            content: super.encode({ joinedPeerId: channel.peerId })
          })
        } else {
          // TODO
        }
        break
      }
      case 'joiningPeerId': {
        this.jps.set(msg.joiningPeerId, channel)
        break
      }
      case 'joinedPeerId': {
        if (this.iJoin()) {
          this.wc._joinSucceed()
          log.info(this.wc.myId + ' _joinSucceed ')
        } else {
          this.peerJoined(this.jps.get(msg.joinedPeerId))
        }
        this.jps.delete(msg.joinedPeerId)
        break
      }
    }
  }

  peerJoined (ch) {
    this.channels.add(ch)
    this.wc._onPeerJoin(ch.peerId)
    log.info(this.wc.myId + ' _onPeerJoin ' + ch.peerID)
  }
}
