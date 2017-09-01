import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'

import { service } from '../Protobuf'
import { Channel } from '../Channel'

export interface ServiceMessageEncoded {
  channel: Channel,
  senderId: number,
  recipientId: number,
  id: number,
  content: Uint8Array
}

export interface ServiceMessageDecoded {
  channel: Channel,
  senderId: number,
  recipientId: number,
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
   * Unique service identifier.
   */
  public serviceId: number

  /*
   * Service message observable.
   */
  protected onServiceMessage: Observable<ServiceMessageDecoded>

  /*
   * Service protobujs object generated from `.proto` file.
   */
  private protoMessage: any

  constructor (id: number, protoMessage: any, serviceMessageSubject?: Subject<ServiceMessageEncoded>) {
    this.serviceId = id
    this.protoMessage = protoMessage
    if (serviceMessageSubject !== undefined) {
      this.setupServiceMessage(serviceMessageSubject)
    }
  }

  /**
   * Encode service message for sending over the network.
   *
   * @param msg Service specific message object
   */
  encode (msg: any): Uint8Array {
    return service.Message.encode(
      service.Message.create({
        id: this.serviceId,
        content: this.protoMessage.encode(this.protoMessage.create(msg)).finish()
      })
    ).finish()
  }

  /**
   * Decode service message received from the network.
   *
   * @return  Service specific message object
   */
  decode (bytes: Uint8Array): any {
    return this.protoMessage.decode(bytes)
  }

  protected setupServiceMessage (serviceMessageSubject: Subject<ServiceMessageEncoded>): void {
    this.onServiceMessage = serviceMessageSubject
      .filter(({ id }) => id === this.serviceId)
      .map(({ channel, senderId, recipientId, content }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.protoMessage.decode(content)
      }))
  }
}
