import 'rxjs/add/operator/map'

import { TopologyInterface } from './TopologyInterface'
import { fullMesh } from '../../Protobuf'

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
      err => console.error('FullMesh Message Stream Error', err),
      () => this.leave()
    )
    this.channelsSubscription = this.wc.channelBuilder.channels().subscribe(
      ch => this.peerJoined(ch),
      err => console.error('FullMesh set joining peer Error', err)
    )
  }

  /**
   * Add a peer to the `WebChannel`.
   *
   * @param {WebSocket|RTCDataChannel} channel
   */
  addJoining (channel) {
    console.info(this.wc.myId + ' addJoining ' + channel.peerId)
    const peers = this.wc.members.slice()
    this.peerJoined(channel)

    // First joining peer
    if (peers.length === 0) {
      channel.send(this.wc._encode({
        recipientId: channel.peerId,
        content: super.encode({ joinSucceed: true })
      }))

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
    console.info(this.wc.myId + ' initJoining ' + ch.peerId)
    this.jps.set(this.wc.myId, ch)
    this.peerJoined(ch)
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
    return console.error(this.wc.myId + ' The recipient could not be found', msg.recipientId)
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
    if (this.wc.state === this.wc.JOINING) {
      const firstChannel = this.channels.values().next().value
      if (firstChannel.peerId === channel.peerId) {
        this.wc._joinFailed(this.wc.myId + ' intermediary peer has gone: ' + closeEvt.reason)
        this.leave()
      } else {
        this.channels.delete(channel)
        console.info(this.wc.myId + ' _onPeerLeave while I am joining ' + channel.peerId)
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
        console.info(this.wc.myId + ' _onPeerLeave ' + channel.peerId)
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
        const peers = msg.connectTo.peers
        let counter = 0
        const connected = []
        const allCompleted = new Promise(resolve => {
          for (let ch of this.channels) {
            const index = peers.indexOf(ch.peerId)
            if (index !== -1) {
              peers.splice(index, 1)
            }
            connected[connected.length] = ch.peerId
          }
          for (let id of peers) {
            this.wc.channelBuilder.connectTo(id)
              .then(ch => {
                this.peerJoined(ch)
                connected[connected.length] = id
                if (++counter === peers.length) {
                  resolve()
                }
              })
              .catch(err => {
                console.warn(this.wc.myId + ' failed to connect to ' + id, err.message)
                if (++counter === peers.length) {
                  resolve()
                }
              })
          }
        })
        allCompleted.then(() => {
          channel.send(this.wc._encode({
            recipientId: channel.peerId,
            content: super.encode({ connectedTo: { peers: connected } })
          }))
        })
        break
      }
      case 'connectedTo': {
        const peers = msg.connectedTo.peers
        const missingPeers = []
        for (let id of this.wc.members) {
          if (!peers.includes(id) && id !== channel.peerId) {
            missingPeers[missingPeers.length] = id
          }
        }
        if (missingPeers.length === 0) {
          channel.send(this.wc._encode({
            recipientId: channel.peerId,
            content: super.encode({ joinSucceed: true })
          }))
        } else {
          channel.send(this.wc._encode({
            recipientId: channel.peerId,
            content: super.encode({ connectTo: { peers: missingPeers } })
          }))
        }
        break
      }
      case 'joiningPeerId': {
        this.jps.set(msg.joiningPeerId, channel)
        break
      }
      case 'joinSucceed': {
        this.jps.delete(this.wc.myId)
        this.wc._joinSucceed()
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

  peerJoined (ch) {
    this.channels.add(ch)
    this.jps.delete(ch.peerId)
    this.wc._onPeerJoin(ch.peerId)
    console.info(this.wc.myId + ' _onPeerJoin ' + ch.peerId)
  }
}
