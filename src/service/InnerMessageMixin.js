import { inner } from 'Protobuf.js'

export class InnerMessageMixin {
  constructor (id, EncoderDecoder, msgStream = undefined) {
    this.serviceId = id
    this.EncoderDecoder = EncoderDecoder
    if (msgStream !== undefined) {
      this.setInnerStream(msgStream)
    }
  }

  setInnerStream (msgStream) {
    this.innerStream = msgStream
      .filter(({ id }) => id === this.serviceId)
      .map(({ channel, senderId, recipientId, content }) => ({
        channel,
        senderId,
        recipientId,
        msg: this.EncoderDecoder.decode(content)
      }))
  }

  encode (msg) {
    const content = this.EncoderDecoder.encode(
      this.EncoderDecoder.create(msg)
    ).finish()
    return inner.Message.encode(
      inner.Message.create({ id: this.serviceId, content })
    ).finish()
  }

  decode (bytes) {
    return this.EncoderDecoder.decode(bytes)
  }
}
