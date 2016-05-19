import FullyConnectedService from './service/webChannelManager/FullyConnectedService'
import WebRTCService from './service/channelBuilder/WebRTCService'
import MessageBuilderService from './service/MessageBuilderService'
/**
 * Service Provider module is a helper module for {@link module:service}. It is
 * responsible to instantiate all services. This module must be used to get
 * any service instance.
 * @module serviceProvider
 */

/**
 * Constant used to get an instance of {@link WebRTCService}.
 * @type {string}
 */
export const WEBRTC = 'WebRTCService'

/**
 * Constant used to get an instance of {@link FullyConnectedService}.
 * @type {string}
 */
export const FULLY_CONNECTED = 'FullyConnectedService'

export const MESSAGE_FORMATTER = 'MessageBuilderService'

const services = new Map()

/**
 * Provides the service instance specified by `name`.
 *
 * @param  {(module:serviceProvider.CHANNEL_PROXY|
 *          module:serviceProvider.WEBRTC|
 *          module:serviceProvider.FULLY_CONNECTED)} name - The service name.
 * @param  {Object} [options] - Any options that the service accepts.
 * @return {module:service~Interface} - Service instance.
 */
export default function provide (name, options = {}) {
  if (services.has(name)) {
    return services.get(name)
  }
  let service
  switch (name) {
    case WEBRTC:
      return new WebRTCService(options)
    case FULLY_CONNECTED:
      service = new FullyConnectedService()
      services.set(name, service)
      return service
    case MESSAGE_FORMATTER:
      service = new MessageBuilderService()
      services.set(name, service)
      return service
    default:
      return null
  }
}
