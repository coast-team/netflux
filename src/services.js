import FullyConnectedService from './services/wcManagers/FullyConnectedService'
import WebRTCService from './services/cBuilders/WebRTCService'
import ChannelProxyService from './services/ChannelProxyService'

// Service names
export const CHANNEL_PROXY = 'ChannelProxyService'
export const WEBRTC = 'WebRTCService'
export const FULLY_CONNECTED = 'FullyConnectedService'

let services = new Map()

export function get (code, options = {}) {
  if (services.has(code)) {
    return services.get(code)
  }
  let service
  switch (code) {
    case WEBRTC:
      return new WebRTCService(options)
    case FULLY_CONNECTED:
      service = new FullyConnectedService()
      services.set(code, service)
      return service
    case CHANNEL_PROXY:
      service = new ChannelProxyService()
      services.set(code, service)
      return service
  }
}
