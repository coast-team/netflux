import ServiceInterface from 'service/ServiceInterface'
import {webRTCAvailable} from 'service/WebRTCService'
import {WEBRTC, WEBSOCKET, provide} from 'serviceProvider'

class ChannelBuilderService extends ServiceInterface {
  constructor (id) {
    super(id)
    this.WS = [WEBSOCKET]
    this.WR = [WEBRTC]
    this.WS_WR = [WEBSOCKET, WEBRTC]
    this.WR_WS = [WEBRTC, WEBSOCKET]
  }

  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      super.setPendingRequest(wc, id, {resolve, reject})
      wc.sendInnerTo(id, this.id, this.availableConnectors(wc))
    })
  }

  availableConnectors (wc) {
    let res = {}
    let connectors = []
    if (webRTCAvailable) connectors[connectors.length] = WEBRTC
    if (wc.settings.listenOn !== '') {
      connectors[connectors.length] = WEBSOCKET
      res.listenOn = wc.settings.listenOn
    }
    if (connectors.length === 2 && connectors[0] !== wc.settings.connector) {
      connectors.reverse()
    }
    res.connectors = connectors
    return res
  }

  onChannel (wc, channel, senderId) {
    wc.initChannel(channel, senderId)
      .then(channel => {
        let pendReq = super.getPendingRequest(wc, senderId)
        if (pendReq !== null) pendReq.resolve(channel)
      })
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    let myConnectObj = this.availableConnectors(wc)
    let myConnectors = myConnectObj.connectors

    if ('failedReason' in msg) {
      super.getPendingRequest(wc, senderId).reject(msg.failedReason)
    } else if ('shouldConnect' in msg) {
      if (this.isEqual(msg.shouldConnect, this.WS)) {
        provide(WEBSOCKET).connect(msg.listenOn)
          .then(channel => {
            channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
            this.onChannel(wc, channel, senderId)
          })
          .catch(reason => {
            super.getPendingRequest(wc, senderId).reject(`Failed to establish a socket: ${reason}`)
          })
      } else if (this.isEqual(msg.shouldConnect, this.WS_WR)) {
        provide(WEBSOCKET).connect(msg.listenOn)
          .then(channel => {
            channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
            this.onChannel(wc, channel, senderId)
          })
          .catch(reason => provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId))
          .then(channel => this.onChannel(wc, channel, senderId))
          .catch(reason => {
            if ('feedbackOnFail' in msg && msg.feedbackOnFail === true) {
              wc.sendInnerTo(senderId, this.id, {tryOn: this.WS, listenOn: myConnectObj.listenOn})
            } else {
              super.getPendingRequest(wc, senderId).reject(`Failed to establish a socket and then a data channel: ${reason}`)
            }
          })
      }
    } else if ('tryOn' in msg && this.isEqual(msg.tryOn, this.WS)) {
      provide(WEBSOCKET).connect(msg.listenOn)
        .then(channel => {
          channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
          this.onChannel(wc, channel, senderId)
        })
        .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a socket: ${reason}`}))
    } else if ('connectors' in msg) {
      if (!this.isValid(msg.connectors)) {
        wc.sendInnerTo(senderId, this.id, {failedReason: `Unknown connectors: ${msg.connectors}`})
      } else {
        // []
        if (msg.connectors.length === 0) {
          if (myConnectors.length === 0 || this.isEqual(myConnectors, this.WS)) {
            wc.sendInnerTo(senderId, this.id, {failedReason: 'No common connectors'})
          } else {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn})
          }
        }

        // [ws]
        if (this.isEqual(msg.connectors, this.WS)) {
          if (myConnectors.length === 0 || this.isEqual(myConnectors, this.WS)) {
            this.ws(wc, senderId, msg.listenOn)
          } else {
            this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn)
          }
        }

        // [wr]
        if (this.isEqual(msg.connectors, this.WR)) {
          if (myConnectors.length === 0) {
            wc.sendInnerTo(senderId, this.id, {failedReason: 'No common connectors'})
          } else if (this.isEqual(myConnectors, this.WS)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn})
          } else if (this.isEqual(myConnectors, this.WR)) {
            provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                wc.sendInnerTo(senderId, this.id, {failedReason: `Failed establish a data channel: ${reason}`})
              })
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn})
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn})
              })
          }
        }

        // [ws, wr]
        if (this.isEqual(msg.connectors, this.WS_WR)) {
          if (myConnectors.length === 0) {
            this.ws(wc, senderId, msg.listenOn)
          } else if (this.isEqual(myConnectors, this.WS)) {
            this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn)
          } else if (this.isEqual(myConnectors, this.WR)) {
            provide(WEBSOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId))
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a socket and then a data channel: ${reason}`}))
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            provide(WEBSOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn})
          } else {
            provide(WEBSOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => provide(WEBRTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId))
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn}))
          }
        }

        // [wr, ws]
        if (this.isEqual(msg.connectors, this.WR_WS)) {
          if (myConnectors.length === 0) {
            this.ws(wc, senderId, msg.listenOn)
          } else if (this.isEqual(myConnectors, this.WS)) {
            this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn)
          } else if (this.isEqual(myConnectors, this.WR)) {
            provide(WEBRTC, wc.settings.iceServers)
              .connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => provide(WEBSOCKET).connect(msg.listenOn))
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a data channel and then a socket: ${reason}`}))
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, feedbackOnFail: true, listenOn: myConnectObj.listenOn})
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            provide(WEBRTC, wc.settings.iceServers)
              .connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => provide(WEBSOCKET).connect(msg.listenOn))
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn}))
          }
        }
      }
    }
  }

  wsWs (wc, senderId, peerWsURL, myWsURL) {
    provide(WEBSOCKET).connect(peerWsURL)
      .then(channel => {
        channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
        this.onChannel(wc, channel, senderId)
      })
      .catch(reason => {
        wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myWsURL})
      })
  }

  ws (wc, senderId, peerWsURL) {
    provide(WEBSOCKET).connect(peerWsURL)
      .then(channel => {
        channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
        this.onChannel(wc, channel, senderId)
      })
      .catch(reason => {
        wc.sendInnerTo(senderId, this.id, {
          failedReason: `Failed to establish a socket: ${reason}`
        })
      })
  }

  isValid (connectors) {
    if (this.isEqual(connectors, this.WS) ||
      this.isEqual(connectors, this.WR) ||
      this.isEqual(connectors, this.WS_WR) ||
      this.isEqual(connectors, this.WR_WS)
    ) return true
    return false
  }

  isEqual (arr1, arr2) {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }
    return true
  }

}

export default ChannelBuilderService
