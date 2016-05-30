/**
 * Service module includes {@link module:channelBuilder},
 * {@link module:webChannelManager} and {@link module:channelProxy} modules.
 * Services are substitutable stateless objects. Each service is identified by
 * its class name and can receive messages via `WebChannel` sent by another
 * service.
 *
 * @module service
 * @see module:channelBuilder
 * @see module:webChannelManager
 * @see module:channelProxy
 */

/**
 * Each service must implement this interface.
 *
 * @interface
 */
class ServiceInterface {

  /**
   * Service name which corresponds to its class name.
   *
   * @return {string} - name
   */
  get name () {
    return this.constructor.name
  }
}

export {
  /** @see module:service~Interface */
  ServiceInterface
}
