/**
 * @external {WebSocket} https://developer.mozilla.org/en/docs/Web/API/WebSocket
 */

/**
 * @external {Promise.resolve} https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
 */

/**
 * @external {Promise.reject} https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
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
 * @type {Map}
 */
const itemsStorage = new Map()
const requestsStorage = new Map()

/**
 * Each service must implement this interface.
 */
class ServiceInterface {
  constructor (id) {
    this.id = id
    if (!itemsStorage.has(this.id)) itemsStorage.set(this.id, new WeakMap())
    if (!requestsStorage.has(this.id)) requestsStorage.set(this.id, new WeakMap())
  }

  /**
   * Add a new pending request identified by `obj` and `id`.
   * @param {Object} obj
   * @param {number} id
   * @param {{resolve: Promise.resolve, reject:Promise.reject}} data
   * @param {number} [timeout=DEFAULT_REQUEST_TIMEOUT] Timeout in milliseconds
   */
  setPendingRequest (obj, id, data, timeout = DEFAULT_REQUEST_TIMEOUT) {
    this.setTo(requestsStorage, obj, id, data)
    setTimeout(() => { data.reject('Pending request timeout') }, timeout)
  }

  /**
   * Get pending request identified by `obj` and `id`.
   *
   * @param  {Object} obj
   * @param  {number} id
   * @returns {{resolve: Promise.resolve, reject:Promise.reject}}
   */
  getPendingRequest (obj, id) {
    return this.getFrom(requestsStorage, obj, id)
  }

  /**
   * @param {Object} obj
   * @param {number} id
   * @param {Object} data
   */
  setItem (obj, id, data) {
    this.setTo(itemsStorage, obj, id, data)
  }

  /**
   * Get item identified by `obj` and `id`.
   *
   * @param {Object} obj
   * @param {number} id
   *
   * @returns {Object}
   */
  getItem (obj, id) {
    return this.getFrom(itemsStorage, obj, id)
  }

  /**
   * @param {Object} obj
   *
   * @returns {Map}
   */
  getItems (obj) {
    let items = itemsStorage.get(this.id).get(obj)
    if (items) return items
    else return new Map()
  }

  /**
   * @param {Object} obj
   * @param {number} id
   */
  removeItem (obj, id) {
    let currentServiceTemp = itemsStorage.get(this.id)
    let idMap = currentServiceTemp.get(obj)
    currentServiceTemp.get(obj).delete(id)
    if (idMap.size === 0) currentServiceTemp.delete(obj)
  }

  /**
   * @private
   * @param {Map} storage
   * @param {Object} obj
   * @param {number} id
   *
   * @returns {Object}
   */
  getFrom (storage, obj, id) {
    let idMap = storage.get(this.id).get(obj)
    if (idMap !== undefined) {
      let item = idMap.get(id)
      if (item !== undefined) return item
    }
    return null
  }

  /**
   * @private
   * @param {Map} storage
   * @param {WebChannel} obj
   * @param {number} id
   * @param {Object} data
   *
   */
  setTo (storage, obj, id, data) {
    let currentServiceTemp = storage.get(this.id)
    let idMap
    if (currentServiceTemp.has(obj)) {
      idMap = currentServiceTemp.get(obj)
    } else {
      idMap = new Map()
      currentServiceTemp.set(obj, idMap)
    }
    if (!idMap.has(id)) idMap.set(id, data)
  }
}

export default ServiceInterface
