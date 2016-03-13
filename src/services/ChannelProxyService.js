import ServiceInterface from '../ServiceInterface'
import * as cs from '../constants'
import JoiningPeer from '../JoiningPeer'
import * as services from '../services'

/**
 * Class responsible of sent/received message format via channels.
 */
class ChannelProxyService extends ServiceInterface {

  onMsg (e) {
    let msg = JSON.parse(e.data)
    let channel = e.currentTarget
    let webChannel = channel.webChannel
    let jp
    switch (msg.code) {
      case cs.USER_DATA:
        webChannel.onMessage(msg.id, msg.data)
        break
      case cs.LEAVE:
        webChannel.onLeaving(msg.id)
        webChannel.channels.delete(webChannel.channels.get(msg.id))
        break
      case cs.SERVICE_DATA:
        if (webChannel.myId === msg.recepient) {
          webChannel.proxy.onSrvMsg(webChannel, msg)
        } else {
          webChannel.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
        }
        break
      case cs.JOIN_INIT:
        webChannel.topology = msg.manager
        webChannel.myId = msg.id
        channel.peerId = msg.intermediaryId
        jp = new JoiningPeer(msg.id, msg.intermediaryId)
        jp.intermediaryChannel = channel
        webChannel.addJoiningPeer(jp)
        break
      case cs.JOIN_NEW_MEMBER:
        webChannel.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
        break
      case cs.JOIN_FINILIZE:
        webChannel.joinSuccess(webChannel.myId)
        let nextMsg = webChannel.proxy.msg(cs.JOIN_SUCCESS, {id: webChannel.myId})
        webChannel.manager.broadcast(webChannel, nextMsg)
        webChannel.onJoin()
        break
      case cs.JOIN_SUCCESS:
        webChannel.joinSuccess(msg.id)
        webChannel.onJoining(msg.id)
        break
      case cs.THIS_CHANNEL_TO_JOINING_PEER:
        if (webChannel.hasJoiningPeer(msg.id)) {
          jp = webChannel.getJoiningPeer(msg.id)
        } else {
          jp = new JoiningPeer(msg.id)
          webChannel.addJoiningPeer(jp)
        }
        if (msg.toBeAdded) {
          jp.toAddList(channel)
        } else {
          jp.toRemoveList(channel)
        }
        break
    }
  }

  onSrvMsg (webChannel, msg) {
    services.get(msg.serviceName, webChannel.settings).onMessage(webChannel, msg.data)
  }

  msg (code, data = {}) {
    let msg = Object.assign({code}, data)
    return JSON.stringify(msg)
  }
}

export default ChannelProxyService
