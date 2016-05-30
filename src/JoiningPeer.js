/**
 * This class represents a temporary state of a peer, while he is about to join
 * the web channel. During the joining process every peer in the web channel
 * and the joining peer have an instance of this class with the same `id` and
 * `intermediaryId` attribute values. After the joining process has been finished
 * regardless of success, these instances will be deleted.
 */
class JoiningPeer {
  constructor (id, intermediaryId, intermediaryChannel) {
    /**
     * The joining peer id.
     *
     * @type {string}
     */
    this.id = id

    /**
     * The id of the peer who invited the joining peer to the web channel. It is
     * a member of the web channel and called an intermediary peer between the
     * joining peer and the web channel. The same value for all instances.
     *
     * @type {string}
     */
    this.intermediaryId = intermediaryId

    /**
     * The channel between the joining peer and intermediary peer. It is null
     * for every peer, but the joining and intermediary peers.
     *
     * @type {Channel}
     */
    this.intermediaryChannel = intermediaryChannel

    /**
     * This attribute is proper to each peer. Array of channels which will be
     * added to the current peer once the joining peer become the member of the
     * web channel.
     *
     * @type {Channel[]}
     */
    this.channelsToAdd = []

    /**
     * This attribute is proper to each peer. Array of channels which will be
     * closed with the current peer once the joining peer become the member of the
     * web channel.
     *
     * @type {Channel[]}
     */
    this.channelsToRemove = []
  }

  /**
   * Add channel to `channelsToAdd` array.
   *
   * @param  {Channel} channel - Channel to add.
   */
  toAddList (channel) {
    this.channelsToAdd[this.channelsToAdd.length] = channel
  }

  /**
   * Add channel to `channelsToRemove` array
   *
   * @param  {Channel} channel - Channel to add.
   */
  toRemoveList (channel) {
    this.channelsToAdd[this.channelsToAdd.length] = channel
  }
}

export default JoiningPeer
