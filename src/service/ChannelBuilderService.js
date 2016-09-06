import {isBrowser} from 'helper'
import ServiceInterface from 'service/ServiceInterface'
import {webRTCAvailable} from 'service/WebRTCService'
import {WEBRTC, WEBSOCKET, provide} from 'serviceProvider'

const NEW_CHANNEL = 'newChannel'

class ChannelBuilderService extends ServiceInterface {
  constructor (id) {
    super(id)
    this.default = {
      host: '',
      port: 0
    }
  }

  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.setPendingRequest(wc, id, {resolve, reject})
      let data = this.availableConnectors(wc)
      let connectors = data.connectors
      let host = data.host
      let port = data.port
      wc.sendInnerTo(id, this.id, {connectors, sender: wc.myId, host, port, oneMsg: true})
    })
  }

  availableConnectors (wc) {
    let data = {}
    let connectors = []
    if (webRTCAvailable) connectors.push(WEBRTC)
    let host = wc.settings.host
    let port = wc.settings.port
    if (!isBrowser() && host !== undefined && port !== undefined) connectors.push(WEBSOCKET)
    data = {connectors, host, port}
    return data
  }

  onChannel (wc, channel, oneMsg, sender) {
    wc.initChannel(channel, sender)
      .then(channel => {
        if (oneMsg) this.getPendingRequest(wc, sender).resolve(channel)
      })
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    let host = msg.host
    let port = msg.port
    let settings = Object.assign({}, wc.settings, {host, port})
    if (msg.connectors.includes(WEBSOCKET)) {
      // A Bot server send the message
      let cBuilder = provide(WEBSOCKET, settings)
      let url = 'ws://' + host + ':' + port
      // Try to connect in WebSocket
      cBuilder.connect(url)
        .then(channel => {
          channel.send(JSON.stringify({
            code: NEW_CHANNEL,
            sender: wc.myId,
            wcId: wc.id,
            oneMsg: msg.oneMsg}))
          this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
        })
        .catch(() => {
          cBuilder = provide(WEBRTC)
          cBuilder.connectOverWebChannel(wc, msg.sender)
            .then(channel => {
              this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
            })
        })
    } else {
      let data = this.availableConnectors(wc)
      let host = data.host
      let port = data.port
      if (data.connectors.includes(WEBSOCKET)) {
        // The peer who send the message doesn't listen in WebSocket and i'm bot
        wc.sendInnerTo(msg.sender, this.id, {
          connectors: [WEBRTC, WEBSOCKET],
          sender: wc.myId,
          host,
          port,
          oneMsg: false})
      } else {
        // The peer who send the message doesn't listen in WebSocket and doesn't listen too
        let cBuilder = provide(WEBRTC)
        cBuilder.connectOverWebChannel(wc, msg.sender)
          .then(channel => this.onChannel(wc, channel, !msg.oneMsg, msg.sender))
      }
    }
  }
}

export default ChannelBuilderService
