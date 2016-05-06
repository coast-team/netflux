import * as serviceProvider from './serviceProvider'
import JoiningPeer from './JoiningPeer'

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
 * Channel interface.
 * [RTCDataChannel]{@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
 * and
 * [WebSocket]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket}
 * implement it implicitly. Any other channel must implement this interface.
 *
 * @interface
 */
class Channel {
  constructor (channel, webChannel, peerId) {
    this.channel = channel
    this.channel.binaryType = 'arraybuffer'
    this.webChannel = webChannel
    this.peerId = peerId
  }

  config () {
    this.channel.onmessage = (msgEvt) => {
      let decoder = new TextDecoder()
      let i8array = new Uint8Array(msgEvt.data)
      let code = i8array[0]
      let msg = {}
      // let msg = JSON.parse(msgEvt.data)
      if (code === USER_DATA) {
        let str = decoder.decode(i8array.subarray(1, i8array.length))
        this.webChannel.onMessage(this.peerId, str)
        return
      } else {
        let str = decoder.decode(i8array.subarray(1, i8array.length))
        msg = JSON.parse(str)
      }
      let jp
      switch (code) {
        // case USER_DATA:
        //   this.webChannel.onMessage(msg.id, msg.data)
        //   break
        case LEAVE:
          this.webChannel.onLeaving(msg.id)
          for (let c of this.webChannel.channels) {
            if (c.peerId === msg.id) {
              this.webChannel.channels.delete(c)
            }
          }
          break
        case SERVICE_DATA:
          if (this.webChannel.myId === msg.recepient) {
            serviceProvider.get(msg.serviceName, this.webChannel.settings).onMessage(this.webChannel, this, msg.data)
          } else {
            this.webChannel.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
          }
          break
        case JOIN_INIT:
          this.webChannel.topology = msg.manager
          this.webChannel.myId = msg.id
          this.peerId = msg.intermediaryId
          jp = new JoiningPeer(msg.id, msg.intermediaryId)
          jp.intermediaryChannel = this
          this.webChannel.addJoiningPeer(jp)
          break
        case JOIN_NEW_MEMBER:
          this.webChannel.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
          break
        case REMOVE_NEW_MEMBER:
          this.webChannel.removeJoiningPeer(msg.id)
          break
        case JOIN_FINILIZE:
          this.webChannel.joinSuccess(this.webChannel.myId)
          this.webChannel.manager.broadcast(this.webChannel, JOIN_SUCCESS, {id: this.webChannel.myId})
          this.webChannel.onJoin()
          break
        case JOIN_SUCCESS:
          this.webChannel.joinSuccess(msg.id)
          this.webChannel.onJoining(msg.id)
          break
        case THIS_CHANNEL_TO_JOINING_PEER:
          if (this.webChannel.hasJoiningPeer(msg.id)) {
            jp = this.webChannel.getJoiningPeer(msg.id)
          } else {
            jp = new JoiningPeer(msg.id)
            this.webChannel.addJoiningPeer(jp)
          }
          if (msg.toBeAdded) {
            jp.toAddList(this)
          } else {
            jp.toRemoveList(this)
          }
          break
        case INIT_CHANNEL_PONG:
          this.onPong()
          delete this.onPong
          break
      }
    }
    this.channel.onerror = (evt) => {
      console.log('DATA_CHANNEL ERROR: ', evt)
    }
    this.channel.onclose = (evt) => {
      console.log('DATA_CHANNEL CLOSE: ', evt)
    }
  }

  /**
   * send - description.
   *
   * @abstract
   * @param {string} msg - Message in stringified JSON format.
   */
  send (code, data = {}) {
    let i8array
    let msgStr = code === USER_DATA ? data : JSON.stringify(data)
    let encoder = new TextEncoder()
    let msgEncoded = encoder.encode(msgStr)
    i8array = new Uint8Array(1 + msgEncoded.length)
    i8array[0] = code
    let index = 1
    for (let i in msgEncoded) {
      i8array[index++] = msgEncoded[i]
    }
    this.channel.send(i8array)
  }

  /**
   * Close channel.
   *
   * @abstract
   */
  close () {
    this.channel.close()
  }
}

export { Channel }
