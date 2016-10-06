import FullyConnectedService from 'service/topology/FullyConnectedService'
import WebRTCService from 'service/WebRTCService'
import WebSocketService from 'service/WebSocketService'
import ChannelBuilderService from 'service/ChannelBuilderService'
import MessageBuilderService from 'service/MessageBuilderService'

/**
 * {@link WebRTCService} identifier.
 * @ignore
 * @type {number}
 */
const WEB_RTC = 0

/**
* {@link WebSocketService} identifier.
* @ignore
* @type {number}
*/
const WEB_SOCKET = 1

/**
 * {@link ChannelBuilderService} identifier.
 * @ignore
 * @type {number}
 */
const CHANNEL_BUILDER = 2

/**
 * {@link FullyConnectedService} identifier.
 * @ignore
 * @type {number}
 */
const FULLY_CONNECTED = 3

/**
 * {@link MessageBuilderService} identifier
 * @ignore
 * @type {number}
 */
const MESSAGE_BUILDER = 4

/**
 * Contains singletons services.
 * @type {Map}
 */
const services = new Map()

/**
 * It is a factory helper class which is responsible to instantiate any service class.
 */
class ServiceFactory {
  /**
   * Provides the service instance specified by `id`.
   *
   * @throws {Error} If the service `id` is unknown
   * @param  {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id The service identifier
   * @param  {Object} [options] Any options that the service accepts
   * @returns {Service}
   */
  static get (id, options = {}) {
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
}

export default ServiceFactory
export {WEB_RTC, WEB_SOCKET, CHANNEL_BUILDER, FULLY_CONNECTED, MESSAGE_BUILDER}
