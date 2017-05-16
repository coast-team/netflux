import { Util } from 'Util'
import { Service } from 'service/Service'
import { USER_DATA } from 'WebChannel'
const ted = Util.require(Util.TEXT_ENCODING)

/**
 * Maximum size of the user message sent over `Channel`. Is meant without metadata.
 * @type {number}
 */
const MAX_USER_MSG_SIZE = 16365

/**
 * User message offset in the array buffer. All data before are metadata.
 * @type {number}
 */
const USER_MSG_OFFSET = 19

/**
 * First index in the array buffer after header (which is the part of metadata).
 * @type {number}
 */
const HEADER_OFFSET = 9

/**
 * Maximum message id number.
 * @type {number}
 */
const MAX_MSG_ID_SIZE = 65535

/**
 * User allowed message type: {@link ArrayBuffer}
 * @type {number}
 */
const ARRAY_BUFFER_TYPE = 1

/**
 * User allowed message type: {@link external:Uint8Array}
 * @type {number}
 */
const U_INT_8_ARRAY_TYPE = 2

/**
 * User allowed message type: {@link external:String}
 * @type {number}
 */
const STRING_TYPE = 3

/**
 * User allowed message type: {@link external:Int8Array}
 * @type {number}
 */
const INT_8_ARRAY_TYPE = 4

/**
 * User allowed message type: {@link external:Uint8ClampedArray}
 * @type {number}
 */
const U_INT_8_CLAMPED_ARRAY_TYPE = 5

/**
 * User allowed message type: {@link external:Int16Array}
 * @type {number}
 */
const INT_16_ARRAY_TYPE = 6

/**
 * User allowed message type: {@link external:Uint16Array}
 * @type {number}
 */
const U_INT_16_ARRAY_TYPE = 7

/**
 * User allowed message type: {@link external:Int32Array}
 * @type {number}
 */
const INT_32_ARRAY_TYPE = 8

/**
 * User allowed message type: {@link external:Uint32Array}
 * @type {number}
 */
const U_INT_32_ARRAY_TYPE = 9

/**
 * User allowed message type: {@link external:Float32Array}
 * @type {number}
 */
const FLOAT_32_ARRAY_TYPE = 10

/**
 * User allowed message type: {@link external:Float64Array}
 * @type {number}
 */
const FLOAT_64_ARRAY_TYPE = 11

/**
 * Buffer for big user messages.
 */
const buffers = new WeakMap()

/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */
export class MessageBuilderService extends Service {
  /**
   * @callback MessageBuilderService~Send
   * @param {ArrayBuffer} dataChunk - If the message is too big this
   * action would be executed for each data chunk until send whole message
   */

   /**
    * @private
    * @typedef {ARRAY_BUFFER_TYPE|U_INT_8_ARRAY_TYPE|STRING_TYPE|INT_8_ARRAY_TYPE|U_INT_8_CLAMPED_ARRAY_TYPE|INT_16_ARRAY_TYPE|U_INT_16_ARRAY_TYPE|INT_32_ARRAY_TYPE|U_INT_32_ARRAY_TYPE|FLOAT_32_ARRAY_TYPE|FLOAT_64_ARRAY_TYPE} MessageTypeEnum
    */

