/**
 * Message builder module is responsible to build messages to send them over the
 * *WebChannel* and treat messages received by the *WebChannel*. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 *
 * @module messageBuilder
 */
import {ServiceInterface} from './service'

/**
 * Maximum message size sent over *Channel*.
 * @type {number}
 */
const MAX_MSG_SIZE = 16384

/**
 * Maximum user message size sent over *Channel*. Is meant without metadata.
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
 * User allowed message type: {@link external:ArrayBuffer}
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
 * User allowed message type: {@link external:DataView}
 * @type {number}
 */
const DATA_VIEW_TYPE = 12

/**
 * Buffer for big user messages.
 */
const buffers = new Map()

/**
 * Message builder service class.
 */
class MessageBuilderService extends ServiceInterface {

  /**
   * @callback MessageBuilderService~Send
   * @param {external:ArrayBuffer} dataChunk - If the message is too big this
   * action would be executed for each data chunk until send whole message
   */

  /**
   * @callback MessageBuilderService~Receive
   * @param {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} data - Message.
   * Its type depends on what other
   */

  /**
   * Header of the metadata of the messages sent/received over the *WebChannel*.
   * @typedef {Object} MessageBuilderService~Header
   * @property {number} code - Message type code
   * @property {number} senderId - Id of the sender peer
   * @property {number} recipientId - Id of the recipient peer
   */

  constructor () {
    super()
    this.TextEncoder
    this.TextDecoder
    if (typeof window === 'undefined') this.TextEncoder = require('text-encoding').TextEncoder
    else this.TextEncoder = window.TextEncoder
    if (typeof window === 'undefined') this.TextDecoder = require('text-encoding').TextDecoder
    else this.TextDecoder = window.TextDecoder
  }

