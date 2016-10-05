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
 * {@link WebRTCService} identifier.
 * @type {number}
 */
const WEB_RTC = 0

/**
 * {@link WebSocketService} identifier.
 * @type {number}
 */
const WEB_SOCKET = 1

/**
 * {@link ChannelBuilderService} identifier.
 * @type {number}
 */
const CHANNEL_BUILDER = 2

/**
 * {@link FullyConnectedService} identifier.
 * @type {number}
 */
const FULLY_CONNECTED = 3

/**
 * {@link MessageBuilderService} identifier
 * @type {number}
 */
const MESSAGE_BUILDER = 4

/**
 * Contains singletons services.
 * @type {Map}
 */
const services = new Map()

/**
 * Provides the service instance specified by `id`.
 *
 * @throws {Error} If the service `id` is unknown
 * @param  {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id The service identifier
 * @param  {Object} [options] Any options that the service accepts
 * @returns {Service}
 */
let provide = function (id, options = {}) {
  if (services.has(id)) {
    return services.get(id)
  }
  let service
  switch (id) {
    case WEB_RTC:
      return new WebRTCService(WEB_RTC, options)
    case WEB_SOCKET:
      return new WebSocketService(WEB_SOCKET)
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
      throw new Error(`${id} is an Unknown service id`)
  }
}

export {WEB_RTC, WEB_SOCKET, CHANNEL_BUILDER, FULLY_CONNECTED, MESSAGE_BUILDER, provide}
