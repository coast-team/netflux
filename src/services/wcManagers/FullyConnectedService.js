import * as wcManager from './webChannelManager'

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends webChannelManager~Interface
 */
class FullyConnectedService extends wcManager.Interface {

  add (channel) {
    let webChannel = channel.webChannel
    let peers = [webChannel.myId]
    webChannel.channels.forEach((c) => {
      peers[peers.length] = c.peerId
    })
    webChannel.joiningPeers.forEach((jp) => {
      if (channel.peerId !== jp.id) {
        peers[peers.length] = jp.id
      }
    })
    return this.connectWith(webChannel, channel.peerId, channel.peerId, peers)
  }

  broadcast (webChannel, data) {
    for (let c of webChannel.channels) {
      console.log(c.peerId + ': ready state: ' + c.readyState)
      c.send(data)
    }
  }

  sendTo (id, webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.peerId === id) {
        c.send(data)
        return
      }
    }
  }

  leave (webChannel) {
  }

}

export default FullyConnectedService