  /**
   * Prepare user message to be sent over the *WebChannel*
   * @param {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} data -
   * Message to be sent
   * @param {number} senderId - Id of the peer who sends this message
   * @param {number} recipientId - Id of the recipient peer
   * @param {MessageBuilderService~Send} action - Send callback executed for each
   * data chunk if the message is too big
   * @param {boolean} isBroadcast - Equals to true if this message would be
   * sent to all *WebChannel* members and false if only to one member
   */
  handleUserMessage (data, recipientId, action, isBroadcast = true) {
    let workingData = this.userDataToType(data)
    let dataUint8Array = workingData.content
    if (dataUint8Array.byteLength <= MAX_USER_MSG_SIZE) {
      let dataView = this.initHeader(1, recipientId,
        dataUint8Array.byteLength + USER_MSG_OFFSET
      )
      dataView.setUint32(HEADER_OFFSET, dataUint8Array.byteLength)
      dataView.setUint8(13, workingData.type)
      dataView.setUint8(14, isBroadcast ? 1 : 0)
      let resultUint8Array = new Uint8Array(dataView.buffer)
      resultUint8Array.set(dataUint8Array, USER_MSG_OFFSET)
      action(resultUint8Array.buffer)
    } else {
      const msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE)
      const totalChunksNb = Math.ceil(dataUint8Array.byteLength / MAX_USER_MSG_SIZE)
      for (let chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
        let currentChunkMsgByteLength = Math.min(
          MAX_USER_MSG_SIZE,
          dataUint8Array.byteLength - MAX_USER_MSG_SIZE * chunkNb
        )
        let dataView = this.initHeader(
          1,
          recipientId,
          USER_MSG_OFFSET + currentChunkMsgByteLength
        )
        dataView.setUint32(9, dataUint8Array.byteLength)
        dataView.setUint8(13, workingData.type)
        dataView.setUint8(14, isBroadcast ? 1 : 0)
        dataView.setUint16(15, msgId)
        dataView.setUint16(17, chunkNb)
        let resultUint8Array = new Uint8Array(dataView.buffer)
        let j = USER_MSG_OFFSET
        let startIndex = MAX_USER_MSG_SIZE * chunkNb
        let endIndex = startIndex + currentChunkMsgByteLength
        for (let i = startIndex; i < endIndex; i++) {
          resultUint8Array[j++] = dataUint8Array[i]
        }
        action(resultUint8Array.buffer)
      }
    }
  }

  /**
   * Build a message which can be then sent trough the *Channel*.
   * @param {number} code - One of the internal message type code (e.g. {@link
   * USER_DATA})
   * @param {Object} [data={}] - Message. Could be empty if the code is enough
   * @returns {external:ArrayBuffer} - Built message
   */
  msg (code, data = {}, recepientId = null) {
    let msgEncoded = (new this.TextEncoder()).encode(JSON.stringify(data))
    let msgSize = msgEncoded.byteLength + HEADER_OFFSET
    let dataView = this.initHeader(code, recepientId, msgSize)
    let fullMsg = new Uint8Array(dataView.buffer)
    fullMsg.set(msgEncoded, HEADER_OFFSET)
    return fullMsg.buffer
  }

  /**
   * Read user message which was prepared by another peer with
   * {@link MessageBuilderService#handleUserMessage} and sent.
   * @param {number} wcId - *WebChannel* identifier
   * @param {number} senderId - Id of the peer who sent this message
   * @param {external:ArrayBuffer} data - Message
   * @param {MessageBuilderService~Receive} action - Callback when the message is
   * ready
   */
  readUserMessage (wcId, senderId, data, action) {
    let dataView = new DataView(data)
    let msgSize = dataView.getUint32(HEADER_OFFSET)
    let dataType = dataView.getUint8(13)
    let isBroadcast = dataView.getUint8(14)
    if (msgSize > MAX_USER_MSG_SIZE) {
      let msgId = dataView.getUint16(15)
      let chunk = dataView.getUint16(17)
      let buffer = this.getBuffer(wcId, senderId, msgId)
      if (buffer === undefined) {
        this.setBuffer(wcId, senderId, msgId,
          new Buffer(msgSize, data, chunk, (fullData) => {
            action(this.extractUserData(fullData, dataType), isBroadcast)
          })
        )
      } else {
        buffer.add(data, chunk)
      }
    } else {
      let dataArray = new Uint8Array(data)
      let userData = new Uint8Array(data.byteLength - USER_MSG_OFFSET)
      let j = USER_MSG_OFFSET
      for (let i in userData) {
        userData[i] = dataArray[j++]
      }
      action(this.extractUserData(userData.buffer, dataType), isBroadcast)
    }
  }

  /**
   * Read internal Netflux message.
   * @param {external:ArrayBuffer} data - Message
   * @returns {Object}
   */
  readInternalMessage (data) {
    let uInt8Array = new Uint8Array(data)
    return JSON.parse((new this.TextDecoder())
      .decode(uInt8Array.subarray(HEADER_OFFSET, uInt8Array.byteLength))
    )
  }

  /**
   * Extract header from the message. Each user message has a header which is
   * a part of the message metadata.
   * TODO: add header also to the internal messages.
   * @param {external:ArrayBuffer} data - Whole message
   * @returns {MessageBuilderService~Header}
   */
  readHeader (data) {
    let dataView = new DataView(data)
    return {
      code: dataView.getUint8(0),
      senderId: dataView.getUint32(1),
      recepientId: dataView.getUint32(5)
    }
  }

  /**
   * Complete header of the message to be sent by setting sender peer id.
   * @param  {external.ArrayBuffer} buffer - Message to be sent
   * @param  {number} senderId - Id of the sender peer
   */
  completeHeader (buffer, senderId) {
    new DataView(buffer).setInt32(1, senderId)
  }

  /**
   * Create an *ArrayBuffer* and fill in the header.
   * @private
   * @param {number} code - Message type code
   * @param {number} senderId - Sender peer id
   * @param {number} recipientId - Recipient peer id
   * @param {number} dataSize - Message size in bytes
   * @return {external:DataView} - Data view with initialized header
   */
  initHeader (code, recipientId, dataSize) {
    let dataView = new DataView(new ArrayBuffer(dataSize))
    dataView.setUint8(0, code)
    //dataView.setUint32(1, senderId)
    dataView.setUint32(5, recipientId)
    return dataView
  }

  /**
   * Netflux sends data in *ArrayBuffer*, but the user can send data in different
   * types. This function retrieve the inital message sent by the user.
   * @private
   * @param {external:ArrayBuffer} - Message as it was received by the *WebChannel*
   * @param {number} - Message type as it was defined by the user
   * @returns {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} - Initial
   * user message
   */
  extractUserData (buffer, type) {
    switch (type) {
      case ARRAY_BUFFER_TYPE:
        return buffer
      case U_INT_8_ARRAY_TYPE:
        return new Uint8Array(buffer)
      case STRING_TYPE:
        return new this.TextDecoder().decode(new Uint8Array(buffer))
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
      case DATA_VIEW_TYPE:
        return new DataView(buffer)
    }
  }

  /**
   * Identify the user message type.
   * @private
   * @param {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} - User message
   * @returns {number} - User message type
   */
  userDataToType (data) {
    let result = {}
    if (data instanceof ArrayBuffer) {
      result.type = ARRAY_BUFFER_TYPE
      result.content = new Uint8Array(data)
    } else if (data instanceof Uint8Array) {
      result.type = U_INT_8_ARRAY_TYPE
      result.content = data
    } else if (typeof data === 'string' || data instanceof String) {
      result.type = STRING_TYPE
      result.content = new this.TextEncoder().encode(data)
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
      } else if (data instanceof DataView) {
        result.type = DATA_VIEW_TYPE
      } else {
        throw new Error('Unknown data object')
      }
    }
    return result
  }

  /**
   * Get the buffer.
   * @private
   * @param {number} wcId - *WebChannel* id
   * @param {number} peerId - Peer id
   * @param {number} msgId - Message id
   * @returns {Buffer|undefined} - Returns buffer if it was found and undefined
   * if not
   */
  getBuffer (wcId, peerId, msgId) {
    let wcBuffer = buffers.get(wcId)
    if (wcBuffer !== undefined) {
      let peerBuffer = wcBuffer.get(peerId)
      if (peerBuffer !== undefined) {
        return peerBuffer.get(msgId)
      }
    }
    return undefined
  }

  /**
   * Add a new buffer to the buffer array.
   * @private
   * @param {number} wcId - *WebChannel* id
   * @param {number} peerId - Peer id
   * @param {number} msgId - Message id
   * @param {Buffer} - buffer
   */
  setBuffer (wcId, peerId, msgId, buffer) {
    let wcBuffer = buffers.get(wcId)
    if (wcBuffer === undefined) {
      wcBuffer = new Map()
      buffers.set(wcId, wcBuffer)
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
 * may be sent over a *Channel*. Each buffer is identified by *WebChannel* id,
 * peer id (who sends the big message) and message id (in case if the peer sends
 * more then 1 big message at a time).
 */
class Buffer {

  /**
   * @callback Buffer~onFullMessage
   * @param {external:ArrayBuffer} - The full message as it was initially sent
   * by user
   */

  /**
   * @param {number} fullDataSize - The total user message size
   * @param {external:ArrayBuffer} - The first chunk of the user message
   * @param {Buffer~onFullMessage} action - Callback to be executed when all
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
   * @param {external:ArrayBuffer} data - Message chunk
   * @param {number} chunkNb - Number of the chunk
   */
  add (data, chunkNb) {
    let dataChunk = new Uint8Array(data)
    let dataChunkSize = data.byteLength
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

export default MessageBuilderService
