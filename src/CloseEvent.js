const message = new WeakMap()

class CloseEvent {
  constructor (msg) {
    message.set(this, msg)
  }

  get message () {
    return message.get(this)
  }
}

export default CloseEvent
