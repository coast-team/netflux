import * as cs from './constants'
import FullyConnectedService from './services/topologies/FullyConnectedService'
import WebRTCService from './services/connectors/WebRTCService'
import ExchangeProtocolService from './services/ExchangeProtocolService'

let services = new Map()

export default class ServiceProvider {
  static get (code, options = {}) {
    let service
    switch (code) {
      case cs.WEBRTC_SERVICE:
        service = new WebRTCService(options)
        break
      case cs.FULLYCONNECTED_SERVICE:
        service = new FullyConnectedService(options)
        break
      case cs.EXCHANGEPROTOCOL_SERVICE:
        service = new ExchangeProtocolService(options)
        break
    }
    services.set(code, service)
    return service
  }
}
