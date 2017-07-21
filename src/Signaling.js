import { Subject } from 'rxjs/Subject'

import { signaling } from './Protobuf'

export const CONNECTING = 0
export const CONNECTED = 1
export const OPEN = 3
export const CLOSED = 4

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling {
  /**
   * @param {WebChannel} wc
   * @param {function(ch: RTCDataChannel)} onChannel
   * @param {string} url
   */
  constructor (wc, onChannel, url) {
    /**
     * @type {WebChannel}
     */
    this.wc = wc

    /**
     * Signaling server url.
     * @private
     * @type {string}
     */
    this.url = url.endsWith('/') ? url : url + '/'

    this.onStateChanged = () => {}

    this._state = CLOSED
    /**
     * Connection with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket|external:EventSource}
     */
    this.rxWs = undefined

    this.onChannel = onChannel
  }

  set state (state) {
    if (this._state !== state) {
      this._state = state
      this.onStateChanged(state)
      if (this._state === OPEN) {
        this.wc.webRTCBuilder.channelsFromSignaling({
          stream: this.rxWs.stream.filter(msg => msg.type === 'content')
            .map(({ content }) => content),
          send: msg => this.rxWs.send({ content: msg })
        })
          .subscribe(ch => this.onChannel(ch))
      }
    }
  }

  get state () {
    return this._state
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {string} [key = this.generateKey()]
   * @param {Object} signaling
   */
  open () {
    if (this.state === CONNECTED) {
      this.rxWs.send({ joined: true })
      this.state = OPEN
    }
  }

  join (key) {
    this.state = CONNECTING
    return this.wc.webSocketBuilder.connect(this.url + key)
      .then(ws => this.createRxWs(ws))
      .then(rxWs => {
        this.rxWs = rxWs
        return new Promise((resolve, reject) => {
          rxWs.stream.subscribe(
            msg => {
              switch (msg.type) {
                case 'ping':
                  rxWs.send({ pong: true })
                  break
                case 'isFirst':
                  if (msg.isFirst) {
                    this.state = OPEN
                    resolve()
                  } else {
                    this.wc.webRTCBuilder.connectOverSignaling({
                      stream: rxWs.stream.filter(msg => msg.type === 'content')
                        .map(({ content }) => content),
                      send: (msg) => rxWs.send({ content: msg })
                    })
                      .then(ch => {
                        this.state = CONNECTED
                        resolve(ch)
                      })
                      .catch(err => {
                        if (rxWs.readyState !== 2 && rxWs.readyState !== 3) {
                          rxWs.close(1000)
                        }
                        reject(new Error(`Could not join over Signaling: ${err.message}`))
                      })
                  }
                  break
              }
            },
            err => {
              this.state = CLOSED
              reject(err)
            },
            () => (this.state = CLOSED)
          )
        })
      })
      .catch(err => {
        this.state = CLOSED
        throw err
      })
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.state !== CLOSED) {
      this.rxWs.close(1000, 'hello')
    }
  }

  createRxWs (ws) {
    const subject = new Subject()
    ws.binaryType = 'arraybuffer'
    ws.onmessage = evt => {
      try {
        subject.next(signaling.Incoming.decode(new Uint8Array(evt.data)))
      } catch (err) {
        console.error(`WebSocket message error from ${ws.url}`, err)
        ws.close(4000, err.message)
      }
    }
    ws.onerror = err => subject.error(err)
    ws.onclose = closeEvt => {
      if (closeEvt.code === 1000) {
        subject.complete()
      } else {
        subject.error(new Error(`${closeEvt.code}: ${closeEvt.reason}`))
      }
    }
    return {
      stream: subject,
      send: msg => ws.send(signaling.Outcoming.encode(
        signaling.Outcoming.create(msg)
      ).finish()),
      close: (code, reason) => ws.close(code, reason),
      readyState: ws.readyState
    }
  }
}
