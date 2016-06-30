/**
 * Service module includes {@link module:channelBuilder},
 * {@link module:webChannelManager} and {@link module:messageBuilder}.
 * Services are substitutable stateless objects. Each service is identified by
 * its class name and some of them can receive messages via `WebChannel` sent
 * by another service.
 *
 * @module service
 * @see module:channelBuilder
 * @see module:webChannelManager
 * @see module:messageBuilder
 */

/**
 * Each service must implement this interface.
 * @interface
 */
class ServiceInterface {

  /**
   * Service name which corresponds to its class name.
   * @return {string} - Name
   */
  get name () {
    return this.constructor.name
  }
}

export {
  /** @see module:service~ServiceInterface */
  ServiceInterface
}
