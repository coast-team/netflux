import * as wcManager from './webChannelManager'

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~Interface
 */
class FullyConnectedService extends wcManager.Interface {
  add (ch) {
    let wCh = ch.webChannel
    let peers = [wCh.myId]
    wCh.channels.forEach((ch) => {
      peers[peers.length] = ch.peerId
    })
    wCh.joiningPeers.forEach((jp) => {
      if (ch.peerId !== jp.id) {
        peers[peers.length] = jp.id
      }
    })
    return this.connectWith(wCh, ch.peerId, ch.peerId, peers)
  }

  broadcast (webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.readyState !== 'closed') {
        c.send(data)
      }
    }
  }

  sendTo (id, webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.peerId === id) {
        if (c.readyState !== 'closed') {
          c.send(data)
        }
        return
      }
    }
  }

  leave (webChannel) {}

}

export default FullyConnectedService
