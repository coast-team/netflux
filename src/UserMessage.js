import { Util } from 'Util'
import { user } from 'Protobuf.js'
const ted = Util.require(Util.TEXT_ENCODING)

/**
 * Maximum size of the user message sent over `Channel`. Is meant without metadata.
 * @type {number}
 */
const MAX_USER_MSG_SIZE = 15000

/**
 * Maximum message id number.
 * @type {number}
 */
const MAX_MSG_ID_SIZE = 65535

const stringEncoder = new ted.TextEncoder()
const stringDecoder = new ted.TextDecoder()

/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */
export class UserMessage {
  constructor () {
    this.buffers = new Map()
  }

  /**
   * @callback MessageService~Send
   * @param {ArrayBuffer} dataChunk - If the message is too big this
   * action would be executed for each data chunk until send whole message
   */

  /**
   * @private
   * @typedef {ARRAY_BUFFER_TYPE|STRING_TYPE} MessageTypeEnum
   */

  /**
   * Prepare user message to be sent over the `WebChannel`.
   *
   * @param {UserMessage} data Message to be sent
   * @param {number} senderId Id of the peer who sends this message
   * @param {number} recipientId Id of the recipient peer
   * @param {boolean} [isBroadcast=true] Equals to true if this message would be
   * sent to all `WebChannel` members and false if only to one member
   * @return {ArrayBuffer}
   */
  encode (data) {
    const {type, bytes} = this.userDataToType(data)
    const msg = { length: bytes.byteLength, type }
    if (bytes.byteLength <= MAX_USER_MSG_SIZE) {
      msg.full = new Uint8Array(bytes)
    } else {
      const numberOfChunks = Math.ceil(bytes.byteLength / MAX_USER_MSG_SIZE)
      const msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE)
      for (let chunkNumber = 0; chunkNumber < numberOfChunks; chunkNumber++) {
        const chunkLength = Math.min(
          MAX_USER_MSG_SIZE,
          bytes.byteLength - MAX_USER_MSG_SIZE * chunkNumber
        )
        const begin = MAX_USER_MSG_SIZE * chunkNumber
        const end = begin + chunkLength
        msg.chunk = {
          id: msgId,
          number: chunkNumber,
          content: new Uint8Array(bytes.slice(begin, end))
        }
      }
    }
    return user.Message.encode(user.Message.create(msg)).finish()
  }

  decode (bytes, senderId) {
    const msg = user.Message.decode(new Uint8Array(bytes))
    let content
    switch (msg.content) {
      case 'full': {
        content = msg.full
        break
      }
      case 'chunk': {
        let buffer = super.getItem(senderId, msg.chunk.id)
        if (buffer === undefined) {
          buffer = new Buffer(msg.length, msg.chunk.content, msg.chunk.number)
          super.setItem(senderId, msg.chunk.id, buffer)
          content = undefined
        } else {
          content = buffer.append(msg.chunk.content, msg.chunk.number)
        }
        break
      }
      default: {
        throw new Error('Unknown message integrity')
      }
    }
    return content !== undefined ? this.typeToUserData(content, msg.type) : undefined
  }

  /**
   * Netflux sends data in `ArrayBuffer`, but the user can send data in different
   * types. This function retrieve the inital message sent by the user.
   * @private
   * @param {ArrayBuffer} buffer Message as it was received by the `WebChannel`
   * @param {MessageTypeEnum} type Message type as it was defined by the user
   * @returns {ArrayBuffer|TypedArray} Initial user message
   */
  typeToUserData (buffer, type) {
    switch (type) {
      case user.Message.Type.ARRAY_BUFFER:
        return buffer
      case user.Message.Type.STRING:
        return stringDecoder.decode(buffer)
      default:
        throw new Error('Unknown message type')
    }
  }

  /**
   * Identify the user message type.
   *
   * @private
   * @param {Message} data User message
   * @returns {MessageTypeEnum} User message type
   */
  userDataToType (data) {
    let type
    let bytes
    if (data instanceof ArrayBuffer) {
      type = user.Message.Type.ARRAY_BUFFER
      bytes = data
    } else if (typeof data === 'string' || data instanceof String) {
      type = user.Message.Type.STRING
      bytes = stringEncoder.encode(data)
    } else if (ArrayBuffer.isView(data)) {
      type = user.Message.Type.ARRAY_BUFFER
      bytes = data.buffer
    } else {
      throw new Error('Unknown message object')
    }
    return {type, bytes: new Uint8Array(bytes)}
  }
}

/**
 * Buffer class used when the user message exceeds the message size limit which
 * may be sent over a `Channel`. Each buffer is identified by `WebChannel` id,
 * peer id (who sends the big message) and message id (in case if the peer sends
 * more then 1 big message at a time).
 * @private
 */
class Buffer {
  /**
   * @param {number} fullDataSize The total user message size
   * @param {ArrayBuffer} data The first chunk of the user message
   * @param {number} chunkNb Number of the chunk
   * @param {function(buffer: ArrayBuffer)} action Callback to be executed when all
   * message chunks are received and thus the message is ready
   */
  constructor (fullDataSize, data, chunkNb) {
    this.fullData = new Uint8Array(fullDataSize)
    this.currentSize = 0
    this.add(data, chunkNb)
  }

  /**
   * Add a chunk of message to the buffer.
   * @param {ArrayBuffer} data - Message chunk
   * @param {number} chunkNb - Number of the chunk
   * @return {undefined|ArrayBuffer}
   */
  append (data, chunkNb) {
    const dataChunk = new Uint8Array(data)
    this.currentSize += data.byteLength
    let index = chunkNb * MAX_USER_MSG_SIZE
    for (let i = 0; i < data.byteLength; i++) {
      this.fullData[index++] = dataChunk[i]
    }
    if (this.currentSize === this.fullData.byteLength) {
      return this.fullData.buffer
    } else {
      return undefined
    }
  }
}
