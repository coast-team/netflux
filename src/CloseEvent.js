const message = new WeakMap()

class NodeCloseEvent {
  constructor (msg) {
    message.set(this, msg)
  }

  get message () {
    return message.get(this)
  }
}

export default NodeCloseEvent
