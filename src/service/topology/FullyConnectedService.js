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
    this.innerMessageSubscritption = this.innerStream.subscribe(
      msg => this._handleSvcMsg(msg),
      err => log.error('FullyConnectedService Message Stream Error', err, wc),
      () => {
        this.init()
        this.clean()
      }
    )
  }

  init () {
    this.channels = new Set()
    this.joiningPeers = new Map()
    this.pendingRequests = new Map()
  }

  clean () {
    this.innerMessageSubscritption.unsubscribe()
  }

  connectTo (peerIds) {
    const failed = []
    if (peerIds.length === 0) {
      return Promise.resolve(failed)
    } else {
      return new Promise((resolve, reject) => {
        let counter = 0
        peerIds.forEach(id => {
          this.wc.channelBuilderSvc.connectTo(id)
            .then(ch => this.onChannel(ch))
            .then(() => { if (++counter === peerIds.length) resolve(failed) })
            .catch(reason => {
              log.error('Failed connect to ', reason)
              failed.push({id, reason})
              if (++counter === peerIds.length) resolve(failed)
            })
        })
      })
    }
  }

  /**
   * Add a peer to the `WebChannel`.
   *
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {Promise<number, string>}
   */
  add (channel) {
    log.debug(this.wc.myId + ' ADD ' + channel.peerId)
    const wc = channel.webChannel
    const peers = wc.members.slice()
    for (let jpId of this.joiningPeers.keys()) {
      peers[peers.length] = jpId
    }
    this.setJP(channel.peerId, channel)
    wc._send({
      content: super.encode({newJoiningPeer: {jpId: channel.peerId}})
    })
    channel.send(wc._encodeMain({
      recipientId: channel.peerId,
      content: super.encode({ shouldConnectTo: { peers } })
    }))
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(channel.peerId, {resolve, reject})
    })
  }

  /**
   * Send message to all `WebChannel` members.
   *
   * @param {ArrayBuffer} msg
   */
  send (msg) {
    const bytes = this.wc._encodeMain(msg)
    if (!msg.isInner) {
      // User Message
      for (let c of this.channels) {
        c.send(bytes)
      }
    } else {
      // Inner Message
      // Send to all network members
      for (let c of this.channels) {
        c.send(bytes)
      }
      // Send to all joining peers
      for (let jp of this.joiningPeers) {
        jp.channel.send(bytes)
      }
    }
  }

  sendTo (msg) {
    const bytes = this.wc._encodeMain(msg)
    if (!msg.isInner) {
      // User Message
      for (let c of this.channels) {
        if (c.peerId === msg.recipientId) {
          c.send(bytes)
          return
        }
      }
    } else {
      // Inner Message
      let jp = this.joiningPeers.get(this.wc.myId)
      if (jp === undefined) {
        jp = this.joiningPeers.get(msg.recipientId)
        log.debug(this.wc.myId + ' Recipient is JOINING', jp)
      } else {
        log.debug(this.wc.myId + ' ME is JOINING')
      }

      // If me or the recipient is joining the WebChannel,
      // then send data via intermediary passway
      if (jp !== undefined) {
        jp.channel.send(bytes)
      } else {
        // Otherwise me and the recipient are network
        // members, thus send data directly
        for (let c of this.channels) {
          if (c.peerId === msg.recipientId) {
            c.send(bytes)
            return
          }
        }
        log.error(this.wc.myId + ' The recipient could not be found', msg)
      }
    }
  }

  forward (msg) {
    const bytes = this.wc._encodeMain(msg)
    // If the message comes from a joining peer, then
    // forward it to all network members
    if (this.joiningPeers.has(msg.senderId)) {
      for (let c of this.channels) {
        c.send(bytes)
      }
    }
    // Forward message to all joining peers except sender
    for (let jp of this.joiningPeers) {
      if (jp.channel.peerId !== msg.senderId) {
        jp.channel.send(bytes)
      }
    }
  }

  forwardTo () {
    // Do nothing
  }

  leave () {
    for (let c of this.channels) {
      c.clearHandlers()
      c.close()
    }
    this.channels.clear()
  }

  onChannel (channel) {
    return new Promise((resolve, reject) => {
      this.pendingRequests(channel.peerId, {resolve, reject})
      channel.send(channel.webChannel._encodeMain({
        recipientId: channel.peerId,
        content: super.encode({ tick: true })
      }))
    })
  }

  onChannelClose (closeEvt, channel) {
    // TODO: need to check if this is a peer leaving and thus he closed channels
    // with all WebChannel members or this is abnormal channel closing
    for (let c of this.channels) {
      if (c.peerId === channel.peerId) {
        return this.channels.delete(c)
      }
    }
    this.joiningPeers.forEach(jp => jp.channels.delete(channel))
    return false
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
    const wc = channel.webChannel
    switch (msg.type) {
      case 'shouldConnectTo': {
        const jpMe = this.setJP(wc.myId, channel)
        jpMe.channels.add(channel)
        this.connectTo(msg.shouldConnectTo.peers)
          .then(failed => {
            log.debug(this.wc.myId + ' shouldConnectTo ', failed)
            const msg = { peerJoined: true }
            jpMe.channels.forEach(ch => {
              ch.send(wc._encodeMain({
                recipientId: ch.peerId,
                content: super.encode(msg)
              }))
              this.channels.add(ch)
              wc._onPeerJoin(ch.peerId)
            })
            this.joiningPeers.delete(wc.myId)
            this.joiningPeers.forEach(jp => wc._sendTo(jp.channel, this.id, msg))
            wc._joinSucceed()
          })
        break
      }
      case 'peerJoined': {
        const jpMe = this.joiningPeers.get(wc.myId)
        this.joiningPeers.delete(senderId)
        if (jpMe !== undefined) {
          jpMe.channels.add(channel)
        } else {
          this.channels.add(channel)
          wc._onPeerJoin(senderId)
          const request = this.pendingRequests.get(senderId)
          if (request !== undefined) request.resolve(senderId)
        }
        break
      }
      case 'tick': {
        this.setJP(senderId, channel)
        wc._sendTo({
          recipientId: channel.peerId,
          content: super.encode({ tock: {
            isJoining: this.joiningPeers.get(wc.myId) !== undefined
          } })
        })
        break
      }
      case 'tock': {
        if (msg.isJoining) {
          this.setJP(senderId, channel)
        } else {
          let jp = this.joiningPeers.get(wc.myId)
          if (jp !== undefined) {
            jp.channels.add(channel)
          }
        }
        this.pendingRequests.get(senderId).resolve()
        break
      }
      case 'newJoiningPeer':
        log.debug(this.wc.myId + ' newJoiningPeer ', msg.jpId)
        this.setJP(msg.jpId, channel)
        break
    }
  }

  /**
   * @private
   * @param {number} jpId
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {type} Description
   */
  setJP (jpId, channel) {
    let jp = this.joiningPeers.get(jpId)
    if (!jp) {
      jp = new JoiningPeer(channel)
      this.joiningPeers.set(jpId, jp)
    } else {
      jp.channel = channel
    }
    return jp
  }
}

/**
 * This class represents a temporary state of a peer, while he is about to join
 * the web channel. During the joining process every peer in the web channel
 * and the joining peer have an instance of this class with the same `id` and
 * `intermediaryId` attribute values. After the joining process has been finished
 * regardless of success, these instances will be deleted.
 */
class JoiningPeer {
  constructor (channel) {
    /**
     * The channel between the joining peer and intermediary peer. It is null
     * for every peer, but the joining and intermediary peers.
     *
     * @type {Channel}
     */
    this.channel = channel

    /**
     * This attribute is proper to each peer. Array of channels which will be
     * added to the current peer once it becomes the member of the web channel.
     * @type {Channel[]}
     */
    this.channels = new Set()
  }
}
