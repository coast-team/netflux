import { merge, Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import { Channel } from '../Channel'
import { IStream, log } from '../misc/util'
import { InSigMsg, OutSigMsg } from '../Signaling'
import { InWcMsg, OutWcMessage, WebChannel } from '../WebChannel'

export interface IMessageFactory<OutMsg, InMsg extends OutMsg> {
  create: (properties?: OutMsg) => InMsg
  encode: (message: OutMsg) => { finish: () => Uint8Array }
  decode: (reader: Uint8Array) => InMsg
}

export interface IWebChannelStream<OutMsg, InMsg> {
  id: number
  message: Observable<{
    senderId: number
    msg: InMsg
    channel: Channel
    recipientId: number
  }>
  send: (msg: Uint8Array | OutMsg, recipientId: number) => void
}

export interface ISignalingStream<OutMsg, InMsg> {
  id: number
  message: Observable<{ senderId: number; recipientId: number; msg: InMsg }>
  send: (msg: Uint8Array | OutMsg, recipientId: number, senderId: number) => void
}

export interface IAllStreams<OutMsg, InMsg> {
  message: Observable<{ streamId: number; senderId: number; recipientId: number; msg: InMsg }>
  sendOver: (
    streamId: number,
    msg: Uint8Array | OutMsg,
    recipientId: number,
    senderId: number
  ) => void
}

/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export abstract class Service<OutMsg, InMsg extends OutMsg> {
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

  protected useWebChannelStream(
    wc: IStream<OutWcMessage, InWcMsg> & WebChannel
  ): IWebChannelStream<OutMsg, InMsg> {
    return {
      id: wc.STREAM_ID,
      message: wc.messageFromStream.pipe(
        filter(({ serviceId }) => serviceId === this.serviceId),
        map(({ channel, senderId, recipientId, content }) => ({
          channel,
          senderId,
          recipientId,
          msg: this.decode(content),
        })),
        filter(({ msg }: any) => msg && msg.type)
      ),
      send: (content: Uint8Array | OutMsg, recipientId: number) => {
        wc.sendOverStream({
          senderId: wc.myId,
          recipientId,
          serviceId: this.serviceId,
          content: content instanceof Uint8Array ? content : this.encode(content),
        })
      },
    }
  }

  protected useSignalingStream(sig: IStream<OutSigMsg, InSigMsg>): ISignalingStream<OutMsg, InMsg> {
    return {
      id: sig.STREAM_ID,
      message: sig.messageFromStream.pipe(
        filter(({ serviceId }) => serviceId === this.serviceId),
        map(({ senderId, recipientId, content }) => ({
          senderId,
          recipientId,
          msg: this.decode(content),
        })),
        filter(({ msg }: any) => msg && msg.type)
      ),
      send: (content: Uint8Array | OutMsg, recipientId: number, senderId: number) => {
        sig.sendOverStream({
          senderId,
          recipientId,
          serviceId: this.serviceId,
          content: content instanceof Uint8Array ? content : this.encode(content),
        })
      },
    }
  }

  protected useAllStreams(
    wc: IStream<OutWcMessage, InWcMsg> & WebChannel,
    sig: IStream<OutSigMsg, InSigMsg>
  ): IAllStreams<OutMsg, InMsg> {
    const wcStream = this.useWebChannelStream(wc)
    const sigStream = this.useSignalingStream(sig)
    return {
      message: merge(
        wcStream.message.pipe(
          map(({ senderId, recipientId, msg }) => ({
            streamId: wcStream.id,
            senderId,
            recipientId,
            msg,
          }))
        ),
        sigStream.message.pipe(
          map(({ senderId, recipientId, msg }) => ({
            streamId: sigStream.id,
            senderId,
            recipientId,
            msg,
          }))
        )
      ),
      sendOver: (
        streamId: number,
        msg: Uint8Array | OutMsg,
        recipientId: number,
        senderId: number
      ) => {
        if (streamId === wcStream.id) {
          wcStream.send(msg, recipientId)
        } else {
          sigStream.send(msg, recipientId, senderId)
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
    try {
      return this.proto.decode(bytes)
    } catch (err) {
      log.warn('Decode service message error: ', err)
    }
    return { type: undefined } as any
  }
}
