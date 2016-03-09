import * as cs from '../../constants'
import ServiceInterface from '../../ServiceInterface'
import * as services from '../../services'

/**
 * Web Channel Manager module - start point for all connection services. Composed of:
 * - Constants to identify the request type sent by this peer's service to
 *   the same service of another peer.
 * - Interface which each web channel manager should extends.
 * @module webChannelManager
 */

/**
 * Connection service of the peer who received a message of this type should
 * establish connection with one or several peers.
 */
export const CONNECT_WITH = 1
export const CONNECT_WITH_FEEDBACK = 2
export const ADD_INTERMEDIARY_CHANNEL = 4

/**
 * Interface for all web channel manager services. Its standalone
 * instance is useless.
 * @interface
 * @extends ServiceInterface
 */
class Interface extends ServiceInterface {

  onMessage (webChannel, msg) {
    let cBuilder = services.get(webChannel.settings.connector, webChannel.settings)
    switch (msg.code) {
      case CONNECT_WITH:
        msg.peers = this.reUseIntermediaryChannelIfPossible(webChannel, msg.jpId, msg.peers)
        cBuilder
          .connectMeToMany(webChannel, msg.peers)
          .then((channels) => {
            channels.forEach((c) => {
              webChannel.initChannel(c, c.peerId)
              webChannel.getJoiningPeer(msg.jpId).toAddList(c)
              c.send(webChannel.proxy.msg(cs.THIS_CHANNEL_TO_JOINING_PEER,
                {id: msg.jpId, toBeAdded: true}
              ))
            })
            webChannel.sendSrvMsg(this.name, msg.sender,
              {code: CONNECT_WITH_FEEDBACK, id: webChannel.myId, isDone: true}
            )
          })
          .catch((err) => {
            webChannel.sendSrvMsg(this.name, msg.sender,
              {code: CONNECT_WITH_FEEDBACK, id: webChannel.myId, isDone: false}
            )
          })
        break
      case CONNECT_WITH_FEEDBACK:
        webChannel.connectWithRequests.get(msg.id)(msg.isDone)
        break
      case ADD_INTERMEDIARY_CHANNEL:
        let jp = webChannel.getJoiningPeer(msg.jpId)
        jp.toAddList(jp.intermediaryChannel)
        break
    }
  }

  connectWith (webChannel, id, jpId, peers) {
    webChannel.sendSrvMsg(this.name, id,
      {code: CONNECT_WITH, jpId: jpId,
        sender: webChannel.myId, peers}
    )
    return new Promise((resolve, reject) => {
      webChannel.connectWithRequests.set(id, (isDone) => {
        if (isDone) {
          resolve()
        } else {
          reject()
        }
      })
    })
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

  add (webChannel, data) {
    throw new Error('Must be implemented by subclass!')
  }

  broadcast (webChannel, data) {
    throw new Error('Must be implemented by subclass!')
  }

  sendTo (id, webChannel, data) {
    throw new Error('Must be implemented by subclass!')
  }

  leave (webChannel) {
    throw new Error('Must be implemented by subclass!')
  }
}

export { Interface }
