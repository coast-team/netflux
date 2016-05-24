import * as service from '../service'
/**
 * Channel Builder module is responsible to create a connection between two
 * peers.
 * @module channelBuilder
 * @see Channel
 */

/**
 * On channel callback for {@link module:channelBuilder~Interface#open}
 * function.
 *
 * @callback module:channelBuilder~onChannelCallback
 * @param {Channel} channel - A new channel.
 */

/**
 * Call back to initialize the channel. It should be executed on both peer
 * sides during connection establishment to assure that both channels would be
 * ready to be used in the web channel.
 *
 * @callback module:channelBuilder~initChannel
 * @param {Channel} ch - Channel.
 * @param {string} id - Unique channel identifier.
 */

/**
 * Interface to be implemented by each connection service.
 *
 * @interface
 * @extends module:service~Interface
 */
class Interface extends service.Interface {

  constructor () {
    super()
  }

  /**
   * Enables other clients to establish a connection with you.
   *
   * @abstract
   * @param {string} key - The unique identifier which has to be passed to the
   * peers who need to connect to you.
   * @param {module:channelBuilder~Interface~onChannelCallback} onChannel - Callback
   * function to execute once the connection has been established.
   * @param {Object} [options] - Any other options which depend on the service implementation.
   * @return {Promise} - Once resolved, provide an Object with `key` and `url`
   * attributes to be passed to {@link module:channelBuilder~Interface#join} function.
   * It is rejected if an error occured.
   */
  open (key, onChannel, options) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Connects you with the peer who provided the `key`.
   *
   * @abstract
   * @param  {string} key - A key obtained from the peer who executed
   * {@link module:channelBuilder~Interface#open} function.
   * @param  {Object} [options] Any other options which depend on the implementation.
   * @return {Promise} It is resolved when the connection is established, otherwise it is rejected.
   */
  join (key, options) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Establish a connection between you and another peer (including joining peer) via web channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel through which the connection will be established.
   * @param  {string} id - Peer id with whom you will be connected.
   * @return {Promise} - Resolved once the connection has been established, rejected otherwise.
   */
  connectMeTo (wc, id) {
    throw new Error('Must be implemented by subclass!')
  }
}

export {
  /** @see module:channelBuilder~Interface */
  Interface
}
