import provide, {MESSAGE_FORMATTER} from './serviceProvider'
import {USER_MSG_BYTE_OFFSET} from './service/MessageFormatterService'

const formatter = provide(MESSAGE_FORMATTER)

class Buffer {
  constructor (totalByteLength, action) {
    this.totalByteLength = totalByteLength
    this.currentByteLength = 0
    this.i8array = new Uint8Array(this.totalByteLength)
    this.action = action
  }

  add (data, chunkNb) {
    const maxSize = formatter.getMaxMsgByteLength()
    let intU8Array = new Uint8Array(data)
    this.currentByteLength += data.byteLength - USER_MSG_BYTE_OFFSET
    let index = chunkNb * maxSize
    for (let i = USER_MSG_BYTE_OFFSET; i < data.byteLength; i++) {
      this.i8array[index++] = intU8Array[i]
    }
    if (this.currentByteLength === this.totalByteLength) {
      this.action(this.i8array)
    }
  }
}

export default Buffer
