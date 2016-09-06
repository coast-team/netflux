import ManagerInterface from 'service/manager/ManagerInterface'

/**
 * One of the internal message type. The message is intended for the *WebChannel*
 * members to notify them about the joining peer.
 * @type {number}
 */
const SHOULD_ADD_NEW_JOINING_PEER = 1
/**
 * Connection service of the peer who received a message of this type should
 * establish connection with one or several peers.
 */
const SHOULD_CONNECT_TO = 2
/**
 * One of the internal message type. The message sent by the joining peer to
 * notify all *WebChannel* members about his arrivel.
 * @type {number}
 */
const PEER_JOINED = 3

const TICK = 4
const TOCK = 5

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelManagerInterface
 */
class FullyConnectedService extends ManagerInterface {

  add (channel) {
    let wc = channel.webChannel
    let peers = wc.members.slice()
    for (let jpId of super.getItems(wc).keys()) peers[peers.length] = jpId
    this.setJP(wc, channel.peerId, channel)
    wc.sendInner(this.id, {code: SHOULD_ADD_NEW_JOINING_PEER, jpId: channel.peerId})
    wc.sendInnerTo(channel, this.id, {code: SHOULD_CONNECT_TO, peers})
    return new Promise((resolve, reject) => {
      super.setPendingRequest(wc, channel.peerId, {resolve, reject})
    })
  }

  broadcast (webChannel, data) {
    for (let c of webChannel.channels) c.send(data)
  }

  sendTo (id, webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.peerId === id) {
        c.send(data)
        return
      }
    }
  }

  sendInnerTo (recepient, wc, data) {
    // If the peer sent a message to himself
    if (recepient === wc.myId) wc.onChannelMessage(null, data)
    else {
      let jp = super.getItem(wc, wc.myId)
      if (jp === null) jp = super.getItem(wc, recepient)

      if (jp !== null) { // If me or recepient is joining the WebChannel
        jp.channel.send(data)
      } else if (wc.members.includes(recepient)) { // If recepient is a WebChannel member
        this.sendTo(recepient, wc, data)
      } else this.sendTo(wc.members[0], wc, data)
    }
  }

  leave (wc) {
    for (let c of wc.channels) {
      c.onMessage = () => {}
      c.onClose = () => {}
      c.onError = () => {}
      c.close()
    }
    wc.channels.clear()
  }

  onChannel (channel) {
    return new Promise((resolve, reject) => {
      super.setPendingRequest(channel.webChannel, channel.peerId, {resolve, reject})
      channel.webChannel.sendInnerTo(channel, this.id, {code: TICK})
    })
  }

  /**
   * Close event handler for each *Channel* in the *WebChannel*.
   * @private
   * @param {external:CloseEvent} closeEvt - Close event
   */
  onChannelClose (evt, channel) {
    // TODO: need to check if this is a peer leaving and thus he closed channels
    // with all WebChannel members or this is abnormal channel closing
    let wc = channel.webChannel
    for (let c of wc.channels) {
      if (c.peerId === channel.peerId) return wc.channels.delete(c)
    }
    let jps = super.getItems(wc)
    jps.forEach(jp => jp.channels.delete(channel))
    return false
  }

  /**
   * Error event handler for each *Channel* in the *WebChannel*.
   * @private
   * @param {external:Event} evt - Event
   */
  onChannelError (evt, channel) {
    console.error(`Channel error with id: ${channel.peerId}`)
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    switch (msg.code) {
      case SHOULD_CONNECT_TO:
        this.setJP(wc, wc.myId, channel).channels.add(channel)
        super.connectTo(wc, msg.peers)
          .then(failed => {
            let msg = {code: PEER_JOINED}
            for (let c of super.getItem(wc, wc.myId).channels) {
              wc.channels.add(c)
              wc.onJoining$(c.peerId)
            }
            super.removeItem(wc, wc.myId)
            wc.sendInner(this.id, msg)
            super.getItems(wc).forEach(jp => wc.sendInnerTo(jp.channel, this.id, msg))
            wc.onJoin()
          })
        break
      case PEER_JOINED:
        let jpMe = super.getItem(wc, wc.myId)
        super.removeItem(wc, senderId)
        if (jpMe !== null) jpMe.channels.add(channel)
        else {
          wc.channels.add(channel)
          wc.onJoining$(senderId)
          let request = super.getPendingRequest(wc, senderId)
          if (request !== null) request.resolve(senderId)
        }
        break
      case TICK:
        this.setJP(wc, senderId, channel)
        let isJoining = super.getItem(wc, wc.myId) !== null
        wc.sendInnerTo(channel, this.id, {code: TOCK, isJoining})
        break
      case TOCK:
        if (msg.isJoining) this.setJP(wc, senderId, channel)
        else super.getItem(wc, wc.myId).channels.add(channel)
        super.getPendingRequest(wc, senderId).resolve()
        break
      case SHOULD_ADD_NEW_JOINING_PEER:
        this.setJP(wc, msg.jpId, channel)
        break
    }
  }

  setJP (wc, jpId, channel) {
    let jp = super.getItem(wc, jpId)
    if (!jp) {
      jp = new JoiningPeer(channel)
      super.setItem(wc, jpId, jp)
    } else jp.channel = channel
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

export default FullyConnectedService
