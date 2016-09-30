import ServiceInterface from 'service/ServiceInterface'
import {webRTCAvailable} from 'service/WebRTCService'
import {listenOnSocket} from 'service/WebSocketService'
import {WEBRTC, WEBSOCKET, provide} from 'serviceProvider'

class ChannelBuilderService extends ServiceInterface {
  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.setPendingRequest(wc, id, {resolve, reject})
      let connectors = this.availableConnectors(wc)
      wc.sendInnerTo(id, this.id, {
        connectors,
        botUrl: wc.settings.bot
      })
    })
  }

  availableConnectors (wc) {
    let connectors = []
    if (webRTCAvailable) connectors[connectors.length] = WEBRTC
    if (listenOnSocket) connectors[connectors.length] = WEBSOCKET
    let forground = wc.settings.connector
    if (connectors.length !== 1 && connectors[0] !== forground) {
      let tmp = connectors[0]
      connectors[0] = connectors[1]
      connectors[1] = tmp
    }
    return connectors
  }

  onChannel (wc, channel, senderId) {
    wc.initChannel(channel, senderId)
      .then(channel => {
        let pendReq = this.getPendingRequest(wc, senderId)
        if (pendReq !== null) pendReq.resolve(channel)
      })
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    if (msg.connectors.includes(WEBSOCKET)) {
      // A Bot server send the message
      // Try to connect in WebSocket
      provide(WEBSOCKET).connect(msg.botUrl)
        .then(channel => {
          channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
          this.onChannel(wc, channel, senderId)
        })
        .catch(() => {
          provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
            .then(channel => {
              this.onChannel(wc, channel, senderId)
            })
        })
    } else {
      let connectors = this.availableConnectors(wc)
      if (connectors.includes(WEBSOCKET)) {
        // The peer who send the message doesn't listen in WebSocket and i'm bot
        wc.sendInnerTo(senderId, this.id, {
          connectors,
          botUrl: wc.settings.bot
        })
      } else {
        // The peer who send the message doesn't listen in WebSocket and doesn't listen too
        provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
          .then(channel => this.onChannel(wc, channel, senderId))
      }
    }
  }
}

export default ChannelBuilderService
