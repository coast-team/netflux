import { FullyConnectedService } from 'service/topology/FullyConnectedService'
import { WebRTCService } from 'service/WebRTCService'
import { WebSocketService } from 'service/WebSocketService'
// import { EventSourceService } from 'service/EventSourceService'
import { ChannelBuilderService } from 'service/ChannelBuilderService'
import { MessageService } from 'service/MessageService'

/**
 * {@link WebRTCService} identifier.
 * @type {number}
 */
export const WEB_RTC = 0

/**
* {@link WebSocketService} identifier.
* @type {number}
*/
export const WEB_SOCKET = 1

/**
* {@link WebSocketService} identifier.
* @type {number}
*/
export const EVENT_SOURCE = 5

/**
 * {@link ChannelBuilderService} identifier.
 * @ignore
 * @type {number}
 */
export const CHANNEL_BUILDER = 2

/**
 * {@link FullyConnectedService} identifier.
 * @ignore
 * @type {number}
 */
export const FULLY_CONNECTED = 3

/**
 * {@link MessageService} identifier
 * @ignore
 * @type {number}
 */
export const MESSAGE = 4

/**
 * Contains singletons services.
 * @type {Map}
 */
const services = new Map()

/**
 * It is a factory helper class which is responsible to instantiate any service class.
 */
export class ServiceFactory {
  /**
   * Provides the service instance specified by `id`.
   *
   * @throws {Error} If the service `id` is unknown
   * @param  {MESSAGE|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id The service identifier
   * @returns {Service}
   */
  static get (id) {
    if (services.has(id)) {
      return services.get(id)
    }
    let service
    switch (id) {
      case WEB_RTC:
        service = new WebRTCService(WEB_RTC)
        services.set(id, service)
        return service
      case WEB_SOCKET:
        service = new WebSocketService(WEB_SOCKET)
        services.set(id, service)
        return service
      // case EVENT_SOURCE:
      //   service = new EventSourceService(EVENT_SOURCE)
      //   services.set(id, service)
      //   return service
      case CHANNEL_BUILDER:
        service = new ChannelBuilderService(CHANNEL_BUILDER)
        services.set(id, service)
        return service
      case FULLY_CONNECTED:
        service = new FullyConnectedService(FULLY_CONNECTED)
        services.set(id, service)
        return service
      case MESSAGE:
        service = new MessageService(MESSAGE)
        services.set(id, service)
        return service
      default:
        throw new Error(`${id} is an Unknown service id`)
    }
  }
}
