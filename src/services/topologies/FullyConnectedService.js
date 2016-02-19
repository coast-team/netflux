import * as cs from '../../constants'
import ServiceProvider from '../../ServiceProvider'

export default class FullyConnectedService {

  constructor (options = {}) {}

  addStart (channel, webChannel) {
    let protocol = ServiceProvider.get(cs.EXCHANGEPROTOCOL_SERVICE)
    return new Promise((resolve, reject) => {
      channel.peerID = this._generateID()
      channel.send(protocol.message(cs.YOUR_NEW_ID, {
        newID: channel.peerID,
        myID: webChannel.myID
      }))
      if (Reflect.has(webChannel, 'aboutToJoin') && webChannel.aboutToJoin instanceof Map) {
        webChannel.aboutToJoin.set(channel.peerID, channel)
      } else {
        webChannel.aboutToJoin = new Map()
      }

      if (webChannel.channels.size === 0) {
        webChannel.channels.add(channel)
        resolve(channel.peerID)
      } else {
        webChannel.successfullyConnected = new Map()
        webChannel.successfullyConnected.set(channel.peerID, 0)
        webChannel.connectionSucceed = (id, withId) => {
          let counter = webChannel.successfullyConnected.get(withId)
          webChannel.successfullyConnected.set(withId, ++counter)
          if (webChannel.successfullyConnected.get(withId) === webChannel.channels.size) {
            this.addFinish(webChannel, withId)
            resolve(withId)
          }
        }
        let connector = ServiceProvider.get(cs.WEBRTC_SERVICE)
        webChannel.channels.forEach((c) => {
          connector.connect(channel.peerID, webChannel, c.peerID)
        })
      }
    })
  }

  addFinish (webChannel, id) {
    if (id != webChannel.myID) {
      webChannel.channels.add(webChannel.aboutToJoin.get(id))
      //webChannel.aboutToJoin.delete(id)
      if (Reflect.has(webChannel, 'successfullyConnected')) {
        webChannel.successfullyConnected.delete(id)
      }
    } else {
      webChannel.onopen()
    }
  }

  broadcast (webChannel, data) {
    for (let c of webChannel.channels) {
      c.send(data)
    }
  }

  sendTo (id, webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.peerID == id) {
        c.send(data)
      }
    }
  }

  leave (webChannel) {
    this.broadcast(webChannel)
  }

  _generateID () {
    const MIN_LENGTH = 10
    const DELTA_LENGTH = 10
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)
    const maskLastIndex = MASK.length - 1
    let result = ''

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * maskLastIndex)]
    }
    return result
  }

}
