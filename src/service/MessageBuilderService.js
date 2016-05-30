import {ServiceInterface} from './service'

// Max message size sent on Channel: 16kb
const MAX_MSG_SIZE = 16384

const MAX_USER_MSG_SIZE = 16365

const USER_MSG_OFFSET = 19

const HEADER_OFFSET = 9

const MAX_MSG_ID_SIZE = 65535

const ARRAY_BUFFER_TYPE = 1
const U_INT_8_ARRAY_TYPE = 2
const STRING_TYPE = 3
const INT_8_ARRAY_TYPE = 4
const U_INT_8_CLAMPED_ARRAY_TYPE = 5
const INT_16_ARRAY_TYPE = 6
const U_INT_16_ARRAY_TYPE = 7
const INT_32_ARRAY_TYPE = 8
const U_INT_32_ARRAY_TYPE = 9
const FLOAT_32_ARRAY_TYPE = 10
const FLOAT_64_ARRAY_TYPE = 11
const DATA_VIEW_TYPE = 12

const buffers = new Map()

class MessageBuilderService extends ServiceInterface {

  constructor () {
    super()
  }

  handleUserMessage (data, senderId, recipientId, action, isBroadcast = true) {
    let workingData = this.userDataToType(data)
    let dataUint8Array = workingData.content
    if (dataUint8Array.byteLength <= MAX_USER_MSG_SIZE) {
      let dataView = this.writeHeader(1, senderId, recipientId,
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
        let dataView = this.writeHeader(
          1,
          senderId,
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

  msg (code, data = {}) {
    let msgEncoded = (new TextEncoder()).encode(JSON.stringify(data))
    let msgSize = msgEncoded.byteLength + HEADER_OFFSET
    let dataView = this.writeHeader(code, null, null, msgSize)
    let fullMsg = new Uint8Array(dataView.buffer)
    fullMsg.set(msgEncoded, HEADER_OFFSET)
    return fullMsg
  }

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

  readInternalMessage (data) {
    let uInt8Array = new Uint8Array(data)
    return JSON.parse((new TextDecoder())
      .decode(uInt8Array.subarray(HEADER_OFFSET, uInt8Array.byteLength))
    )
  }

  readHeader (data) {
    let dataView = new DataView(data)
    return {
      code: dataView.getUint8(0),
      senderId: dataView.getUint32(1),
      recepientId: dataView.getUint32(5)
    }
  }

  writeHeader (code, senderId, recipientId, dataSize) {
    let dataView = new DataView(new ArrayBuffer(dataSize))
    dataView.setUint8(0, code)
    dataView.setUint32(1, senderId)
    dataView.setUint32(5, recipientId)
    return dataView
  }

  extractUserData (buffer, type) {
    switch (type) {
      case ARRAY_BUFFER_TYPE:
        return buffer
      case U_INT_8_ARRAY_TYPE:
        return new Uint8Array(buffer)
      case STRING_TYPE:
        return new TextDecoder().decode(new Uint8Array(buffer))
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
      result.content = new TextEncoder().encode(data)
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

class Buffer {
  constructor (fullDataSize, data, chunkNb, action) {
    this.fullData = new Uint8Array(fullDataSize)
    this.currentSize = 0
    this.action = action
    this.add(data, chunkNb)
  }

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

export {MessageBuilderService, MAX_MSG_SIZE, MAX_USER_MSG_SIZE, USER_MSG_OFFSET, HEADER_OFFSET}
