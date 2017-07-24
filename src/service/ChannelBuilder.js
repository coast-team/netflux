import { Subject } from 'rxjs/Subject'

import { Service } from './Service'
import { channelBuilder } from '../Protobuf'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { WebRTCBuilder } from './WebRTCBuilder'

const ID = 2
const ME = {
  wsUrl: '',
  isWrtcSupport: false
}

let request
let response

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `WebRTCBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export class ChannelBuilder extends Service {
  constructor (wc) {
    super(ID, channelBuilder.Message, wc._svcMsgStream)
    this.wc = wc
    this.init()

    // Listen on Channels as RTCDataChannels if WebRTC is supported
    ME.isWrtcSupport = WebRTCBuilder.isSupported
    if (ME.isWrtcSupport) {
      wc.webRTCBuilder.channelsFromWebChannel()
        .subscribe(ch => this._handleChannel(ch))
    }

    // Listen on Channels as WebSockets if the peer is listening on WebSockets
    WebSocketBuilder.listen().subscribe(url => {
      ME.wsUrl = url
      if (url) {
        wc.webSocketBuilder.channels()
          .subscribe(ch => this._handleChannel(ch))
      }

      // Update preconstructed messages (for performance only)
      const content = { wsUrl: url, isWrtcSupport: ME.isWrtcSupport }
      request = super.encode({ request: content })
      response = super.encode({ response: content })
    })

    // Subscribe to WebChannel internal messages
    this.svcMsgStream.subscribe(
      msg => this._handleInnerMessage(msg),
      err => console.error('ChannelBuilder Message Stream Error', err, wc),
      () => this.init()
    )
  }

  init (wc) {
    this.pendingRequests = new Map()
    this.channelStream = new Subject()
  }

  /**
   * Establish a channel with the peer identified by `id`.
   *
   * @param {number} id
   *
   * @returns {Promise<Channel, string>}
   */
  connectTo (id) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {resolve, reject})
      this.wc._sendTo({ recipientId: id, content: request })
    })
  }

  channels () {
    return this.channelStream.asObservable()
  }

  _handleChannel (ch) {
    const pendReq = this.pendingRequests.get(ch.peerId)
    if (pendReq) {
      pendReq.resolve(ch)
    } else {
      this.channelStream.next(ch)
    }
  }

  /**
   * @param {Channel} channel
   * @param {number} senderId
   * @param {number} recipientId
   * @param {Object} msg
   */
  _handleInnerMessage ({ channel, senderId, recipientId, msg }) {
    const wc = channel.webChannel

    switch (msg.type) {
      case 'failed': {
        this.pendingRequests.get(senderId).reject(new Error(msg.failed))
        break
      }
      case 'request': {
        const { wsUrl, isWrtcSupport } = msg.request
        // If remote peer is listening on WebSocket, connect to him
        if (wsUrl) {
          this.wc.webSocketBuilder.connectTo(wsUrl, senderId)
            .then(ch => this._handleChannel(ch))
            .catch(reason => {
              if (ME.wsUrl) {
                // Ask him to connect to me via WebSocket
                wc._sendTo({ recipientId: senderId, content: response })
              } else {
                // Send failed reason
                wc._sendTo({
                  recipientId: senderId,
                  content: super.encode({ failed: `Failed to establish a socket: ${reason}` })
                })
              }
            })

        // If remote peer is able to connect over RTCDataChannel, verify first if I am listening on WebSocket
        } else if (isWrtcSupport) {
          if (ME.wsUrl) {
            // Ask him to connect to me via WebSocket
            wc._sendTo({ recipientId: senderId, content: response })
          } else if (ME.isWrtcSupport) {
            this.wc.webRTCBuilder.connectOverWebChannel(senderId)
              .then(ch => this._handleChannel(ch))
              .catch(reason => {
                // Send failed reason
                wc._sendTo({
                  recipientId: senderId,
                  content: super.encode({ failed: `Failed establish a data channel: ${reason}` })
                })
              })
          } else {
            // Send failed reason
            wc._sendTo({
              recipientId: senderId,
              content: super.encode({ failed: 'No common connectors' })
            })
          }
        // If peer is not listening on WebSocket and is not able to connect over RTCDataChannel
        } else if (!wsUrl && !isWrtcSupport) {
          if (ME.wsUrl) {
            // Ask him to connect to me via WebSocket
            wc._sendTo({ recipientId: senderId, content: response })
          } else {
            // Send failed reason
            wc._sendTo({
              recipientId: senderId,
              content: super.encode({ failed: 'No common connectors' })
            })
          }
        }
        break
      }
      case 'response': {
        const { wsUrl } = msg.response
        if (wsUrl) {
          this.wc.webSocketBuilder.connectTo(wsUrl, senderId)
            .then(ch => this._handleChannel(ch))
            .catch(reason => {
              this.pendingRequests.get(senderId)
                .reject(new Error(`Failed to establish a socket: ${reason}`))
            })
        }
        break
      }
    }
  }
}
