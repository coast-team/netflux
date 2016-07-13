import {ServiceInterface} from '../service'
import {WEBRTC, WEBSOCKET, provide} from '../../serviceProvider'

const NEW_CHANNEL = 'newChannel'

class ChannelBuilderService extends ServiceInterface {
  constructor (options = {}) {
    super()
    this.default = {
      connectors: [WEBRTC],
      host: '',
      port: 0
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  connectMeTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.addPendingRequest(wc, id, {resolve, reject})
      let connectors = [WEBRTC]
      if (typeof window === 'undefined') connectors.push(WEBSOCKET)
      let host = wc.settings.host
      let port = wc.settings.port
      wc.sendSrvMsg(this.name, id, {connectors, sender: wc.myId, host, port, oneMsg: true})
    })
  }

  onChannel (wc, channel, oneMsg, sender) {
    if (!oneMsg) wc.initChannel(channel, false, sender)
    else this.getPendingRequest(wc, sender).resolve(channel)
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
    } else if (typeof window !== 'undefined') {
      // The peer who send the message isn't a bot and i'm not a bot too
      let cBuilder = provide(WEBRTC)
      cBuilder.connectOverWebChannel(wc, msg.sender)
        .then((channel) => {
          this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
        })
    } else {
      // The peer who send the message isn't a bot and i'm bot
      host = wc.settings.host
      port = wc.settings.port
      wc.sendSrvMsg(this.name, msg.sender, {connectors: [WEBRTC, WEBSOCKET],
        sender: wc.myId, host, port, oneMsg: false})
    }
  }
}

export default ChannelBuilderService
