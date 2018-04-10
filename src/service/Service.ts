import { Observable } from 'rxjs/Observable'
import { filter, map } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'

import { Channel, IIncomingMessage } from '../Channel'
import { WebChannel } from './WebChannel'

interface IMessageFactory<IMessage, Message extends IMessage> {
  create: (properties?: IMessage) => Message
  encode: (message: IMessage) => { finish: () => Uint8Array }
  decode: (reader: Uint8Array) => Message
}

/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export abstract class Service<IMessage, Message extends IMessage> {
  /*
   * Service message observable.
   */
  protected onServiceMessage: Observable<{
    channel: Channel
    senderId: number
    recipientId: number
    msg: Message
  }>

  protected wc: WebChannel
  /*
   * Unique service identifier.
   */
  private serviceId: number

  /*
   * Service protobufjs object generated from `.proto` file.
   */
  private proto: IMessageFactory<IMessage, Message>

  constructor(serviceId: number, proto: IMessageFactory<IMessage, Message>, serviceMessageSubject?: Subject<IIncomingMessage>) {
    this.serviceId = serviceId
    this.proto = proto
    if (serviceMessageSubject !== undefined) {
      this.setupServiceMessage(serviceMessageSubject)
    }
  }

  protected _sendTo(id: number, content: Uint8Array | IMessage) {
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
  protected encode(msg: IMessage): Uint8Array {
    return this.proto.encode(this.proto.create(msg) as IMessage).finish()
  }

  /**
   * Decode service message received from the network.
   *
   * @return  Service specific message object
   */
  protected decode(bytes: Uint8Array): Message {
    return this.proto.decode(bytes)
  }

  protected setupServiceMessage(serviceMessageSubject: Subject<IIncomingMessage>): void {
    this.onServiceMessage = serviceMessageSubject.pipe(
      filter(({ serviceId }) => serviceId === this.serviceId),
      map(({ channel, senderId, recipientId, content }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.decode(content),
      }))
    )
  }
}
