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
 * Default timeout for any pending request.
 * @type {number}
 */
const DEFAULT_REQUEST_TIMEOUT = 5000

/**
 * Pending request map. Pending request is when a service uses a Promise
 * which will be fulfilled or rejected somewhere else in code. For exemple when
 * a peer is waiting for a feedback from another peer before Promise has completed.
 * @type {external:Map}
 */
const pendingRequests = new Map()

/**
 * Each service must implement this interface.
 * @interface
 */
class ServiceInterface {

  /**
   * Timeout event handler
   * @callback ServiceInterface~onTimeout
   */

  constructor () {
    if (!pendingRequests.has(this.name)) {
      pendingRequests.set(this.name, new Map())
    }
  }

  /**
   * Service name which corresponds to its class name.
   * @return {string} - Name
   */
  get name () {
    return this.constructor.name
  }

  /**
   * Add new pending request.
   * @param {WebChannel} wc - Web channel to which this request corresponds
   * @param {number} id - Identifer to which this request corresponds
   * @param {Object} data - Data to be available when getPendingRequest is called
   * @param {number} [timeout=DEFAULT_REQUEST_TIMEOUT] - Timeout in milliseconds
   * @param {ServiceInterface~onTimeout} [onTimeout=() => {}] - Timeout event handler
   */
  addPendingRequest (wc, id, data, timeout = DEFAULT_REQUEST_TIMEOUT, onTimeout = () => {}) {
    let requests = pendingRequests.get(this.name)
    let idMap
    if (requests.has(wc)) {
      idMap = requests.get(wc)
    } else {
      idMap = new Map()
      requests.set(wc, idMap)
    }
    idMap.set(id, data)
    setTimeout(onTimeout, timeout)
  }

  /**
   * Get pending request corresponding to the specific WebChannel and identifier.
   * @param  {WebChannel} wc - Web channel
   * @param  {number} id - Identifier
   * @return {Object} - Javascript object corresponding to the one provided in
   * addPendingRequest function
   */
  getPendingRequest (wc, id) {
    return pendingRequests.get(this.name).get(wc).get(id)
  }
}

export default ServiceInterface
