import { Observable } from 'rxjs/Observable'
import { filter, map } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { IMessage as IProtoMessage } from '../proto'
import { WebChannel } from './WebChannel'

export interface IMessage extends IProtoMessage {
  channel: Channel
  senderId: number
  recipientId: number
  msg: any
}

/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export abstract class Service {
  /*
   * Service message observable.
   */
  protected onServiceMessage: Observable<IMessage>

  protected wc: WebChannel
  /*
   * Unique service identifier.
   */
  private serviceId: number

  /*
   * Service protobufjs object generated from `.proto` file.
   */
  private protoMessage: any

  constructor(serviceId: number, protoMessage: any, serviceMessageSubject?: Subject<IMessage>) {
    this.serviceId = serviceId
    this.protoMessage = protoMessage
    if (serviceMessageSubject !== undefined) {
      this.setupServiceMessage(serviceMessageSubject)
    }
  }

  protected _sendTo(id: number, content: Uint8Array | object) {
    if (content instanceof Uint8Array) {
      this.wc.topologyService.sendTo({ senderId: this.wc.myId, recipientId: id, serviceId: this.serviceId, content })
    } else {
      this.wc.topologyService.sendTo({ senderId: this.wc.myId, recipientId: id, serviceId: this.serviceId, content: this.encode(content) })
    }
  }

  /**
   * Encode service message for sending over the network.
   *
   * @param msg Service specific message object
   */
  protected encode(msg: any): Uint8Array {
    return this.protoMessage.encode(this.protoMessage.create(msg)).finish()
  }

  /**
   * Decode service message received from the network.
   *
   * @return  Service specific message object
   */
  protected decode(bytes: Uint8Array): any {
    return this.protoMessage.decode(bytes)
  }

  protected setupServiceMessage(serviceMessageSubject: Subject<IMessage>): void {
    this.onServiceMessage = serviceMessageSubject.pipe(
      filter(({ serviceId }) => serviceId === this.serviceId),
      map(({ channel, senderId, recipientId, content }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.protoMessage.decode(content),
      }))
    )
  }
}