  /**
   * Prepare user message to be sent over the `WebChannel`.
   *
   * @param {UserMessage} data Message to be sent
   * @param {number} senderId Id of the peer who sends this message
   * @param {number} recipientId Id of the recipient peer
   * @param {function(dataChunk: ArrayBuffer)} action Send callback executed for each
   * data chunk if the message is too big
   * @param {boolean} [isBroadcast=true] Equals to true if this message would be
   * sent to all `WebChannel` members and false if only to one member
   */
  handleUserMessage (data, senderId, recipientId, action, isBroadcast = true) {
    const workingData = this.userDataToType(data)
    const dataUint8Array = workingData.content
    if (dataUint8Array.byteLength <= MAX_USER_MSG_SIZE) {
      const dataView = this.initHeader(1, senderId, recipientId,
        dataUint8Array.byteLength + USER_MSG_OFFSET
      )
      dataView.setUint32(HEADER_OFFSET, dataUint8Array.byteLength)
      dataView.setUint8(13, workingData.type)
      dataView.setUint8(14, isBroadcast ? 1 : 0)
      const resultUint8Array = new Uint8Array(dataView.buffer)
      resultUint8Array.set(dataUint8Array, USER_MSG_OFFSET)
      action(resultUint8Array.buffer)
    } else {
      const msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE)
      const totalChunksNb = Math.ceil(dataUint8Array.byteLength / MAX_USER_MSG_SIZE)
      for (let chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
        const currentChunkMsgByteLength = Math.min(
          MAX_USER_MSG_SIZE,
          dataUint8Array.byteLength - MAX_USER_MSG_SIZE * chunkNb
        )
        const dataView = this.initHeader(
          USER_DATA,
          senderId,
          recipientId,
          USER_MSG_OFFSET + currentChunkMsgByteLength
        )
        dataView.setUint32(9, dataUint8Array.byteLength)
        dataView.setUint8(13, workingData.type)
        dataView.setUint8(14, isBroadcast ? 1 : 0)
        dataView.setUint16(15, msgId)
        dataView.setUint16(17, chunkNb)
        const resultUint8Array = new Uint8Array(dataView.buffer)
        let j = USER_MSG_OFFSET
        const startIndex = MAX_USER_MSG_SIZE * chunkNb
        const endIndex = startIndex + currentChunkMsgByteLength
        for (let i = startIndex; i < endIndex; i++) {
          resultUint8Array[j++] = dataUint8Array[i]
        }
        action(resultUint8Array.buffer)
      }
    }
  }

  /**
   * Build a message which can be then sent trough the `Channel`.
   *
   * @param {number} code One of the internal message type code (e.g. {@link
   * USER_DATA})
   * @param {number} [senderId=null]
   * @param {number} [recepientId=null]
   * @param {Object} [data={}] Could be empty if the code is enough
   * @returns {ArrayBuffer} - Built message
   */
  msg (code, senderId = null, recepientId = null, data = {}) {
    const msgEncoded = (new ted.TextEncoder()).encode(JSON.stringify(data))
    const msgSize = msgEncoded.byteLength + HEADER_OFFSET
    const dataView = this.initHeader(code, senderId, recepientId, msgSize)
    const fullMsg = new Uint8Array(dataView.buffer)
    fullMsg.set(msgEncoded, HEADER_OFFSET)
    return fullMsg.buffer
  }

  /**
   * Read user message which was prepared by another peer with
   * {@link MessageBuilderService#handleUserMessage} and sent.
   * @param {WebChannel} wc WebChannel
   * @param {number} senderId Id of the peer who sent this message
   * @param {ArrayBuffer} data Message
   * @param {function(msg: UserMessage, isBroadcast: boolean)} action Callback when the message is ready
   */
  readUserMessage (wc, senderId, data, action) {
    const dataView = new DataView(data)
    const msgSize = dataView.getUint32(HEADER_OFFSET)
    const dataType = dataView.getUint8(13)
    const isBroadcast = dataView.getUint8(14) === 1
    if (msgSize > MAX_USER_MSG_SIZE) {
      const msgId = dataView.getUint16(15)
      const chunk = dataView.getUint16(17)
      const buffer = this.getBuffer(wc, senderId, msgId)
      if (buffer === undefined) {
        this.setBuffer(wc, senderId, msgId,
          new Buffer(msgSize, data, chunk, fullData => {
            action(this.extractUserData(fullData, dataType), isBroadcast)
          })
        )
      } else {
        buffer.add(data, chunk)
      }
    } else {
      const dataArray = new Uint8Array(data)
      const userData = new Uint8Array(data.byteLength - USER_MSG_OFFSET)
      let j = USER_MSG_OFFSET
      for (let i = 0; i < userData.byteLength; i++) {
        userData[i] = dataArray[j++]
      }
      action(this.extractUserData(userData.buffer, dataType), isBroadcast)
    }
  }

  /**
   * Read internal Netflux message.
   * @param {ArrayBuffer} data Message
   * @returns {Object}
   */
  readInternalMessage (data) {
    const uInt8Array = new Uint8Array(data)
    return JSON.parse((new ted.TextDecoder())
      .decode(uInt8Array.subarray(HEADER_OFFSET, uInt8Array.byteLength))
    )
  }

  /**
   * Extract header from the message. Each user message has a header which is
   * a part of the message metadata.
   * @param {ArrayBuffer} data Whole message
   * @returns {MessageHeader}
   */
  readHeader (data) {
    const dataView = new DataView(data)
    return {
      code: dataView.getUint8(0),
      senderId: dataView.getUint32(1),
      recepientId: dataView.getUint32(5)
    }
  }

  /**
   * Create an `ArrayBuffer` and fill in the header.
   * @private
   * @param {number} code Message type code
   * @param {number} senderId Sender peer id
   * @param {number} recipientId Recipient peer id
   * @param {number} dataSize Message size in bytes
   * @return {DataView} Data view with initialized header
   */
  initHeader (code, senderId, recipientId, dataSize) {
    const dataView = new DataView(new ArrayBuffer(dataSize))
    dataView.setUint8(0, code)
    dataView.setUint32(1, senderId)
    dataView.setUint32(5, recipientId)
    return dataView
  }

  /**
   * Netflux sends data in `ArrayBuffer`, but the user can send data in different
   * types. This function retrieve the inital message sent by the user.
   * @private
   * @param {ArrayBuffer} buffer Message as it was received by the `WebChannel`
   * @param {MessageTypeEnum} type Message type as it was defined by the user
   * @returns {ArrayBuffer|TypedArray} Initial user message
   */
  extractUserData (buffer, type) {
    switch (type) {
      case ARRAY_BUFFER_TYPE:
        return buffer
      case U_INT_8_ARRAY_TYPE:
        return new Uint8Array(buffer)
      case STRING_TYPE:
        return new ted.TextDecoder().decode(new Uint8Array(buffer))
      case INT_8_ARRAY_TYPE:
        return new Int8Array(buffer)
      case U_INT_8_CLAMPED_ARRAY_TYPE:
        return new Uint8ClampedArray(buffer)
      case INT_16_ARRAY_TYPE:
        return new Int16Array(buffer)
      case U_INT_16_ARRAY_TYPE:
        return new Uint16Array(buffer)
      case INT_32_ARRAY_TYPE:
        return new Int32Array(buffer)
      case U_INT_32_ARRAY_TYPE:
        return new Uint32Array(buffer)
      case FLOAT_32_ARRAY_TYPE:
        return new Float32Array(buffer)
      case FLOAT_64_ARRAY_TYPE:
        return new Float64Array(buffer)
      default:
        throw new Error('Unknown type')
    }
  }

  /**
   * Identify the user message type.
   *
   * @private
   * @param {UserMessage} data User message
   * @returns {MessageTypeEnum} User message type
   */
  userDataToType (data) {
    const result = {}
    if (data instanceof ArrayBuffer) {
      result.type = ARRAY_BUFFER_TYPE
      result.content = new Uint8Array(data)
    } else if (data instanceof Uint8Array) {
      result.type = U_INT_8_ARRAY_TYPE
      result.content = data
    } else if (typeof data === 'string' || data instanceof String) {
      result.type = STRING_TYPE
      result.content = new ted.TextEncoder().encode(data)
    } else {
      result.content = new Uint8Array(data.buffer)
      if (data instanceof Int8Array) {
        result.type = INT_8_ARRAY_TYPE
      } else if (data instanceof Uint8ClampedArray) {
        result.type = U_INT_8_CLAMPED_ARRAY_TYPE
      } else if (data instanceof Int16Array) {
        result.type = INT_16_ARRAY_TYPE
      } else if (data instanceof Uint16Array) {
        result.type = U_INT_16_ARRAY_TYPE
      } else if (data instanceof Int32Array) {
        result.type = INT_32_ARRAY_TYPE
      } else if (data instanceof Uint32Array) {
        result.type = U_INT_32_ARRAY_TYPE
      } else if (data instanceof Float32Array) {
        result.type = FLOAT_32_ARRAY_TYPE
      } else if (data instanceof Float64Array) {
        result.type = FLOAT_64_ARRAY_TYPE
      } else {
        throw new Error('Unknown data object')
      }
    }
    return result
  }

  /**
   * Get the buffer.
   * @private
   * @param {WebChannel} wc WebChannel
   * @param {number} peerId Peer id
   * @param {number} msgId Message id
   * @returns {Buffer|undefined} Returns buffer if it was found and undefined if not
   */
  getBuffer (wc, peerId, msgId) {
    const wcBuffer = buffers.get(wc)
    if (wcBuffer !== undefined) {
      const peerBuffer = wcBuffer.get(peerId)
      if (peerBuffer !== undefined) {
        return peerBuffer.get(msgId)
      }
    }
    return undefined
  }

  /**
   * Add a new buffer to the buffer array.
   * @private
   * @param {WebChannel} wc WebChannel
   * @param {number} peerId Peer id
   * @param {number} msgId Message id
   * @param {Buffer} buffer
   */
  setBuffer (wc, peerId, msgId, buffer) {
    let wcBuffer = buffers.get(wc)
    if (wcBuffer === undefined) {
      wcBuffer = new Map()
      buffers.set(wc, wcBuffer)
    }
    let peerBuffer = wcBuffer.get(peerId)
    if (peerBuffer === undefined) {
      peerBuffer = new Map()
      wcBuffer.set(peerId, peerBuffer)
    }
    peerBuffer.set(msgId, buffer)
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
  constructor (fullDataSize, data, chunkNb, action) {
    this.fullData = new Uint8Array(fullDataSize)
    this.currentSize = 0
    this.action = action
    this.add(data, chunkNb)
  }

  /**
   * Add a chunk of message to the buffer.
   * @param {ArrayBuffer} data - Message chunk
   * @param {number} chunkNb - Number of the chunk
   */
  add (data, chunkNb) {
    const dataChunk = new Uint8Array(data)
    const dataChunkSize = data.byteLength
    this.currentSize += dataChunkSize - USER_MSG_OFFSET
    let index = chunkNb * MAX_USER_MSG_SIZE
    for (let i = USER_MSG_OFFSET; i < dataChunkSize; i++) {
      this.fullData[index++] = dataChunk[i]
    }
    if (this.currentSize === this.fullData.byteLength) {
      this.action(this.fullData.buffer)
    }
  }
}
