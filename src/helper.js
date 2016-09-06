const message = new WeakMap()

export class NodeCloseEvent {
  constructor (msg) {
    message.set(this, msg)
  }

  get message () {
    return message.get(this)
  }
}

export function isBrowser () {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
    return false
  }
  return true
}
