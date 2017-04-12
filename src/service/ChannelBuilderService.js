import Util from 'Util'
import Service from 'service/Service'
import ServiceFactory, {WEB_RTC, WEB_SOCKET} from 'ServiceFactory'
import { serviceMessageStream } from 'WebChannel'

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketService` and `WebRTCService`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
class ChannelBuilderService extends Service {
  /**
   * @param {number} id Service identifier
   */
  constructor (id) {
    super(id)

    /**
     * @private
     */
    this.WS = [WEB_SOCKET]
    /**
     * @private
     */
    this.WR = [WEB_RTC]
    /**
     * @private
     */
    this.WS_WR = [WEB_SOCKET, WEB_RTC]
    /**
     * @private
     */
    this.WR_WS = [WEB_RTC, WEB_SOCKET]
  }

  init (wc, rtcConfiguration) {
    super.init(wc)
    ServiceFactory.get(WEB_RTC)
        .onChannelFromWebChannel(wc, rtcConfiguration)
        .subscribe(dc => this.onChannel(wc, dc, Number(dc.label)))

    wc[serviceMessageStream]
      .filter(msg => msg.serviceId === this.id)
      .subscribe(
        msg => this.onMessage(msg.channel, msg.senderId, msg.recepientId, msg.content)
      )
  }

  /**
   * Establish a channel with the peer identified by `id`.
   *
   * @param {WebChannel} wc
   * @param {number} id
   *
   * @returns {Promise<Channel, string>}
   */
  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      super.setPendingRequest(wc, id, {resolve, reject})
      wc.sendInnerTo(id, this.id, this.availableConnectors(wc))
    })
  }

  /**
   * @param {WebChannel} wc
   *
   * @returns {{listenOn: string, connectors: number[]}}
   */
  availableConnectors (wc) {
    const res = {}
    const connectors = []
    if (Util.require(Util.WEB_RTC) !== undefined) {
      connectors[connectors.length] = WEB_RTC
    }
    if (wc.settings.listenOn !== '') {
      connectors[connectors.length] = WEB_SOCKET
      res.listenOn = wc.settings.listenOn
    }
    if (connectors.length === 2 && connectors[0] !== wc.settings.connector) {
      connectors.reverse()
    }
    res.connectors = connectors
    return res
  }

  /**
   * @param {WebChannel} wc
   * @param {WebSocket|RTCDataChannel} channel
   * @param {number} senderId
   */
  onChannel (wc, channel, senderId) {
    wc.initChannel(channel, senderId)
      .then(channel => {
        const pendReq = super.getPendingRequest(wc, senderId)
        if (pendReq) pendReq.resolve(channel)
      })
  }

  /**
   * @param {Channel} channel
   * @param {number} senderId
   * @param {number} recepientId
   * @param {Object} msg
   */
  onMessage (channel, senderId, recepientId, msg) {
    const wc = channel.webChannel
    const myConnectObj = this.availableConnectors(wc)
    const myConnectors = myConnectObj.connectors
    if ('failedReason' in msg) {
      super.getPendingRequest(wc, senderId).reject(new Error(msg.failedReason))
    } else if ('shouldConnect' in msg) {
      if (this.isEqual(msg.shouldConnect, this.WS)) {
        ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
          .then(channel => {
            channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
            this.onChannel(wc, channel, senderId)
          })
          .catch(reason => {
            super.getPendingRequest(wc, senderId)
              .reject(new Error(`Failed to establish a socket: ${reason}`))
          })
      } else if (this.isEqual(msg.shouldConnect, this.WS_WR)) {
        ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
          .then(channel => {
            channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
            this.onChannel(wc, channel, senderId)
          })
          .catch(reason => {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                if ('feedbackOnFail' in msg && msg.feedbackOnFail === true) {
                  wc.sendInnerTo(senderId, this.id, {tryOn: this.WS, listenOn: myConnectObj.listenOn})
                } else {
                  super.getPendingRequest(wc, senderId)
                    .reject(new Error(`Failed to establish a socket and then a data channel: ${reason}`))
                }
              })
          })
      }
    } else if ('tryOn' in msg && this.isEqual(msg.tryOn, this.WS)) {
      ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
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
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId, {iceServers: wc.iceServers})
              .then(channel => {
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => {
                wc.sendInnerTo(senderId, this.id, {failedReason: `Failed establish a data channel: ${reason}`})
              })
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn})
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId, {iceServers: wc.iceServers})
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
            ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId, {iceServers: wc.iceServers}))
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a socket and then a data channel: ${reason}`}))
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn})
          } else {
            ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                this.onChannel(wc, channel, senderId)
              })
              .catch(reason => {
                ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
                  .then(channel => this.onChannel(wc, channel, senderId))
                  .catch(reason => wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn}))
              })
          }
        }

        // [wr, ws]
        if (this.isEqual(msg.connectors, this.WR_WS)) {
          if (myConnectors.length === 0) {
            this.ws(wc, senderId, msg.listenOn)
          } else if (this.isEqual(myConnectors, this.WS)) {
            this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn)
          } else if (this.isEqual(myConnectors, this.WR)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers)
              .connectOverWebChannel(wc, senderId, {iceServers: wc.iceServers})
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
                  .then(channel => {
                    channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                    this.onChannel(wc, channel, senderId)
                  })
                  .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a data channel and then a socket: ${reason}`}))
              })
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, feedbackOnFail: true, listenOn: myConnectObj.listenOn})
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers)
              .connectOverWebChannel(wc, senderId, {iceServers: wc.iceServers})
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
                  .then(channel => {
                    channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
                    this.onChannel(wc, channel, senderId)
                  })
                  .catch(reason => wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn}))
              })
          }
        }
      }
    }
  }

  /**
   * @private
   * @param {WebChannel} wc
   * @param {number} senderId
   * @param {string} peerWsURL
   * @param {string} myWsURL
   */
  wsWs (wc, senderId, peerWsURL, myWsURL) {
    ServiceFactory.get(WEB_SOCKET).connect(peerWsURL)
      .then(channel => {
        channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}))
        this.onChannel(wc, channel, senderId)
      })
      .catch(reason => {
        wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myWsURL})
      })
  }

  /**
   * @private
   * @param {WebChannel} wc
   * @param {number} senderId
   * @param {string} peerWsURL
   */
  ws (wc, senderId, peerWsURL) {
    ServiceFactory.get(WEB_SOCKET).connect(peerWsURL)
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

  /**
   * @private
   * @param {number[]} connectors
   *
   * @returns {boolean}
   */
  isValid (connectors) {
    if (this.isEqual(connectors, this.WS) ||
      this.isEqual(connectors, this.WR) ||
      this.isEqual(connectors, this.WS_WR) ||
      this.isEqual(connectors, this.WR_WS)
    ) return true
    return false
  }

  /**
   * @private
   * @param {number[]} arr1
   * @param {number[]} arr2
   *
   * @returns {type} Description
   */
  isEqual (arr1, arr2) {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }
    return true
  }
}

export default ChannelBuilderService
