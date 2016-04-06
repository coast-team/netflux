import * as service from '../service'
/**
 * Channel Builder module is responsible to create a connection between two
 * peers.
 * @module channelBuilder
 * @see ChannelInterface
 */

/**
 * Interface to be implemented by each connection service.
 * @interface
 * @extends module:service~Interface
 */
class Interface extends service.Interface {
  /**
   * Callback function for resolved Promise state returned by
   * {@link module:channelBuilder~Interface#connectMeToMany} function.
   *
   * @callback module:channelBuilder~Interface~connectMeToManyCallback
   * @param {Object} result - Result object
   * @param {ChannelInterface[]} result.channels - Channels which are
   * succesfully created.
   * @param {string[]} result.failed - Identifiers of peers with whom the
   * connection could not be established.
   */

   /**
    * On channel callback for {@link module:channelBuilder~Interface#open}
    * function.
    *
    * @callback module:channelBuilder~Interface~onChannelCallback
    * @param {ChannelInterface} channel - A new channel.
    */

  /**
   * Establish a connection between you and several peers. It is also possible
   * to connect with a peer who is about to join the Web Channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel through which the connections will be
   * established.
   * @param  {string[]} ids Peers identifiers with whom it establishes
   * connections.
   * @return {Promise} - Is always resolved. The callback function type is
   * {@link module:channelBuilder~Interface~connectMeToManyCallback}.
   */
  connectMeToMany (wc, ids) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Establish a connection between you and another peer (including
   * joining peer).
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel through which the connection will be
   * established.
   * @param  {string} id - Peer id with whom the connection will be established.
   * @return {Promise} - Resolved once the connection has been established,
   * rejected otherwise.
   */
  connectMeToOne (wc, id) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Enables other clients to establish a connection with you.
   *
   * @abstract
   * @param {module:channelBuilder~Interface~onChannelCallback} onChannel -
   * Callback function to execute once the connection is established.
   * @param {Object} [options] - Any other options which depend on the implementation.
   * @return {Promise} - Once resolved, provide an Object with `key` attribute
   *           to be passed to {@link connector#join} function. It is rejected
   *           if an error occured.
   */
  open (onChannel, options) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Connects you with the peer who provided the `key`.
   *
   * @abstract
   * @param  {string} key - A key obtained from a peer.
   * @param  {Object} [options] Any other options which depend on the
   * implementation.
   * @return {Promise} It is resolved when the connection is established,
   * otherwise it is rejected.
   */
  join (key, options) {
    throw new Error('Must be implemented by subclass!')
  }
}

export {
  /** @see module:channelBuilder~Interface */
  Interface
}
