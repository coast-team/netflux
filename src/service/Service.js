import { service } from 'Protobuf.js'

export class Service {
  constructor (id, Message, msgStream = undefined) {
    this.serviceId = id
    this.Message = Message
    if (msgStream !== undefined) {
      this.setSvcMsgStream(msgStream)
    }
  }

  setSvcMsgStream (msgStream) {
    this.svcMsgStream = msgStream
      .filter(({ id }) => id === this.serviceId)
      .map(({ channel, senderId, recipientId, content }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.Message.decode(content)
      }))
  }

  encode (msg) {
    return service.Message.encode(
      service.Message.create({
        id: this.serviceId,
        content: this.Message.encode(this.Message.create(msg)).finish()
      })
    ).finish()
  }

  decode (bytes) {
    return this.Message.decode(bytes)
  }
}
