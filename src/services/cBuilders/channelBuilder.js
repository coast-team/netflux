import ServiceInterface from '../../ServiceInterface'

/**
 * Channel Builder module - start point for all connection services. Composed of
 * an Interface which each channel builder service should extend.
 * @module channelBuilder
 */

/**
 * Interface for all channel builder services. Its standalone instance is useless.
 * @interface
 * @extends ServiceInterface
 */
class Interface extends ServiceInterface {
  /**
   * Sends a message to `peerExecutor.id` asking him to establish a connection
   * with `peers`. This function is used to add a new peer to the `webChannel`.
   *
   * For exemple: A, B, C constitute the `webChannel`. N1 and N2 are not the
   * `webChannel` members and they are about to join it. N1 is connected to A.
   * Thus A is the intermediary peer for communicate with N1. N2 is connected
   * to C thereby C is the intermediary peer for N2.
   *
   * N1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A<br />
   * +------->+<br />
   * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
   * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
   * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-----------+<------+<br />
   * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;N2<br />
   *
   *  Here are possible use cases:
   *
   * 1. A asks C to connect with N1
   * 2. A asks B to connect with N1
   * 3. B asks A to connect with N1
   * 4. B asks C to connect with N1
   * 5. B asks C to connect with A
   * 6. A asks N1 to connect with B
   * 7. A asks N1 to connect with C
   * 8. B asks N1 to connect with C
   * 9. A asks N1 to connect with N2
   * 10. B asks N2 to connect with N1
   *
   * @param  {Object} peerExecutor The peer who must establish connection with `peers`.
   * @param  {string} peerExecutor.id The `peerExecutor`'s id.
   * @param  {string} [peerExecutor.intermediaryId] The id of the peer in the `webChannel`
   *            who knows the `peerExecutor` which is not yet a member of the `webChannel`.
   * @param  {WebChannel} webChannel - `webChannel` which has this function caller as member.
   * @param  {Object[]} peers An array of peers with whom the `peerExecutor` must
   *           establish a connection.
   * @param  {string} peers[].id - The peer's id.
   * @param  {string} [peers[].intermediaryId] - the id of an intermediary peer
   *           to communicate with this partner (as for `peerExecutor`).
   *
   * @return {Promise} Once `peerExecutor` established all required connections,
   *           the promise is resolved, otherwise it is rejected.
   */
  connectMeToMany (webChannel, ids) {
    throw new Error('Must be implemented by subclass!')
  }

  connectMeToOne (webChannel, id) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * This callback type is `onChannelCallback`.
   *
   * @callback onChannelCallback
   * @param {Channel} channel A new channel.
   */

  /**
   * Enables other clients to establish a connection with you.
   *
   * @abstract
   * @param {onChannelCallback} onChannel Callback function to execute once the
   *          connection is established.
   * @param {Object} [options] Any other options which depend on the implementation.
   * @return {Promise} Once resolved, provide an Object with `key` attribute
   *           to be passed to {@link connector#join} function. It is rejected
   *           if an error occured.
   */
  open (onChannel, options = {}) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Connects you with the peer who provided the `key`.
   *
   * @abstract
   * @param  {type} key A key obtained from a peer.
   * @param  {type} options = {} Any other options which depend on the
   *           implementation.
   * @return {Promise} It is resolved when the connection is established,
   *           otherwise it is rejected.
   */
  join (key, options = {}) {
    throw new Error('Must be implemented by subclass!')
  }
}

export {
  /** Interface to be implemented by each connection service. */
  Interface
}
