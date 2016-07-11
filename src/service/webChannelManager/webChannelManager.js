import {ServiceInterface} from '../service'
import {provide, CHANNEL_BUILDER} from '../../serviceProvider'

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
 * Connection service of the peer who received a message of this type should
 * establish connection with one or several peers.
 */
const CONNECT_WITH = 1
const CONNECT_WITH_FEEDBACK = 2
const THIS_CHANNEL_TO_JOINING_PEER = 3

const CONNECT_WITH_TIMEOUT = 5000

/**
 * Each Web Channel Manager Service must implement this interface.
 * @interface
 * @extends module:service~ServiceInterface
 */
class WebChannelManagerInterface extends ServiceInterface {

  constructor () {
    super()
  }

  onMessage (wc, channel, msg) {
    // console.log('[DEBUG] {webChannelManager} onMessage: ', msg)
    switch (msg.code) {
      case CONNECT_WITH:
        if (wc.isJoining()) {
          msg.joiningPeers.forEach((jp) => {
            wc.addJoiningPeer(jp.jpId, jp.intermediaryId)
            msg.peerIds.push(jp.jpId)
          })
        }
        // console.log('Me ' + wc.myId + ' should connect to ----> ', msg.peerIds)
        msg.peerIds = this.reUseIntermediaryChannelIfPossible(wc, msg.jpId, msg.peerIds)
        let failed = []
        if (msg.peerIds.length === 0) {
          wc.sendSrvMsg(this.name, msg.sender,
            {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed}
          )
        } else {
          // console.log('Me ' + wc.myId + ' should connect to ----> ' + msg.peerIds + '--reUseIntermediaryChannelIfPossible')
          let counter = 0
          let cBuilder = provide(CHANNEL_BUILDER)
          msg.peerIds.forEach((id) => {
            cBuilder.connectMeTo(wc, id)
              .then((channel) => {
                return wc.initChannel(channel, true, id)
              })
              .then((channel) => {
                // console.log('PEER ' + wc.myId + ' CONNECTED TO ' + channel.peerId)
                counter++
                let jp = wc.getJoiningPeer(msg.jpId)
                jp.toAddList(channel)
                wc.sendSrvMsg(this.name, channel.peerId,
                  {code: THIS_CHANNEL_TO_JOINING_PEER,
                  jpId: msg.jpId,
                  intermediaryId: jp.intermediaryId,
                  toBeAdded: true},
                  channel
                )
                if (counter === msg.peerIds.length) {
                  wc.sendSrvMsg(this.name, msg.sender,
                    {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed}
                  )
                }
              })
              .catch((reason) => {
                counter++
                failed.push({id, reason})
                if (counter === msg.peerIds.length) {
                  wc.sendSrvMsg(this.name, msg.sender,
                    {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed}
                  )
                }
              })
          })
        }
        break
      case CONNECT_WITH_FEEDBACK:
        this.getPendingRequest(wc, msg.id).resolve()
        break
      case THIS_CHANNEL_TO_JOINING_PEER:
        let jp
        if (wc.hasJoiningPeer(msg.jpId)) {
          jp = wc.getJoiningPeer(msg.jpId)
        } else {
          jp = wc.addJoiningPeer(msg.jpId, msg.intermediaryId)
        }
        if (msg.toBeAdded) {
          jp.toAddList(channel)
        } else {
          jp.toRemoveList(channel)
        }
        break
    }
  }

  /**
   * Send a request to a peer asking him to establish a connection with some
   * peers. This function is used when a new peer is joining the *WebChannel*.
   * The request can be sent to the peer who is joining as well as other peers
   * who are already members of the *WebChannel*.
   *
   * @param  {WebChannel} wc - The Web Channel.
   * @param  {string} id - Id of the peer who will receive this request.
   * @param  {string} jpId - Joining peer id (it is possible that `id`=`jpId`).
   * @param  {string[]} peerIds - Ids of peers with whom `id` peer must established
*              connections.
   * @return {Promise} - Is resolved once some of the connections could be established. It is rejected when an error occured.
   */
  connectWith (wc, id, jpId, peerIds, jpIds) {
    let joiningPeers = []
    jpIds.forEach((id) => {
      let jp = wc.getJoiningPeer(id)
      joiningPeers.push({
        jpId: jp.id,
        intermediaryId: jp.intermediaryId
      })
    })
    wc.sendSrvMsg(this.name, id,
      {code: CONNECT_WITH, jpId: jpId, sender: wc.myId, peerIds, joiningPeers}
    )
    return new Promise((resolve, reject) => {
      let timeout = this.calculateConnectWithTimeout(peerIds.length)
      this.addPendingRequest(wc, id, {resolve, reject}, timeout,
        () => reject(`CONNECT_WITH_TIMEOUT (${timeout}ms)`)
      )
    })
  }

  calculateConnectWithTimeout (nbPeers) {
    if (nbPeers > 0) {
      return CONNECT_WITH_TIMEOUT + Math.log10(nbPeers)
    } else {
      return CONNECT_WITH_TIMEOUT
    }
  }

  reUseIntermediaryChannelIfPossible (wc, jpId, ids) {
    let intermidiaryChannel
    let peerIndex
    for (let jp of wc.getJoiningPeers()) {
      if (jp.intermediaryChannel !== null) {
        peerIndex = ids.indexOf(jp.intermediaryId)
        if (peerIndex === -1) {
          peerIndex = ids.indexOf(jp.id)
        }
        if (peerIndex !== -1) {
          intermidiaryChannel = jp.intermediaryChannel
          break
        }
      }
    }
    let jp = wc.getJoiningPeer(jpId)
    jp.toAddList(intermidiaryChannel)
    wc.sendSrvMsg(this.name, jp.intermediaryId,
      {code: THIS_CHANNEL_TO_JOINING_PEER,
        jpId,
        intermediaryId: jp.intermediaryId,
        toBeAdded: true},
      intermidiaryChannel
    )
    ids.splice(peerIndex, 1)
    return ids
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

export {
  /** @see module:webChannelManager~WebChannelManagerInterface */
  WebChannelManagerInterface
}
