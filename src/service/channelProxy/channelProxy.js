import * as service from '../service'
import * as serviceProvider from '../../serviceProvider'
import JoiningPeer from '../../JoiningPeer'

/**
 * Proxy module for configure channel event handlers and any message sent via
 * a channel should be build here in order to be understand by the recepient
 * peer.
 * @module channelProxy
 */

/**
 * Constant used to build a message designated to API user.
 * @type {int}
 */
export const USER_DATA = 0

/**
 * Constant used to build a message designated to a specific service.
 * @type {int}
 */
export const SERVICE_DATA = 1
/**
 * Constant used to build a message that a user has left Web Channel.
 * @type {int}
 */
export const LEAVE = 2
/**
 * Constant used to build a message to be sent to a newly joining peer.
 * @type {int}
 */
export const JOIN_INIT = 3
/**
 * Constant used to build a message to be sent to all peers in Web Channel to
 * notify them about a new peer who is about to join the Web Channel.
 * @type {int}
 */
export const JOIN_NEW_MEMBER = 4
/**
 * Constant used to build a message to be sent to all peers in Web Channel to
 * notify them that the new peer who should join the Web Channel, refuse to join.
 * @type {int}
 */
export const REMOVE_NEW_MEMBER = 5
/**
 * Constant used to build a message to be sent to a newly joining peer that he
 * has can now succesfully join Web Channel.
 * @type {int}
 */
export const JOIN_FINILIZE = 6
/**
 * Constant used to build a message to be sent by the newly joining peer to all
 * peers in Web Channel to notify them that he has succesfully joined the Web
 * Channel.
 * @type {int}
 */
export const JOIN_SUCCESS = 7
/**
 * @type {int}
 */
export const THIS_CHANNEL_TO_JOINING_PEER = 8
/**
 * @type {int}
 */
export const INIT_CHANNEL_PONG = 9

/**
 * This is a special service class for {@link ChannelInterface}. It mostly
 * contains event handlers (e.g. *onmessage*, *onclose* etc.) to configure
 * a newly created channel. Thus be careful to use `this` in handlers, as
 * it will refer to the instance of `ChannelInterface` and not to the
 * instance of `ChannelProxyService`.
 */
class ChannelProxyService extends service.Interface {

  /**
   * On message event handler.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
   *
   * @param  {MessageEvent} msgEvt - Message event
   */
  onMsg (msgEvt) {
    let msg = JSON.parse(msgEvt.data)
    let ch = msgEvt.currentTarget
    let wc = ch.webChannel
    let jp
    switch (msg.code) {
      case USER_DATA:
        wc.onMessage(msg.id, msg.data)
        break
      case LEAVE:
        wc.onLeaving(msg.id)
        for (let c of wc.channels) {
          if (c.peerId === msg.id) {
            wc.channels.delete(c)
          }
        }
        break
      case SERVICE_DATA:
        if (wc.myId === msg.recepient) {
          wc.proxy.onSrvMsg(wc, msg)
        } else {
          wc.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
        }
        break
      case JOIN_INIT:
        console.log('JOIN_INIT my new id: ' + msg.id)
        wc.topology = msg.manager
        wc.myId = msg.id
        ch.peerId = msg.intermediaryId
        jp = new JoiningPeer(msg.id, msg.intermediaryId)
        jp.intermediaryChannel = ch
        wc.addJoiningPeer(jp)
        break
      case JOIN_NEW_MEMBER:
        wc.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
        break
      case REMOVE_NEW_MEMBER:
        wc.removeJoiningPeer(msg.id)
        break
      case JOIN_FINILIZE:
        wc.joinSuccess(wc.myId)
        let nextMsg = wc.proxy.msg(JOIN_SUCCESS, {id: wc.myId})
        wc.manager.broadcast(wc, nextMsg)
        wc.onJoin()
        break
      case JOIN_SUCCESS:
        wc.joinSuccess(msg.id)
        wc.onJoining(msg.id)
        break
      case THIS_CHANNEL_TO_JOINING_PEER:
        if (wc.hasJoiningPeer(msg.id)) {
          jp = wc.getJoiningPeer(msg.id)
        } else {
          jp = new JoiningPeer(msg.id)
          wc.addJoiningPeer(jp)
        }
        if (msg.toBeAdded) {
          jp.toAddList(ch)
        } else {
          jp.toRemoveList(ch)
        }
        break
      case INIT_CHANNEL_PONG:
        ch.onPong()
        delete ch.onPong
        break
    }
  }

  /**
   * On channel close event handler.
   * - For `RTCDataChannel` the type of `evt` is `Event`
   * - For `WebSocket`, the type of `evt` is `CloseEvent`.
   * @see [Event doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
   * @see [CloseEvent doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
   *
   * @param  {Event} evt - Close event.
   */
  onClose (evt) {
    console.log('DATA_CHANNEL CLOSE: ', evt)
  }

  /**
   * On error event handler.
   * @see [Event doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
   *
   * @param  {Event} evt - Error event.
   */
  onError (evt) {
    console.log('DATA_CHANNEL ERROR: ', evt)
  }

  onDisconnect () {
    this.webChannel.channels.delete(this)
    this.webChannel.onLeaving(this.peerId)
  }

  configChannel (channel) {
    channel.onmessage = this.onMsg
    channel.onerror = this.onError
    channel.onclose = this.onClose
    channel.ondisconnect = this.onDisconnect
  }

  /**
   * When the message is designated for a service. This is not an event handler
   * for a channel. The main difference with the `SERVICE_DATA` message arriving
   * for `onMessage` is that here the message could be sent by the peer to
   * himself.
   *
   * @param  {WebChannel} wc - Web Channel.
   * @param  {Object} msg - Message.
   */
  onSrvMsg (wc, msg, channel = null) {
    serviceProvider.get(msg.serviceName, wc.settings).onMessage(wc, channel, msg.data)
  }

  /**
   * Message builder.
   *
   * @param  {int} code - One of the constant values in {@link constans}.
   * @param  {Object} [data={}] - Data to be send.
   * @return {string} - Data in stringified JSON format.
   */
  msg (code, data = {}) {
    let msg = Object.assign({code}, data)
    return JSON.stringify(msg)
  }
}

export {
/** @see module:channelProxy~ChannelProxyService */
ChannelProxyService }
