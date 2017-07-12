import { Subject } from 'node_modules/rxjs/Subject'

import { InnerMessageMixin } from 'service/InnerMessageMixin'
import { channelBuilder } from 'Protobuf.js'
import { WebSocketService } from 'service/WebSocketService'
import { WebRTCService } from 'service/WebRTCService'
import * as log from 'log'

const ID = 2
const ME = {
  wsUrl: '',
  isWrtcSupport: false
}

let request
let response

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketService` and `WebRTCService`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export class ChannelBuilderService extends InnerMessageMixin {
  constructor (wc) {
    super(ID, channelBuilder.Message, wc._msgStream)
    this.wc = wc
    this.init()

    // Listen on Channels as RTCDataChannels if WebRTC is supported
    ME.isWrtcSupport = WebRTCService.isSupported
    if (ME.isWrtcSupport) {
      wc.webRTCSvc.channelsFromWebChannel()
        .subscribe(ch => this._handleChannel(ch))
    }

    // Listen on Channels as WebSockets if the peer is listening on WebSockets
    WebSocketService.listen().subscribe(url => {
      ME.wsUrl = url
      if (url) {
        wc.webSocketSvc.channels()
          .subscribe(ch => this._handleChannel(ch))
      }

      // Update preconstructed messages (for performance only)
      const content = { wsUrl: url, isWrtcSupport: ME.isWrtcSupport }
      request = super.encode({ request: content })
      response = super.encode({ response: content })
    })

    // Subscribe to WebChannel internal messages
    this.innerStream.subscribe(
      msg => this._handleInnerMessage(msg),
      err => log.error('ChannelBuilderService Message Stream Error', err, wc),
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
          this.wc.webSocketSvc.connectTo(wsUrl, senderId)
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
            this.wc.webRTCSvc.connectOverWebChannel(senderId)
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
          this.wc.webSocketSvc.connectTo(wsUrl, senderId)
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
