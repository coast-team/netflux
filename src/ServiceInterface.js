
/**
 * Interface for every service.
 * @interface
 */
class ServiceInterface {
  get name () {
    return this.constructor.name
  }

  onMessage (webChannel, msg) {
    throw new Error('Must be implemented by subclass!')
  }
}

export default ServiceInterface
