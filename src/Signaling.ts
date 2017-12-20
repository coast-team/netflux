import { Observable } from 'rxjs/Observable'
import { filter, map, pluck } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'

import { Channel } from './Channel'
import { log } from './misc/Util'
import { signaling } from './proto'
import { WebChannel } from './service/WebChannel'

/* tslint:disable:variable-name */

interface ISignalingConnection {
  onMessage: Observable<signaling.Message>,
  send: (msg: signaling.IMessage) => void,
  heartbeat: () => void,
  close: (code?: number, reason?: string) => void
}

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000

/* WebSocket error codes */
const HEARTBEAT_ERROR_CODE = 4002
const MESSAGE_ERROR_CODE = 4010
const FIRST_CONNECTION_ERROR_CODE = 4011

/* Preconstructed messages */
const heartbeatMsg = signaling.Message.encode(signaling.Message.create({ heartbeat: true })).finish()

export enum SignalingState {
  CONNECTING,
  OPEN,
  CONNECTED_WITH_FIRST_MEMBER,
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
  private heartbeatInterval: any
  private missedHeartbeat: number

  constructor (wc: WebChannel, url: string) {
    // public
    this.url = url
    this.state = SignalingState.CLOSED

    // private
    this.wc = wc
    this.stateSubject = new Subject<SignalingState>()
    this.channelSubject = new Subject<Channel>()
    this.rxWs = undefined
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
    if (this.state === SignalingState.CONNECTED_WITH_FIRST_MEMBER) {
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
        this.rxWs.onMessage.subscribe(
          (msg) => {
            switch (msg.type) {
            case 'heartbeat':
              this.missedHeartbeat = 0
              break
            case 'isFirst':
              if (msg.isFirst) {
                this.setState(SignalingState.READY_TO_JOIN_OTHERS)
              } else {
                this.wc.webRTCBuilder.connectOverSignaling({
                  onMessage: this.rxWs.onMessage.pipe(
                    filter(({ type }) => type === 'content'),
                    pluck('content'),
                  ),
                  send: (m) => this.rxWs.send({ content: m }),
                })
                  .then((ch: Channel) => {
                    this.setState(SignalingState.CONNECTED_WITH_FIRST_MEMBER)
                    ch.markAsIntermediry()
                  })
                  .catch((err) => {
                    this.rxWs.close(FIRST_CONNECTION_ERROR_CODE, `Failed to join over Signaling: ${err.message}`)
                  })
              }
              break
            }
          },
        )
        this.startHeartbeat()
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
          onMessage: this.rxWs.onMessage.pipe(
            filter(({ type }) => type === 'content'),
            pluck('content'),
          ),
          send: (msg) => this.rxWs.send({ content: msg }),
        }).subscribe((ch) => this.channelSubject.next(ch))
      }
    }
  }

  private startHeartbeat () {
    this.missedHeartbeat = 0
    this.heartbeatInterval = global.setInterval(() => {
      try {
        this.missedHeartbeat++
        if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
          throw new Error('Too many missed heartbeats')
        }
        this.rxWs.heartbeat()
      } catch (err) {
        global.clearInterval(this.heartbeatInterval)
        log.info('Closing connection with Signaling. Reason: ' + err.message)
        this.rxWs.close(HEARTBEAT_ERROR_CODE, 'Signaling is not responding')
      }
    }, HEARTBEAT_INTERVAL)
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
    ws.onerror = (err) => {
      log.debug('Signaling ERROR', err)
      subject.error(err)
    }
    ws.onclose = (closeEvt) => {
      clearInterval(this.heartbeatInterval)
      this.setState(SignalingState.CLOSED)
      subject.complete()
      log.info(`Connection with Signaling '${this.url}' closed: ${closeEvt.code}: ${closeEvt.reason}`)
    }
    return {
      onMessage: subject.asObservable() as Observable<signaling.Message>,
      send: (msg) => {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          ws.send(signaling.Message.encode(signaling.Message.create(msg)).finish())
        }
      },
      heartbeat: () => {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          ws.send(heartbeatMsg)
        }
      },
      close: (code = 1000, reason = '') => ws.close(code, reason),
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
