import {ServiceInterface} from '../service'
import {WEBRTC, WEBSOCKET, provide} from '../../serviceProvider'

const WHICH_CONNECTOR = 1
const CONNECTOR = 2
const NEW_CHANNEL = 'newChannel'

class ChannelBuilderService extends ServiceInterface {
  constructor (options = {}) {
    super()
    this.default = {
      connector: WEBRTC,
      host: '',
      port: 0
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  connectMeTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.addPendingRequest(wc, id, {resolve, reject})
      if (typeof window !== 'undefined') wc.sendSrvMsg(this.name, id, {code: WHICH_CONNECTOR, sender: wc.myId})
      else {
        wc.sendSrvMsg(this.name, id, {code: CONNECTOR, connectors: [WEBSOCKET], sender: wc.myId,
          host: wc.settings.host, port: wc.settings.port, which_connector_asked: false})
      }
    })
  }

  onChannel (wc, channel, whichConnectorAsked, sender) {
    if (!whichConnectorAsked) wc.initChannel(channel, false, sender)
    else this.getPendingRequest(wc, sender).resolve(channel)
  }

  onMessage (wc, channel, msg) {
    switch (msg.code) {
      case WHICH_CONNECTOR:
        let connectors = [WEBSOCKET]
        if (typeof window !== 'undefined') connectors.push(WEBRTC)

        wc.sendSrvMsg(this.name, msg.sender,
          {code: CONNECTOR, connectors, sender: wc.myId,
          host: wc.settings.host || '', port: wc.settings.port || 0, which_connector_asked: true})
        break
      case CONNECTOR:
        let availabled = msg.connectors

        let connector = WEBSOCKET
        if (typeof window !== 'undefined' && availabled.indexOf(WEBRTC) > -1) connector = WEBRTC

        let settings = Object.assign({}, wc.settings, {connector,
          host: msg.host, port: msg.port})
        let cBuilder = provide(connector, settings)

        if (connector === WEBSOCKET) {
          let url = 'ws://' + msg.host + ':' + msg.port
          cBuilder.connect(url).then((channel) => {
            channel.send(JSON.stringify({code: NEW_CHANNEL, sender: wc.myId, wcId: wc.id,
              which_connector_asked: msg.which_connector_asked}))
            this.onChannel(wc, channel, msg.which_connector_asked, msg.sender)
          })
        } else {
          cBuilder.connectOverWebChannel(wc, msg.sender)
          .then((channel) => {
            this.onChannel(wc, channel, msg.which_connector_asked, msg.sender)
          })
        }
        break
    }
  }
}

export default ChannelBuilderService
