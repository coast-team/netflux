/**
 * Default timeout for any pending request.
 * @type {number}
 */
const DEFAULT_REQUEST_TIMEOUT = 60000

/**
 * Item storage which is separate for each service. The `Map` key is the service `id`.
 */
const itemsStorage = new Map()

/**
 * Abstract class which each service should inherit. Each service is independent
 * and can store data temporarly in order to accomplish its task(s).
 */
export class Service {
  /**
   * It should be invoked only by calling `super` from the children constructor.
   *
   * @param {number} id The service unique identifier
   */
  constructor (id) {
    /**
     * The service unique identifier.
     * @type {number}
     */
    this.id = id
    if (!itemsStorage.has(this.id)) itemsStorage.set(this.id, new WeakMap())
  }

  init (wc) {
    if (!wc._servicesData) {
      wc._servicesData = {}
    }
    if (!wc._servicesData[this.id]) {
      wc._servicesData[this.id] = {
        /**
         * Pending request map. Pending request is when a service uses a Promise
         * which will be fulfilled or rejected somewhere else in code. For exemple when
         * a peer is waiting for a feedback from another peer before Promise has completed.
         * @type {Map}
         */
        pendingRequests: new Map()
      }
    }
  }

  /**
   * Add a new pending request identified by `obj` and `id`.
   * @param {Object} obj
   * @param {number} id
   * @param {{resolve: Promise.resolve, reject:Promise.reject}} data
   * @param {number} [timeout=DEFAULT_REQUEST_TIMEOUT] Timeout in milliseconds
   */
  setPendingRequest (obj, id, data, timeout = DEFAULT_REQUEST_TIMEOUT) {
    obj._servicesData[this.id].pendingRequests.set(id, data)
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
    return obj._servicesData[this.id].pendingRequests.get(id)
  }

  /**
   * Add item with `obj` and `ìd` as identifier.
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
   * Get all items belonging to `obj`.
   *
   * @param {Object} obj
   * @returns {Map}
   */
  getItems (obj) {
    const items = itemsStorage.get(this.id).get(obj)
    if (items) return items
    else return new Map()
  }

  /**
   * Remove item identified by `obj` and `id`.
   *
   * @param {Object} obj
   * @param {number} id
   */
  removeItem (obj, id) {
    const currentServiceTemp = itemsStorage.get(this.id)
    const idMap = currentServiceTemp.get(obj)
    if (idMap !== undefined) {
      idMap.delete(id)
      if (idMap.size === 0) currentServiceTemp.delete(obj)
    }
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
    const idMap = storage.get(this.id).get(obj)
    if (idMap !== undefined) {
      const item = idMap.get(id)
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
    const currentServiceTemp = storage.get(this.id)
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
