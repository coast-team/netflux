import { merge } from 'rxjs/observable/merge'
import { filter, map } from 'rxjs/operators'

import { Observable } from 'rxjs/Observable'
import { Channel } from '../Channel'
import { IStream } from '../IStream'
import { InSigMsg, OutSigMsg } from '../Signaling'
import { InWcMsg, OutWcMessage, WebChannel } from '../WebChannel'

export interface IMessageFactory<OutMsg, InMsg extends OutMsg> {
  create: (properties?: OutMsg) => InMsg
  encode: (message: OutMsg) => { finish: () => Uint8Array }
  decode: (reader: Uint8Array) => InMsg
}

/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export abstract class Service<OutMsg, InMsg extends OutMsg> {
  protected wc: WebChannel

  protected wcStream: {
    id: number
    message: Observable<{
      senderId: number
      msg: InMsg
      channel: Channel
      recipientId: number
    }>
    send: (msg: Uint8Array | OutMsg | undefined, id?: number) => void
  }

  protected sigStream: {
    id: number
    message: Observable<{ senderId: number; msg: InMsg }>
    send: (msg: Uint8Array | OutMsg | undefined, id?: number) => void
  }

  protected streams: {
    message: Observable<{ streamId: number; senderId: number; msg: InMsg }>
    sendOver: (streamId: number, msg: Uint8Array | OutMsg | undefined, id?: number) => void
  }

  /*
   * Unique service identifier.
   */
  private serviceId: number

  /*
   * Service protobufjs object generated from `.proto` file.
   */
  private proto: IMessageFactory<OutMsg, InMsg>

  constructor(serviceId: number, proto: IMessageFactory<OutMsg, InMsg>) {
    this.serviceId = serviceId
    this.proto = proto
  }

  protected useWebChannelStream(wc: IStream<OutWcMessage, InWcMsg> & WebChannel) {
    this.wc = wc
    this.wcStream = {
      id: this.wc.STREAM_ID,
      message: wc.messageFromStream.pipe(
        filter(({ serviceId }) => serviceId === this.serviceId),
        map(({ channel, senderId, recipientId, content }) => ({
          channel,
          senderId,
          recipientId,
          msg: this.decode(content),
        }))
      ),
      send: (content: Uint8Array | OutMsg | undefined, id?: number) => {
        if (content && !(content instanceof Uint8Array)) {
          wc.sendOverStream({
            senderId: this.wc.myId,
            recipientId: id,
            serviceId: this.serviceId,
            content: this.encode(content),
          })
        } else {
          wc.sendOverStream({
            senderId: this.wc.myId,
            recipientId: id,
            serviceId: this.serviceId,
            content: content as Uint8Array | undefined,
          })
        }
      },
    }
  }

  protected useSignalingStream(sig: IStream<OutSigMsg, InSigMsg>) {
    this.sigStream = {
      id: sig.STREAM_ID,
      message: sig.messageFromStream.pipe(
        filter(({ serviceId }) => serviceId === this.serviceId),
        map(({ senderId, content }) => ({ senderId, msg: this.decode(content) }))
      ),
      send: (content: Uint8Array | OutMsg | undefined, id?: number) => {
        if (content && !(content instanceof Uint8Array)) {
          sig.sendOverStream({
            recipientId: id,
            serviceId: this.serviceId,
            content: this.encode(content),
          })
        } else {
          sig.sendOverStream({
            recipientId: id,
            serviceId: this.serviceId,
            content: content as Uint8Array | undefined,
          })
        }
      },
    }

    this.streams = {
      message: merge(
        this.wcStream.message.pipe(
          map(({ senderId, msg }) => ({ streamId: this.wcStream.id, senderId, msg }))
        ),
        this.sigStream.message.pipe(
          map(({ senderId, msg }) => ({ streamId: this.sigStream.id, senderId, msg }))
        )
      ),
      sendOver: (streamId: number, msg: Uint8Array | OutMsg | undefined, id?: number) => {
        if (streamId === this.wcStream.id) {
          this.wcStream.send(msg, id)
        } else {
          this.sigStream.send(msg, id)
        }
      },
    }
  }

  /**
   * Encode service message for sending over the network.
   *
   * @param msg Service specific message object
   */
  protected encode(msg: OutMsg): Uint8Array {
    return this.proto.encode(this.proto.create(msg)).finish()
  }

  /**
   * Decode service message received from the network.
   *
   * @return  Service specific message object
   */
  protected decode(bytes: Uint8Array): InMsg {
    return this.proto.decode(bytes)
  }
}
