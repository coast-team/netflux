import WebChannel from './WebChannel'
import ServiceProvider from './ServiceProvider'

export default class Facade {
  constructor (options = {}) {
    this.defaults = {
      webrtc: {}
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  create (options = {}) {
    return new WebChannel()
  }

  join (key, options = {}) {
    let defaults = {
      connector: 'WebRTCService'
    }
    let settings = Object.assign({}, defaults, options)
    let connector = ServiceProvider.get(settings.connector)
    let protocol = ServiceProvider.get('ExchangeProtocolService')
    return new Promise((resolve, reject) => {
      connector
        .join(key)
        .then((channel) => {
          let webChannel = new WebChannel({connector: settings.connector})
          channel.webChannel = webChannel
          channel.onmessage = protocol.onmessage
          webChannel.channels.add(channel)
          webChannel.onopen = () => { resolve(webChannel) }
        })
    })
  }

  invite () {
    // TODO
  }

  _onJoining () {
    // TODO
  }

  _onLeaving () {
    // TODO
  }

  _onMessage () {
    // TODO
  }

  _onPeerMessage () {
    // TODO
  }

  _onInvite () {
    // TODO
  }
}
