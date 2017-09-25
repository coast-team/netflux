import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { Channel } from './Channel'
import { signaling } from './proto'
import { WebChannel } from './service/WebChannel'

/* tslint:disable:variable-name */

interface ISignalingConnection {
  onMessage: Observable<signaling.Message>,
  send: (msg: signaling.IMessage) => void,
  ping: () => void,
  pong: () => void,
  close: (code?: number, reason?: string) => void
}

const PING_INTERVAL = 3000

/* WebSocket error codes */
const MESSAGE_ERROR_CODE = 4000
const PING_ERROR_CODE = 4001
const FIRST_CONNECTION_ERROR_CODE = 4002

/* Preconstructed messages */
const pingMsg = signaling.Message.encode(signaling.Message.create({ ping: true })).finish()
const pongMsg = signaling.Message.encode(signaling.Message.create({ pong: true })).finish()

export enum SignalingState {
  CONNECTING,
  OPEN,
  FIRST_CONNECTED,
  READY_TO_JOIN_OTHERS,
  CLOSED,
}

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling {

  public url: string
  public state: SignalingState

  private wc: WebChannel
  private stateSubject: Subject<SignalingState>
  private channelSubject: Subject<Channel>
  private rxWs: ISignalingConnection
  private pingInterval: any
  private pongReceived: boolean

  constructor (wc: WebChannel, url: string) {
    // public
    this.url = url
    this.state = SignalingState.CLOSED

    // private
    this.wc = wc
    this.stateSubject = new Subject<SignalingState>()
    this.channelSubject = new Subject<Channel>()
    this.rxWs = undefined
    this.pingInterval = undefined
    this.pongReceived = false
  }

  get onState (): Observable<SignalingState> {
    return this.stateSubject.asObservable()
  }

  get onChannel (): Observable<Channel> {
    return this.channelSubject.asObservable()
  }

  /**
   * Notify Signaling server that you had joined the network and ready
   * to join new peers to the network.
   */
  open (): void {
    if (this.state === SignalingState.FIRST_CONNECTED) {
      this.rxWs.send({ joined: true })
      this.setState(SignalingState.READY_TO_JOIN_OTHERS)
    }
  }

  join (key: string): void {
    if (this.state === SignalingState.READY_TO_JOIN_OTHERS) {
      throw new Error('Failed to join via signaling: connection with signaling is already opened')
    }
    if (this.state !== SignalingState.CLOSED) {
      this.close()
    }
    this.setState(SignalingState.CONNECTING)
    this.wc.webSocketBuilder.connect(this.getFullURL(key))
      .then((ws) => {
        this.setState(SignalingState.OPEN)
        this.rxWs = this.createRxWs(ws)
        this.startPingInterval()
        this.rxWs.onMessage.subscribe(
          (msg) => {
            switch (msg.type) {
            case 'ping':
              this.rxWs.pong()
              break
            case 'pong':
              this.pongReceived = true
              break
            case 'isFirst':
              if (msg.isFirst) {
                this.setState(SignalingState.READY_TO_JOIN_OTHERS)
              } else {
                this.wc.webRTCBuilder.connectOverSignaling({
                  onMessage: this.rxWs.onMessage.filter((m) => m.type === 'content')
                    .map(({ content }) => content),
                  send: (m) => this.rxWs.send({ content: m }),
                })
                  .then(() => this.setState(SignalingState.FIRST_CONNECTED))
                  .catch((err) => {
                    this.rxWs.close(FIRST_CONNECTION_ERROR_CODE, `Failed to join over Signaling: ${err.message}`)
                  })
              }
              break
            }
          },
        )
      })
      .catch((err) => this.setState(SignalingState.CLOSED))
  }

  /**
   * Close the `WebSocket` with Signaling server.
   */
  close (): void {
    if (this.rxWs) {
      this.rxWs.close(1000)
    }
  }

  private setState (state: SignalingState) {
    if (this.state !== state) {
      this.state = state
      this.stateSubject.next(state)
      if (state === SignalingState.READY_TO_JOIN_OTHERS) {
        this.wc.webRTCBuilder.onChannelFromSignaling({
          onMessage: this.rxWs.onMessage.filter((msg) => msg.type === 'content')
            .map(({ content }) => content),
          send: (msg) => this.rxWs.send({ content: msg }),
        }).subscribe((ch) => this.channelSubject.next(ch))
      }
    }
  }

  private startPingInterval () {
    this.rxWs.ping()
    this.pingInterval = setInterval(() => {
      if (this.state !== SignalingState.CLOSED) {
        if (!this.pongReceived) {
          clearInterval(this.pingInterval)
          this.rxWs.close(PING_ERROR_CODE, 'Signaling is not responding')
        } else {
          this.pongReceived = false
          this.rxWs.ping()
        }
      }
    }, PING_INTERVAL)
  }

  private createRxWs (ws: WebSocket): ISignalingConnection {
    const subject = new Subject()
    ws.binaryType = 'arraybuffer'
    ws.onmessage = (evt) => {
      try {
        subject.next(signaling.Message.decode(new Uint8Array(evt.data)))
      } catch (err) {
        ws.close(MESSAGE_ERROR_CODE, err.message)
      }
    }
    ws.onerror = (err) => subject.error(err)
    ws.onclose = (closeEvt) => {
      clearInterval(this.pingInterval)
      this.setState(SignalingState.CLOSED)
      if (closeEvt.code === 1000) {
        subject.complete()
      } else {
        subject.error(new Error(`Connection with Signaling '${this.url}' closed: ${closeEvt.code}: ${closeEvt.reason}`))
      }
    }
    return {
      onMessage: subject.asObservable() as Observable<signaling.Message>,
      send: (msg) => {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          ws.send(signaling.Message.encode(signaling.Message.create(msg)).finish())
        }
      },
      ping: () => {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          ws.send(pingMsg)
        }
      },
      pong: () => {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          ws.send(pongMsg)
        }
      },
      close: (code = 1000, reason = '') => {
        ws.onclose = undefined
        ws.close(code, reason)
        this.setState(SignalingState.CLOSED)
        clearInterval(this.pingInterval)
        subject.complete()
      },
    }
  }

  private getFullURL (params) {
    if (this.url.endsWith('/')) {
      return this.url + params
    } else {
      return this.url + '/' + params
    }
  }
}
