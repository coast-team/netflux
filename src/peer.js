class Peer {
  constructor (id, connector) {
    this.id = id
    this.isNeighbour = true
  }

  send () {}

  onMessage () {}

  disconnect () {}
}

export { Peer }
