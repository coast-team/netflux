import { Subject } from 'rxjs/Subject'

import { service } from '../Protobuf'

export interface ServiceMessage {
  channel: any,
  senderId: number,
  recipientId: number,
  msg: any
}

export abstract class Service {

  serviceId: number
  Message: any
  innerStream: Subject<ServiceMessage>

  constructor (id, Message, msgStream?) {
    this.serviceId = id
    this.Message = Message
    if (msgStream !== undefined) {
      this.setInnerStream(msgStream)
    }
  }

  public encode (msg: any): Uint8Array {
    return service.Message.encode(
      service.Message.create({
        id: this.serviceId,
        content: this.Message.encode(this.Message.create(msg)).finish()
      })
    ).finish()
  }

  public decode (bytes: Uint8Array): any {
    return this.Message.decode(bytes)
  }

  private setInnerStream (msgStream) {
    this.innerStream = msgStream
      .filter(({ id }) => id === this.serviceId)
      .map(({ channel, senderId, recipientId, content }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.Message.decode(content)
      }))
  }
}
