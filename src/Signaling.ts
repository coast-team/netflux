import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { IStream } from './IStream'
import { isWebSocketSupported, log } from './misc/Util'
import { IMessage, Message, signaling as proto } from './proto'
import { WebChannel } from './WebChannel'

export type InSigMsg = Message
export type OutSigMsg = IMessage

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000

/* WebSocket error codes */
const HEARTBEAT_ERROR_CODE = 4002
// const MESSAGE_ERROR_CODE = 4010

/* Preconstructed messages */
const heartbeatMsg = proto.Message.encode(proto.Message.create({ heartbeat: true })).finish()

export enum SignalingState {
  CONNECTING,
  CONNECTED,
  STABLE,
  CLOSING,
  CLOSED,
}

// export enum SignalingState {
//   CONNECTING,
//   CHECKING,
//   CONNECTED,
//   CLOSING,
//   CLOSED
// }

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling implements IStream<OutSigMsg, InSigMsg> {
  public readonly STREAM_ID = 1
  public url: string
  public state: SignalingState

  private wc: WebChannel
  private stateSubject: Subject<SignalingState>
  private ws: WebSocket
  private timeout: NodeJS.Timer
  private streamSubject: Subject<InSigMsg>

  // Heartbeat
  private heartbeatInterval: any
  private missedHeartbeat: number

  constructor(wc: WebChannel, url: string) {
    this.wc = wc
    this.url = url
    this.state = SignalingState.CLOSED

    this.streamSubject = new Subject()
    this.stateSubject = new Subject<SignalingState>()
  }

  get messageFromStream(): Observable<InSigMsg> {
    return this.streamSubject.asObservable()
  }

  sendOverStream(msg: OutSigMsg) {
    log.signaling(this.wc.myId + ' Forward message', msg)
    this.send({
      content: {
        id: msg.recipientId,
        unsubscribe: msg.content === undefined,
        data: Message.encode(Message.create(msg)).finish(),
      },
    })
  }

  get onState(): Observable<SignalingState> {
    return this.stateSubject.asObservable()
  }

  /**
   * Notify Signaling server that you had joined the network and ready
   * to join new peers to the network.
   */
  open(): void {
    this.send({ stable: true })
    if (this.state === SignalingState.CONNECTING) {
      this.setState(SignalingState.CONNECTED)
    }
    this.setState(SignalingState.STABLE)
  }

  join(key: string): void {
    log.signaling('join', key)
    if (isWebSocketSupported()) {
      if (this.state !== SignalingState.CLOSING && this.state !== SignalingState.CLOSED) {
        this.ws.onclose = () => {}
        this.ws.onmessage = () => {}
        this.ws.onerror = () => {}
        clearInterval(this.heartbeatInterval)
        clearTimeout(this.timeout)
        this.missedHeartbeat = 0
        this.close()
      }
      this.setState(SignalingState.CONNECTING)
      this.ws = new global.WebSocket(this.url.endsWith('/') ? this.url + key : this.url + '/' + key)
      this.ws.binaryType = 'arraybuffer'
      this.timeout = setTimeout(() => {
        if (this.ws.readyState !== this.ws.OPEN) {
          log.signaling(`Failed to connect to Signaling server ${this.url}: connection timeout`)
          this.close()
        }
      }, 10000)
      this.ws.onopen = () => {
        log.signaling('WebSocket OPENED', key)
        clearTimeout(this.timeout)
        this.startHeartbeat()
      }
      this.ws.onerror = (err) => log.signaling(`WebSocket ERROR`, err)
      this.ws.onclose = (closeEvt) => {
        log.signaling('WebSocket CLOSED', closeEvt)
        this.setState(SignalingState.CLOSED)
      }
      this.ws.onmessage = ({ data }: { data: ArrayBuffer }) => this.handleMessage(data)
    } else {
      throw new Error(
        'Failed to join over Signaling: WebSocket is not supported by your environment'
      )
    }
  }

  /**
   * Close the `WebSocket` with Signaling server.
   */
  close(): void {
    if (this.state !== SignalingState.CLOSING && this.state !== SignalingState.CLOSED) {
      this.setState(SignalingState.CLOSING)
      if (this.ws) {
        this.ws.close(1000)
      }
    }
  }

  private handleMessage(bytes: ArrayBuffer) {
    const msg = proto.Message.decode(new Uint8Array(bytes))
    switch (msg.type) {
      case 'heartbeat':
        this.missedHeartbeat = 0
        break
      case 'isFirst':
        if (msg.isFirst) {
          this.setState(SignalingState.STABLE)
        } else {
          this.wc.channelBuilder
            .connectOverSignaling()
            .then(() => this.setState(SignalingState.CONNECTED))
            .catch((err) => this.send({ tryAnother: true }))
        }
        break
      case 'content': {
        const { data, id } = msg.content as proto.Content
        const streamMessage = Message.decode(data)
        streamMessage.senderId = id
        log.signaling('StreamMessage RECEIVED: ', streamMessage)
        this.streamSubject.next(streamMessage)
        break
      }
    }
  }

  private setState(state: SignalingState) {
    if (this.state !== state) {
      if (
        state !== SignalingState.CONNECTED ||
        (state === SignalingState.CONNECTED && this.state !== SignalingState.STABLE)
      ) {
        log.signaling('State is ', SignalingState[state])
        this.state = state
        this.stateSubject.next(state)
      }
    }
  }

  private startHeartbeat() {
    this.missedHeartbeat = 0
    this.heartbeatInterval = global.setInterval(() => {
      try {
        this.missedHeartbeat++
        if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
          throw new Error('Too many missed heartbeats')
        }
        this.heartbeat()
      } catch (err) {
        global.clearInterval(this.heartbeatInterval)
        log.signaling('Closing connection with Signaling. Reason: ' + err.message)
        this.setState(SignalingState.CLOSING)
        this.ws.close(HEARTBEAT_ERROR_CODE, 'Signaling is not responding')
      }
    }, HEARTBEAT_INTERVAL)
  }

  private send(msg: proto.IMessage) {
    try {
      this.ws.send(proto.Message.encode(proto.Message.create(msg)).finish())
    } catch (err) {
      log.signaling('Failed send to Signaling', err)
    }
  }

  private heartbeat() {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(heartbeatMsg)
      } catch (err) {
        log.signaling('Failed send to Signaling: ' + err.message)
      }
    }
  }
}
