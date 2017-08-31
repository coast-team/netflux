import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'

import { Service, ServiceMessageDecoded } from './Service'
import { channelBuilder } from '../Protobuf'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { Channel } from '../Channel'
import { WebRTCBuilder } from './WebRTCBuilder'
import { WebChannel } from './WebChannel'

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

  private wc: WebChannel
  private pendingRequests: Map<number, {resolve: (ch: Channel) => void, reject: (err: Error) => void}>
  private channelsSubject: Subject<Channel>

  constructor (wc: WebChannel) {
    super(20, channelBuilder.Message, wc._serviceMessageSubject)
    this.wc = wc
    this.pendingRequests = new Map()
    this.channelsSubject = new Subject()

    // Listen on Channels as RTCDataChannels if WebRTC is supported
    ME.isWrtcSupport = WebRTCBuilder.isSupported
    if (ME.isWrtcSupport) {
      wc._webRTCBuilder.channelsFromWebChannel()
        .subscribe(ch => this.handleChannel(ch))
    }

    // Listen on Channels as WebSockets if the peer is listening on WebSockets
    WebSocketBuilder.listen().subscribe(url => {
      ME.wsUrl = url
      if (url) {
        wc._webSocketBuilder.onChannel.subscribe(ch => this.handleChannel(ch))
      }

      // Update preconstructed messages (for performance only)
      const content = { wsUrl: url, isWrtcSupport: ME.isWrtcSupport }
      request = super.encode({ request: content })
      response = super.encode({ response: content })
    })

    // Subscribe to WebChannel internal messages
    this.onServiceMessage.subscribe(msg => this.treatServiceMessage(msg))
  }

  get onChannel (): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  /**
   * Establish a `Channel` with the peer identified by `id`.
   */
  connectTo (id: number): Promise<Channel> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: (ch: Channel) => {
          this.pendingRequests.delete(id)
          resolve(ch)
        }, reject: (err: Error) => {
          this.pendingRequests.delete(id)
          reject(err)
        }
      })
      this.wc._sendTo({ recipientId: id, content: request })
    })
  }

  private handleChannel (ch: Channel): void {
    const pendReq = this.pendingRequests.get(ch.peerId)
    if (pendReq) {
      pendReq.resolve(ch)
    } else {
      this.channelsSubject.next(ch)
    }
  }

  private treatServiceMessage ({ channel, senderId, recipientId, msg }: ServiceMessageDecoded): void {
    switch (msg.type) {
    case 'failed': {
      console.error('treatServiceMessage ERROR: ', msg.failed)
      const pr = this.pendingRequests.get(senderId)
      if (pr !== undefined) {
        pr.reject(new Error(msg.failed))
      }
      break
    }
    case 'request': {
      const { wsUrl, isWrtcSupport } = msg.request
      // If remote peer is listening on WebSocket, connect to him
      if (wsUrl) {
        this.wc._webSocketBuilder.connectTo(wsUrl, senderId)
          .then(ch => this.handleChannel(ch))
          .catch(reason => {
            if (ME.wsUrl) {
              // Ask him to connect to me via WebSocket
              this.wc._sendTo({ recipientId: senderId, content: response })
            } else {
              // Send failed reason
              this.wc._sendTo({
                recipientId: senderId,
                content: super.encode({ failed: `Failed to establish a socket: ${reason}` })
              })
            }
          })

      // If remote peer is able to connect over RTCDataChannel, verify first if I am listening on WebSocket
      } else if (isWrtcSupport) {
        if (ME.wsUrl) {
          // Ask him to connect to me via WebSocket
          this.wc._sendTo({ recipientId: senderId, content: response })
        } else if (ME.isWrtcSupport) {
          this.wc._webRTCBuilder.connectOverWebChannel(senderId)
            .then(ch => this.handleChannel(ch))
            .catch(reason => {
              // Send failed reason
              this.wc._sendTo({
                recipientId: senderId,
                content: super.encode({ failed: `Failed establish a data channel: ${reason}` })
              })
            })
        } else {
          // Send failed reason
          this.wc._sendTo({
            recipientId: senderId,
            content: super.encode({ failed: 'No common connectors' })
          })
        }
      // If peer is not listening on WebSocket and is not able to connect over RTCDataChannel
      } else if (!wsUrl && !isWrtcSupport) {
        if (ME.wsUrl) {
          // Ask him to connect to me via WebSocket
          this.wc._sendTo({ recipientId: senderId, content: response })
        } else {
          // Send failed reason
          this.wc._sendTo({
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
        this.wc._webSocketBuilder.connectTo(wsUrl, senderId)
          .then(ch => this.handleChannel(ch))
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
