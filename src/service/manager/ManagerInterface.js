import ServiceInterface from 'service/ServiceInterface'
import {provide, CHANNEL_BUILDER} from 'serviceProvider'

/**
 * Web Channel Manager module is a submodule of {@link module:service} and the
 * main component of any Web Channel. It is responsible to preserve Web Channel
 * structure intact (i.e. all peers have the same vision of the Web Channel).
 * Among its duties are:
 *
 * - Add a new peer into Web Channel.
 * - Remove a peer from Web Channel.
 * - Send a broadcast message.
 * - Send a message to a particular peer.
 *
 * @module webChannelManager
 * @see FullyConnectedService
 */

/**
 * Each Web Channel Manager Service must implement this interface.
 * @interface
 * @extends module:service~ServiceInterface
 */
class ManagerInterface extends ServiceInterface {

  connectTo (wc, peerIds) {
    let failed = []
    if (peerIds.length === 0) return Promise.resolve(failed)
    else {
      return new Promise((resolve, reject) => {
        let counter = 0
        let cBuilder = provide(CHANNEL_BUILDER)
        peerIds.forEach(id => {
          cBuilder.connectTo(wc, id)
            .then(channel => this.onChannel(channel))
            .then(() => { if (++counter === peerIds.length) resolve(failed) })
            .catch(reason => {
              failed.push({id, reason})
              if (++counter === peerIds.length) resolve(failed)
            })
        })
      })
    }
  }

  /**
   * Adds a new peer into Web Channel.
   *
   * @abstract
   * @param  {Channel} ch - Channel to be added (it should has
   * the `webChannel` property).
   * @return {Promise} - Resolved once the channel has been succesfully added,
   * rejected otherwise.
   */
  add (ch) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Send a message to all peers in Web Channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel where the message will be propagated.
   * @param  {string} data - Data in stringified JSON format to be send.
   */
  broadcast (wc, data) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Send a message to a particular peer in Web Channel.
   *
   * @abstract
   * @param  {string} id - Peer id.
   * @param  {WebChannel} wc - Web Channel where the message will be propagated.
   * @param  {string} data - Data in stringified JSON format to be send.
   */
  sendTo (id, wc, data) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Leave Web Channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel to leave.
   */
  leave (wc) {
    throw new Error('Must be implemented by subclass!')
  }
}

export default ManagerInterface
