import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'

import { signaling } from './Protobuf'
import { WebChannel } from './service/WebChannel'
import { Channel } from './Channel'

/* tslint:disable:variable-name */

interface SignalingConnection {
  stream: Subject<any>,
  send: (msg: any) => any,
  pong: () => void,
  ping: () => void,
  close: (code: number, reason?: string) => void,
  readyState: number
}

type State = 0 | 1 | 2 | 3


const PING_INTERVAL = 3000
const MESSAGE_ERROR_CODE = 4000
const PING_ERROR_CODE = 4001
const FIRST_CONNECTION_ERROR_CODE = 4002

const pingMsg = signaling.Message.encode(signaling.Message.create({ ping: true })).finish()
const pongMsg = signaling.Message.encode(signaling.Message.create({ pong: true })).finish()

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling {

  static CONNECTING = 0
  static OPEN = 1
  static FIRST_CONNECTED = 4
  static READY_TO_JOIN_OTHERS = 5
  static CLOSED = 3

  public url: string
  public state: number

  private wc: WebChannel
  private onChannel: (ch: Channel) => void
  private stateSubject: Subject<number>
  private rxWs: SignalingConnection
  private pingInterval: any
  private pongReceived: boolean

  /**
   * @param {WebChannel} wc
   * @param {function(ch: RTCDataChannel)} onChannel
   * @param {string} url
   */
  constructor (wc: WebChannel, onChannel: (ch: Channel) => void, url: string) {
    // public
    this.url = url.endsWith('/') ? url : url + '/'
    this.onChannel = onChannel

    // private
    this.wc = wc
    this.stateSubject = new Subject<number>()
    this.rxWs = undefined
    this.pingInterval = undefined
    this.pongReceived = false

    // Init state
    this.setState(Signaling.CLOSED)
  }

  get onState (): Observable<number> {
    return this.stateSubject.asObservable()
  }

  /**
   * Notify Signaling server that you had joined the network and ready
   * to add new peers to the network.
   */
  open (): void {
    if (this.state === Signaling.FIRST_CONNECTED) {
      this.rxWs.send({ joined: true })
      this.setState(Signaling.READY_TO_JOIN_OTHERS)
    }
  }

  join (key): void {
    if (this.state !== Signaling.CLOSED) {
      throw new Error('Failed to join via signaling: connection with signaling is already opened')
    }
    this.setState(Signaling.CONNECTING)
    this.wc.webSocketBuilder.connect(this.url + key)
      .then(ws => {
        this.setState(Signaling.OPEN)
        this.rxWs = this.createRxWs(ws)
        this.startPingInterval()
        this.rxWs.stream.subscribe(
          msg => {
            switch (msg.type) {
            case 'ping': {
              this.rxWs.pong()
              break
            }
            case 'pong': {
              this.pongReceived = true
              break
            }
            case 'isFirst':
              if (msg.isFirst) {
                this.setState(Signaling.READY_TO_JOIN_OTHERS)
              } else {
                this.wc.webRTCBuilder.connectOverSignaling({
                  stream: this.rxWs.stream.filter(msg => msg.type === 'content')
                    .map(({ content }) => content),
                  send: (msg) => this.rxWs.send({ content: msg })
                })
                  .then(() => this.setState(Signaling.FIRST_CONNECTED))
                  .catch(err => {
                    this.rxWs.close(FIRST_CONNECTION_ERROR_CODE, `Failed to join over Signaling: ${err.message}`)
                  })
              }
              break
            }
          },
          err => console.error(err)
        )
      })
      .catch(err => {
        this.setState(Signaling.CLOSED)
        console.error(`Failed to connect to Signaling: ${err.message}`)
      })
  }

  /**
   * Close the `WebSocket` with Signaling server.
   */
  close (): void {
    if (this.state !== Signaling.CLOSED) {
      this.rxWs.close(1000)
    }
  }

  private setState (state: number) {
    if (this.state !== state) {
      this.state = state
      this.stateSubject.next(state)
      if (state === Signaling.READY_TO_JOIN_OTHERS) {
        this.wc.webRTCBuilder.channelsFromSignaling({
          stream: this.rxWs.stream.filter(msg => msg.type === 'content')
            .map(({ content }) => content),
          send: msg => this.rxWs.send({ content: msg })
        })
          .subscribe(
            ch => this.onChannel(ch),
            err => console.error(err.message)
          )
      }
    }
  }

  private startPingInterval () {
    this.rxWs.ping()
    this.pingInterval = setInterval(() => {
      if (!this.pongReceived) {
        this.rxWs.close(PING_ERROR_CODE, 'Signaling is no longer available')
      } else {
        this.pongReceived = false
        this.rxWs.ping()
      }
    }, PING_INTERVAL)
  }

  private createRxWs (ws: WebSocket): SignalingConnection {
    const subject = new Subject()
    ws.binaryType = 'arraybuffer'
    ws.onmessage = evt => {
      try {
        subject.next(signaling.Message.decode(new Uint8Array(evt.data)))
      } catch (err) {
        ws.close(MESSAGE_ERROR_CODE, err.message)
      }
    }
    ws.onerror = err => subject.error(err)
    ws.onclose = closeEvt => {
      clearInterval(this.pingInterval)
      this.setState(Signaling.CLOSED)
      if (closeEvt.code === 1000) {
        subject.complete()
      } else {
        console.error(`WebSocket connection to Signaling '${this.url}' failed with code ${closeEvt.code}: ${closeEvt.reason}`)
      }
    }
    return {
      stream: subject,
      send: msg => ws.send(signaling.Message.encode(
        signaling.Message.create(msg)
      ).finish()),
      pong: () => ws.send(pongMsg),
      ping: () => ws.send(pingMsg),
      close: (code, reason) => ws.close(code, reason),
      readyState: ws.readyState
    }
  }
}
