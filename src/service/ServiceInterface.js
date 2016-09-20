/**
 * Service module includes {@link module:channelBuilder},
 * {@link module:webChannelManager} and {@link module:messageBuilder}.
 * Services are substitutable stateless objects. Each service is identified by
 * the id provided during construction and some of them can receive messages via `WebChannel` sent
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
const DEFAULT_REQUEST_TIMEOUT = 60000

/**
 * Pending request map. Pending request is when a service uses a Promise
 * which will be fulfilled or rejected somewhere else in code. For exemple when
 * a peer is waiting for a feedback from another peer before Promise has completed.
 * @type {external:Map}
 */
const itemsStorage = new Map()
const requestsStorage = new Map()

/**
 * Each service must implement this interface.
 * @interface
 */
class ServiceInterface {

  /**
   * Timeout event handler
   * @callback ServiceInterface~onTimeout
   */

  constructor (id) {
    this.id = id
    if (!itemsStorage.has(this.id)) itemsStorage.set(this.id, new WeakMap())
    if (!requestsStorage.has(this.id)) requestsStorage.set(this.id, new WeakMap())
  }

  /**
   * Add new pending request.
   * @param {WebChannel} wc - Web channel to which this request corresponds
   * @param {number} id - Identifer to which this request corresponds
   * @param {Object} data - Data to be available when getPendingRequest is called
   * @param {number} [timeout=DEFAULT_REQUEST_TIMEOUT] - Timeout in milliseconds
   * @param {ServiceInterface~onTimeout} [onTimeout=() => {}] - Timeout event handler
   */
  setPendingRequest (wc, id, data, timeout = DEFAULT_REQUEST_TIMEOUT) {
    this.setTo(requestsStorage, wc, id, data)
    setTimeout(() => { data.reject('Pending request timeout') }, timeout)
  }

  /**
   * Get pending request corresponding to the specific WebChannel and identifier.
   * @param  {WebChannel} wc - Web channel
   * @param  {number} id - Identifier
   * @return {Object} - Javascript object corresponding to the one provided in
   * setPendingRequest function
   */
  getPendingRequest (wc, id) {
    return this.getFrom(requestsStorage, wc, id)
  }

  setItem (wc, id, data) {
    this.setTo(itemsStorage, wc, id, data)
  }

  getItem (wc, id) {
    return this.getFrom(itemsStorage, wc, id)
  }

  getItems (wc) {
    let items = itemsStorage.get(this.id).get(wc)
    if (items) return items
    else return new Map()
  }

  removeItem (wc, id) {
    let currentServiceTemp = itemsStorage.get(this.id)
    let idMap = currentServiceTemp.get(wc)
    currentServiceTemp.get(wc).delete(id)
    if (idMap.size === 0) currentServiceTemp.delete(wc)
  }

  setTo (storage, wc, id, data) {
    let currentServiceTemp = storage.get(this.id)
    let idMap
    if (currentServiceTemp.has(wc)) {
      idMap = currentServiceTemp.get(wc)
    } else {
      idMap = new Map()
      currentServiceTemp.set(wc, idMap)
    }
    if (!idMap.has(id)) idMap.set(id, data)
  }

  getFrom (storage, wc, id) {
    let idMap = storage.get(this.id).get(wc)
    if (idMap !== undefined) {
      let item = idMap.get(id)
      if (item !== undefined) return item
    }
    return null
  }
}

export default ServiceInterface
