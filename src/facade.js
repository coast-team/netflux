import { Peer } from './peer'
import { Network } from './network'

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
    console.log('Hello world! This is create method of Netflux class')
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
