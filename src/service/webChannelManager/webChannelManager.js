import * as service from '../service'
import * as serviceProvider from '../../serviceProvider'
import {THIS_CHANNEL_TO_JOINING_PEER} from '../channelProxy/channelProxy'

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
const CONNECT_WITH_TIMEOUT = 5000
const ADD_INTERMEDIARY_CHANNEL = 4

/**
 * Each Web Channel Manager Service must implement this interface.
 * @interface
 * @extends module:service~Interface
 */
class Interface extends service.Interface {
  onMessage (wc, msg) {
    let cBuilder = serviceProvider.get(wc.settings.connector, wc.settings)
    switch (msg.code) {
      case CONNECT_WITH:
        console.log('CONNECT_WITH received: ', msg)
        msg.peers = this.reUseIntermediaryChannelIfPossible(wc, msg.jpId, msg.peers)
        cBuilder
          .connectMeToMany(wc, msg.peers)
          .then(result => {
            console.log('CONNECT_WITH result: ', result)
            result.channels.forEach(c => {
              wc.initChannel(c, c.peerId)
              wc.getJoiningPeer(msg.jpId).toAddList(c)
              c.send(wc.proxy.msg(THIS_CHANNEL_TO_JOINING_PEER,
                {id: msg.jpId, toBeAdded: true}
              ))
            })
            console.log('CONNECT_WITH send feedback: ', {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: result.failed})
            wc.sendSrvMsg(this.name, msg.sender,
              {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: result.failed}
            )
          })
          .catch(err => {
            console.log('connectMeToMany FAILED, ', err)
          })
        break
      case CONNECT_WITH_FEEDBACK:
        console.log('CONNECT_WITH_FEEDBACK received: ', msg)
        wc.connectWithRequests.get(msg.id)(true)
        break
      case ADD_INTERMEDIARY_CHANNEL:
        let jp = wc.getJoiningPeer(msg.jpId)
        jp.toAddList(jp.intermediaryChannel)
        break
    }
  }

  /**
   * Send a request to a peer asking him to establish a connection with some
   * peers. This function is used when a new peer is joining Web Channel.
   * The request can be sent to the peer who is joining as well as other peers
   * who are already members of Web Channel.
   *
   * @param  {WebChannel} wc - The Web Channel.
   * @param  {string} id - Id of the peer who will receive this request.
   * @param  {string} jpId - Joining peer id (it is possible that `id`=`jpId`).
   * @param  {string[]} peers - Ids of peers with whom `id` peer must established
*              connections.
   * @return {Promise} - Is resolved once some of the connections could be established. It is rejected when an error occured.
   */
  connectWith (wc, id, jpId, peers) {
    console.log('send CONNECT_WITH to: ' + id + ' JoiningPeerID: ' + jpId + ' with peers', peers)
    wc.sendSrvMsg(this.name, id,
      {code: CONNECT_WITH, jpId: jpId,
        sender: wc.myId, peers}
    )
    return new Promise((resolve, reject) => {
      wc.connectWithRequests.set(id, isDone => {
        if (isDone) {
          resolve()
        } else {
          reject()
        }
      })
      setTimeout(() => {
        reject('CONNECT_WITH_TIMEOUT')
      }, this.calculateConnectWithTimeout(peers.length))
    })
  }

  calculateConnectWithTimeout (nbPeers) {
    if (nbPeers > 0) {
      return CONNECT_WITH_TIMEOUT + Math.log10(nbPeers)
    } else {
      return CONNECT_WITH_TIMEOUT
    }
  }

  reUseIntermediaryChannelIfPossible (webChannel, jpId, ids) {
    let idToRemove = null
    let jp
    if (webChannel.isJoining()) {
      jp = webChannel.getJoiningPeer(jpId)
      if (ids.indexOf(jp.intermediaryId) !== -1) {
        idToRemove = jp.intermediaryId
      }
    } else {
      if (ids.indexOf(jpId) !== -1) {
        jp = webChannel.getJoiningPeer(jpId)
        if (jp.intermediaryChannel !== null) {
          idToRemove = jpId
        }
      }
    }
    if (idToRemove !== null) {
      jp.toAddList(jp.intermediaryChannel)
      webChannel.sendSrvMsg(this.name, idToRemove, {
        code: ADD_INTERMEDIARY_CHANNEL, jpId
      })
      ids.splice(ids.indexOf(idToRemove), 1)
    }
    return ids
  }

  /**
   * Adds a new peer into Web Channel.
   *
   * @abstract
   * @param  {ChannelInterface} ch - Channel to be added (it should has
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
  /** @see module:webChannelManager~Interface */
  Interface
}
