import {isBrowser} from 'helper'
import ServiceInterface from 'service/ServiceInterface'
import WebRTCService from 'service/WebRTCService'
import {WEBRTC, WEBSOCKET, provide} from 'serviceProvider'

const NEW_CHANNEL = 'newChannel'

class ChannelBuilderService extends ServiceInterface {
  constructor (options = {}) {
    super()
    this.default = {
      host: '',
      port: 0
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  connectMeTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.addPendingRequest(wc, id, {resolve, reject})
      let data = this.availableConnectors(wc)
      let connectors = data.connectors
      let host = data.host
      let port = data.port
      wc.sendSrvMsg(this.name, id, {connectors, sender: wc.myId, host, port, oneMsg: true})
    })
  }

  availableConnectors (wc) {
    let data = {}
    let connectors = []
    if (WebRTCService.isAvailabled()) connectors.push(WEBRTC)
    let host = wc.settings.host
    let port = wc.settings.port
    if (!isBrowser() && host !== undefined && port !== undefined) connectors.push(WEBSOCKET)
    data = {connectors, host, port}
    return data
  }

  onChannel (wc, channel, oneMsg, sender) {
    wc.initChannel(channel, sender)
      .then((channel) => {
        if (oneMsg) this.getPendingRequest(wc, sender).resolve(channel)
      })
  }

  onMessage (wc, channel, msg) {
    let availabled = msg.connectors
    let host = msg.host
    let port = msg.port
    let settings = Object.assign({}, wc.settings, {host, port})
    if (availabled.indexOf(WEBSOCKET) > -1) {
      // A Bot server send the message
      let cBuilder = provide(WEBSOCKET, settings)
      let url = 'ws://' + host + ':' + port
      // Try to connect in WebSocket
      cBuilder.connect(url)
        .then((channel) => {
          channel.send(JSON.stringify({code: NEW_CHANNEL, sender: wc.myId,
            wcId: wc.id, oneMsg: msg.oneMsg}))
          this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
        })
        .catch(() => {
          cBuilder = provide(WEBRTC)
          cBuilder.connectOverWebChannel(wc, msg.sender)
            .then((channel) => {
              this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
            })
        })
    } else {
      let data = this.availableConnectors(wc)
      let connectors = data.connectors
      let host = data.host
      let port = data.port
      if (connectors.indexOf(WEBSOCKET) > -1) {
        // The peer who send the message doesn't listen in WebSocket and i'm bot
        wc.sendSrvMsg(this.name, msg.sender, {connectors: [WEBRTC, WEBSOCKET],
          sender: wc.myId, host, port, oneMsg: false})
      } else {
        // The peer who send the message doesn't listen in WebSocket and doesn't listen too
        let cBuilder = provide(WEBRTC)
        cBuilder.connectOverWebChannel(wc, msg.sender)
          .then((channel) => this.onChannel(wc, channel, !msg.oneMsg, msg.sender))
      }
    }
  }
}

export default ChannelBuilderService
