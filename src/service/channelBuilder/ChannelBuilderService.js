import {ServiceInterface} from '../service'
import {WEBRTC, WEBSOCKET, provide} from '../../serviceProvider'

const WHICH_CONNECTOR = 1
const CONNECTOR = 2

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
      wc.connectMeToRequests.set(id, (isDone, channel) => {
        if (isDone) {
          resolve(channel)
        } else {
          reject(channel)
        }
      })
      if (typeof window !== 'undefined') wc.sendSrvMsg(this.name, id, {code: WHICH_CONNECTOR, sender: wc.myId})
      else {
        wc.sendSrvMsg(this.name, id, {code: CONNECTOR, connectors: [WEBSOCKET], sender: wc.myId,
          host: wc.settings.host, port: wc.settings.port, which_connector_asked: false})
      }
    })
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
          host: msg.host, port: msg.port, which_connector_asked: msg.which_connector_asked})
        let cBuilder = provide(connector, settings)
        cBuilder.connectMeTo(wc, msg.sender)
          .then((channel) => {
            if (!msg.which_connector_asked) wc.initChannel(channel, false, msg.sender)
            else wc.connectMeToRequests.get(msg.sender)(true, channel)
          })
        break
    }
  }
}

export default ChannelBuilderService
