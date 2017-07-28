import { Channel } from '../Channel'

export interface Message {
  senderId: number,
  recipientId: number,
  isService: boolean,
  content: Uint8Array
}

export interface ServiceMessageEncoded {
  channel: Channel,
  senderId: number,
  recipientId: number,
  id: number,
  timestamp: number,
  content: Uint8Array
}

export interface ServiceMessageDecoded {
  channel: Channel,
  senderId: number,
  recipientId: number,
  timestamp: number,
  msg: object
}
