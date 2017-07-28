import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'

import { service } from '../Protobuf'
import { ServiceMessageEncoded, ServiceMessageDecoded } from '../typedef/types'

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
  protected serviceId: number

  /*
   * Service message observable.
   */
  protected svcMsgStream: Observable<ServiceMessageDecoded>

  /*
   * Service protobujs object generated from `.proto` file.
   */
  private protoMessage: any

  constructor (id: number, protoMessage: any, msgStream?: Subject<ServiceMessageEncoded>) {
    this.serviceId = id
    this.protoMessage = protoMessage
    if (msgStream !== undefined) {
      this.setSvcMsgStream(msgStream)
    }
  }

  /**
   * Encode service message for sending over the network.
   *
   * @param msg Service specific message object
   */
  encode (msg: object): Uint8Array {
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
  decode (bytes: Uint8Array): object {
    return this.protoMessage.decode(bytes)
  }

  protected setSvcMsgStream (msgStream: Subject<ServiceMessageEncoded>): void {
    this.svcMsgStream = msgStream
      .filter(({ id }) => id === this.serviceId)
      .map(({ channel, senderId, recipientId, content, timestamp }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.protoMessage.decode(content),
        timestamp
      }))
  }
}
