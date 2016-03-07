class ChannelInterface {
  constructor () {
    this.webChannel
    this.peerId
  }

  onmessage () {
    throw new Error('Must be implemented by subclass!')
  }

  onclose () {
    throw new Error('Must be implemented by subclass!')
  }

  onerror () {
    throw new Error('Must be implemented by subclass!')
  }

  send () {
    throw new Error('Must be implemented by subclass!')
  }

  close () {
    throw new Error('Must be implemented by subclass!')
  }
}

export default ChannelInterface
