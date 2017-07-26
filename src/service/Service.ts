import { Subject } from 'rxjs/Subject'

import { service } from '../Protobuf'

export interface ServiceMessage {
  channel: any,
  senderId: number,
  recipientId: number,
  msg: any,
  timestamp: number
}

export abstract class Service {

  serviceId: number
  Message: any
  svcMsgStream: Subject<ServiceMessage>

  constructor (id, Message, msgStream?) {
    this.serviceId = id
    this.Message = Message
    if (msgStream !== undefined) {
      this.setSvcMsgStream(msgStream)
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

  private setSvcMsgStream (msgStream) {
    this.svcMsgStream = msgStream
      .filter(({ id }) => id === this.serviceId)
      .map(({ channel, senderId, recipientId, content, timestamp }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.Message.decode(content),
        timestamp
      }))
  }
}
