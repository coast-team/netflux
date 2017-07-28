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
  protoMessage: any
  svcMsgStream: Subject<ServiceMessage>

  constructor (id, protoMessage, msgStream?) {
    this.serviceId = id
    this.protoMessage = protoMessage
    if (msgStream !== undefined) {
      this.setSvcMsgStream(msgStream)
    }
  }

  public encode (msg: any): Uint8Array {
    return service.Message.encode(
      service.Message.create({
        id: this.serviceId,
        content: this.protoMessage.encode(this.protoMessage.create(msg)).finish()
      })
    ).finish()
  }

  public decode (bytes: Uint8Array): any {
    return this.protoMessage.decode(bytes)
  }

  private setSvcMsgStream (msgStream) {
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
