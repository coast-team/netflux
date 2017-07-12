import { TopologyInterface } from 'service/topology/TopologyInterface'
import { fullyConnected } from 'Protobuf.js'
import * as log from 'log'

/**
 * {@link FullyConnectedService} identifier.
 * @ignore
 * @type {number}
 */
export const FULLY_CONNECTED = 3

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */
export class FullyConnectedService extends TopologyInterface {
  constructor (wc) {
    super(FULLY_CONNECTED, fullyConnected.Message, wc._msgStream)
    this.wc = wc
    this.init()
  }

  init () {
    this.channels = new Set()
    this.jps = new Map()
    this.innerStream.subscribe(
      msg => this._handleSvcMsg(msg),
      err => log.error('FullyConnectedService Message Stream Error', err)
    )
    this.channelsSubscription = this.wc.channelBuilderSvc.channels().subscribe(
      ch => (this.jps.set(ch.peerId, ch)),
      err => log.error('FullyConnectedService set joining peer Error', err)
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
    const peers = this.wc.members.slice()
    this.jps.set(channel.peerId, channel)
    if (peers.length === 0) {
      this.sendJoinedPeerId(channel, channel.peerId)
    } else {
      this.wc._send({ content: super.encode({ joiningPeerId: channel.peerId }) })
      channel.send(this.wc._encodeMain({
        recipientId: channel.peerId,
        content: super.encode({ connectTo: { peers } })
      }))
    }
  }

  initJoining (ch) {
    this.jps.set(this.wc.myId, ch)
    this.channels.add(ch)
    this.wc._onPeerJoin(ch.peerId)
  }

  /**
   * Send message to all `WebChannel` members.
   *
   * @param {ArrayBuffer} msg
   */
  send (msg) {
    const bytes = this.wc._encodeMain(msg)
    for (let ch of this.channels) {
      ch.send(bytes)
    }
  }

  forward (msg) { /* Nothing to do for this topology */ }

  sendTo (msg) {
    const bytes = this.wc._encodeMain(msg)
    for (let ch of this.channels) {
      if (ch.peerId === msg.recipientId) {
        return ch.send(bytes)
      }
    }
    for (let [id, ch] of this.jps) {
      if (id === msg.recipientId || id === this.wc.myId) {
        return ch.send(bytes)
      }
    }
    return log.error(this.wc.myId + ' The recipient could not be found', msg)
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
          promises[promises.length] = this.wc.channelBuilderSvc.connectTo(id)
        }
        Promise.all(promises)
          .then(channels => {
            for (let ch of channels) {
              this.channels.add(ch)
              this.wc._onPeerJoin(ch.peerId)
            }
            channel.send(this.wc._encodeMain({
              recipientId: channel.peerId,
              content: super.encode({ connectedTo: { peers } })
            }))
          })
          .catch(err => {
            log.error('Failed to join', err)
            channel.send(this.wc._encodeMain({
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
          this.sendJoinedPeerId(channel, senderId)
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
        const ch = this.jps.get(msg.joinedPeerId)
        if (ch === undefined) {
          // Throw error
        } else {
          this.jps.delete(msg.joinedPeerId)
          if (this.wc.myId === msg.joinedPeerId) {
            this.wc._joinSucceed()
          } else {
            this.channels.add(ch)
            this.wc._onPeerJoin(msg.joinedPeerId)
          }
        }
        break
      }
    }
  }

  sendJoinedPeerId (ch, joinedPeerId) {
    this.wc._send({
      isMeIncluded: true,
      content: super.encode({ joinedPeerId })
    })
  }
}
