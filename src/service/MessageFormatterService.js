import * as service from './service'

// Max message size sent on Channel: 16kb
export const MAX_CHANNEL_MSG_BYTE_SIZE = 16384

export const USER_MSG_BYTE_OFFSET = 18

export const STRING_TYPE = 100

export const UINT8ARRAY_TYPE = 101

export const ARRAYBUFFER_TYPE = 102

class MessageFormatter extends service.Interface {
  splitUserMessage (data, code, senderId, recipientId, action) {
    const dataType = this.getDataType(data)
    let uInt8Array
    switch (dataType) {
      case STRING_TYPE:
        uInt8Array = new TextEncoder().encode(data)
        break
      case UINT8ARRAY_TYPE:
        uInt8Array = data
        break
      case ARRAYBUFFER_TYPE:
        uInt8Array = new Uint8Array(data)
        break
      default:
        return
    }

    const maxUserDataLength = this.getMaxMsgByteLength()
    const msgId = this.generateMsgId()
    const totalChunksNb = Math.ceil(uInt8Array.byteLength / maxUserDataLength)
    for (let chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
      let chunkMsgByteLength = Math.min(maxUserDataLength, uInt8Array.byteLength - maxUserDataLength * chunkNb)
      let index = maxUserDataLength * chunkNb
      let totalChunkByteLength = USER_MSG_BYTE_OFFSET + chunkMsgByteLength
      let dataView = new DataView(new ArrayBuffer(totalChunkByteLength))
      dataView.setUint8(0, code)
      dataView.setUint8(1, dataType)
      dataView.setUint32(2, senderId)
      dataView.setUint32(6, recipientId)
      dataView.setUint16(10, msgId)
      dataView.setUint32(12, uInt8Array.byteLength)
      dataView.setUint16(16, chunkNb)
      let resultUint8Array = new Uint8Array(dataView.buffer)
      let j = USER_MSG_BYTE_OFFSET
      for (let i = index; i < index + chunkMsgByteLength; i++) {
        resultUint8Array[j++] = uInt8Array[i]
      }
      action(resultUint8Array)
    }
  }

  msg (code, data = {}) {
    let msgEncoded = (new TextEncoder()).encode(JSON.stringify(data))
    let i8array = new Uint8Array(1 + msgEncoded.length)
    i8array[0] = code
    let index = 1
    for (let i in msgEncoded) {
      i8array[index++] = msgEncoded[i]
    }
    return i8array
  }

  getMaxMsgByteLength () {
    return MAX_CHANNEL_MSG_BYTE_SIZE - USER_MSG_BYTE_OFFSET
  }

  generateMsgId () {
    const MAX = 16777215
    return Math.round(Math.random() * MAX)
  }

  getDataType (data) {
    if (typeof data === 'string' || data instanceof String) {
      return STRING_TYPE
    } else if (data instanceof Uint8Array) {
      return UINT8ARRAY_TYPE
    } else if (data instanceof ArrayBuffer) {
      return ARRAYBUFFER_TYPE
    }
    return 0
  }
}

export default MessageFormatter
