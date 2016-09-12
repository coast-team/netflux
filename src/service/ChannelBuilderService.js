import ServiceInterface from 'service/ServiceInterface'
import {webRTCAvailable} from 'service/WebRTCService'
import {listenOnWebSocket} from 'service/WebSocketService'
import {WEBRTC, WEBSOCKET, MESSAGE_BUILDER, provide} from 'serviceProvider'
import {JOIN} from 'service/MessageBuilderService'

class ChannelBuilderService extends ServiceInterface {
  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.setPendingRequest(wc, id, {resolve, reject})
      let connectors = this.availableConnectors(wc)
      wc.sendInnerTo(id, this.id, {
        connectors,
        sender: wc.myId,
        botUrl: wc.settings.bot,
        oneMsg: true
      })
    })
  }

  availableConnectors (wc) {
    let connectors = []
    if (webRTCAvailable) connectors[connectors.length] = WEBRTC
    if (listenOnWebSocket) connectors[connectors.length] = WEBSOCKET
    let forground = wc.settings.connector
    if (connectors.length !== 1 && connectors[0] !== forground) {
      let tmp = connectors[0]
      connectors[0] = connectors[1]
      connectors[1] = tmp
    }
    return connectors
  }

  onChannel (wc, channel, oneMsg, sender) {
    wc.initChannel(channel, sender)
      .then(channel => {
        if (oneMsg) this.getPendingRequest(wc, sender).resolve(channel)
      })
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    if (msg.connectors.includes(WEBSOCKET)) {
      // A Bot server send the message
      // Try to connect in WebSocket
      provide(WEBSOCKET).connect(msg.botUrl)
        .then(channel => {
          let msgBld = provide(MESSAGE_BUILDER)
          channel.send(msgBld.msg(JOIN, wc.myId, null, {
            wcId: this.id,
            oneMsg: msg.oneMsg
          }))
          this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
        })
        .catch(() => {
          provide(WEBRTC).connectOverWebChannel(wc, msg.sender)
            .then(channel => {
              this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
            })
        })
    } else {
      let connectors = this.availableConnectors(wc)
      if (connectors.includes(WEBSOCKET)) {
        // The peer who send the message doesn't listen in WebSocket and i'm bot
        wc.sendInnerTo(msg.sender, this.id, {
          connectors,
          sender: wc.myId,
          botUrl: wc.settings.bot,
          oneMsg: false
        })
      } else {
        // The peer who send the message doesn't listen in WebSocket and doesn't listen too
        provide(WEBRTC).connectOverWebChannel(wc, msg.sender)
          .then(channel => this.onChannel(wc, channel, !msg.oneMsg, msg.sender))
      }
    }
  }
}

export default ChannelBuilderService
