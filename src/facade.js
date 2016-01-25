class Facade {
  constructor (options = {}) {
    this.onPeerJoining = this._onPeerJoining
    this.onPeerLeaving = this._onPeerLeaving
    this.onBroadcastMessage = this._onBroadcastMessage
    this.onPeerMessage = this._onPeerMessage
    this.onJoinRequest = this._onJoinRequest

    // let settings = Object.assign({}, defaults, options)
  }

  create () {
  }

  join () {

  }

  sendJoinRequest () {

  }

  _onPeerJoining () {

  }

  _onPeerLeaving () {

  }

  _onBroadcastMessage () {

  }

  _onPeerMessage () {

  }

  _onJoinRequest () {

  }
}

export { Facade }
