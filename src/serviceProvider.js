import FullyConnectedService from 'service/manager/FullyConnectedService'
import WebRTCService from 'service/WebRTCService'
import WebSocketService from 'service/WebSocketService'
import ChannelBuilderService from 'service/ChannelBuilderService'
import MessageBuilderService from 'service/MessageBuilderService'
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
const WEBRTC = 0

/**
 * Constant used to get an instance of {@link WebSocketService}.
 * @type {string}
 */
const WEBSOCKET = 1

const CHANNEL_BUILDER = 2

/**
 * Constant used to get an instance of {@link FullyConnectedService}.
 * @type {string}
 */
const FULLY_CONNECTED = 3

/**
 * Constant used to get an instance of {@link MessageBuilderService}. It is a
 * singleton service.
 * @type {string}
 */
const MESSAGE_BUILDER = 4

/**
 * Contains services who are singletons.
 * @type {string}
 */
const services = new Map()

/**
 * Provides the service instance specified by `id`.
 *
 * @param  {(module:serviceProvider.MESSAGE_BUILDER|
 *          module:serviceProvider.WEBRTC|
            module:serviceProvider.WEBSOCKET|
 *          module:serviceProvider.FULLY_CONNECTED)} id - The service id.
 * @param  {Object} [options] - Any options that the service accepts.
 * @return {module:service~ServiceInterface} - Service instance.
 * @throws An error if the service id is unknown
 */
let provide = function (id, options = {}) {
  if (services.has(id)) {
    return services.get(id)
  }
  let service
  switch (id) {
    case WEBRTC:
      return new WebRTCService(WEBRTC, options)
    case WEBSOCKET:
      return new WebSocketService(WEBSOCKET)
    case CHANNEL_BUILDER:
      return new ChannelBuilderService(CHANNEL_BUILDER)
    case FULLY_CONNECTED:
      service = new FullyConnectedService(FULLY_CONNECTED)
      services.set(id, service)
      return service
    case MESSAGE_BUILDER:
      service = new MessageBuilderService(MESSAGE_BUILDER)
      services.set(id, service)
      return service
    default:
      throw new Error(`Unknown service id: "${id}"`)
  }
}

export {WEBRTC, WEBSOCKET, CHANNEL_BUILDER, FULLY_CONNECTED, MESSAGE_BUILDER, provide}
