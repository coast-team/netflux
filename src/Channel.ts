import { RTCDataChannel } from './misc/env'
import { isBrowser, log, MIN_ID } from './misc/util'
import { channel as proto, IMessage, Message } from './proto'
import { UserMessage } from './service/UserMessage'
import { WebChannel } from './WebChannel'

export interface IChannelInitData {
  members: number[]
}

export const MAXIMUM_MISSED_HEARTBEAT = 3

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
  public static WITH_INTERNAL = 0
  public static WITH_JOINING = 1
  public static WITH_MEMBER = 2

  public static remoteType(type: number) {
    return type === Channel.WITH_INTERNAL
      ? Channel.WITH_INTERNAL
      : type === Channel.WITH_JOINING
        ? Channel.WITH_MEMBER
        : Channel.WITH_JOINING
  }

  public id: number
  public send: (data: Uint8Array) => void
  public type: number
  public missedHeartbeat: number
  public init: Promise<void>
  public initData: IChannelInitData | undefined

  /**
   * Id of the peer who is at the other end of this channel.
   */
  private wsOrDc: any //  WebSocket or RTCDataChannel
  private rtcPeerConnection: RTCPeerConnection | undefined
  private wc: WebChannel
  private heartbeatMsg: Uint8Array
  private resolveInit: () => void

  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   */
  constructor(
    wc: WebChannel,
    wsOrDc: WebSocket | RTCDataChannel,
    type: number,
    id: number,
    rtcPeerConnection?: RTCPeerConnection
  ) {
    log.channel(`New Channel ${type}: Me: ${wc.myId} with ${id}`)
    this.wc = wc
    this.wsOrDc = wsOrDc
    this.type = type
    this.rtcPeerConnection = rtcPeerConnection
    this.missedHeartbeat = 0
    this.heartbeatMsg = new Uint8Array(0)
    this.resolveInit = () => {}

    // Configure `send` function
    if (isBrowser) {
      wsOrDc.binaryType = 'arraybuffer'
      this.send = this.sendInBrowser
    } else if (!this.rtcPeerConnection) {
      this.send = this.sendInNodeOverWebSocket
    } else {
      wsOrDc.binaryType = 'arraybuffer'
      this.send = this.sendInNodeOverDataChannel
    }

    if (type === Channel.WITH_INTERNAL) {
      this.id = id
      this.heartbeatMsg = this.createHeartbeatMsg()
      this.init = Promise.resolve()
      this.initHandlers()
    } else {
      this.id = MIN_ID
      if (type === Channel.WITH_JOINING) {
        this.sendInitPing()
      }
      this.init = new Promise(
        (resolve, reject) =>
          (this.resolveInit = () => {
            this.heartbeatMsg = this.createHeartbeatMsg()
            resolve()
          })
      )
      this.wsOrDc.onmessage = ({ data }: { data: ArrayBuffer }) => {
        try {
          const msg = proto.Message.decode(new Uint8Array(data))
          this.handleInitMessage(msg)
        } catch (err) {
          log.warn('Decode inner Channel message error: ', err)
        }
      }
    }
  }

  get url(): string {
    if (!this.rtcPeerConnection) {
      return (this.wsOrDc as WebSocket).url
    }
    return ''
  }

  encodeAndSend({ senderId = this.wc.myId, recipientId = 0, serviceId, content }: IMessage = {}) {
    this.send(
      Message.encode(Message.create({ senderId, recipientId, serviceId, content })).finish()
    )
  }

  close(): void {
    this.wsOrDc.onmessage = undefined
    this.wsOrDc.onclose = undefined
    this.wsOrDc.onerror = undefined
    if (this.rtcPeerConnection) {
      this.rtcPeerConnection.close()
    } else {
      this.wsOrDc.close(1000)
    }
  }

  sendHeartbeat() {
    this.missedHeartbeat++
    if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
      log.channel(`${this.id} channel closed: too many missed heartbeats`)
      this.wc.topology.onChannelClose(this)
      this.close()
    } else {
      this.send(this.heartbeatMsg)
    }
  }

  private sendInBrowser(data: Uint8Array): void {
    try {
      this.wsOrDc.send(data)
    } catch (err) {
      log.channel('Channel sendInBrowser ERROR', err)
    }
  }

  private sendInNodeOverWebSocket(data: Uint8Array): void {
    try {
      this.wsOrDc.send(data, { binary: true })
    } catch (err) {
      log.channel('Channel sendInNodeOverWebSocket ERROR', err)
    }
  }

  private sendInNodeOverDataChannel(data: Uint8Array): void {
    this.sendInBrowser(data.slice(0))
  }

  private handleInitMessage(msg: proto.Message) {
    switch (msg.type) {
      case 'initPing': {
        log.channel(`${this.wc.myId} received InitPing`)
        const { topology, wcId, senderId, members, key } = msg.initPing as proto.Data
        if (this.wc.topologyEnum !== topology) {
          // TODO: implement when there are more than one topology implementation
          // Reinitialize WebChannel: clean/leave etc.
          // change topology
          log.channel('Different topology. This message should never be shown: something is wrong')
        } else if (members.includes(this.id) && wcId !== this.wc.id) {
          // TODO: this is a rare case, when the joining peer id equals to the
          // one among group members  (the different identifiers insure that
          // the peer was not a member of the group previously)
          // clean/leave
          // generate new Id (this.wc.myId) which is not in members
        }
        this.wc.id = wcId
        this.wc.key = key
        this.id = senderId
        log.channel(`${this.wc.myId} send InitPong`)
        this.send(proto.Message.encode(proto.Message.create({ initPong: this.wc.myId })).finish())
        this.initData = { members }
        this.initHandlers()
        this.resolveInit()
        break
      }
      case 'initPong':
        log.channel(`${this.wc.myId} received InitPong`)
        this.id = msg.initPong
        this.initHandlers()
        this.resolveInit()
        break
      default:
        log.channel(
          `Unknown message type: "${
            msg.type
          }". This message should never be shown: something went wrong`
        )
    }
  }

  private initHandlers() {
    // Configure handlers
    this.wsOrDc.onmessage = ({ data }: { data: ArrayBuffer }) => {
      try {
        const msg = Message.decode(new Uint8Array(data))

        // 0: broadcast message or a message to me
        if (msg.recipientId === 0 || msg.recipientId === this.wc.myId) {
          // User Message
          if (msg.serviceId === UserMessage.SERVICE_ID) {
            const userData = this.wc.userMsg.decodeUserMessage(msg.content, msg.senderId)
            if (userData) {
              this.wc.onMessage(msg.senderId as number, userData)
            }

            // Heartbeat message
          } else if (msg.serviceId === 0) {
            this.missedHeartbeat = 0

            // Service Message
          } else {
            this.wc.streamSubject.next(Object.assign({ channel: this }, msg))
          }
        }
        if (msg.recipientId !== this.wc.myId) {
          this.wc.topology.forward(msg)
        }
      } catch (err) {
        log.warn('Decode general Channel message error: ', err)
      }
    }
    this.wsOrDc.onclose = (evt: Event) => {
      log.channel(`Connection with ${this.id} has closed`, evt)
      this.wc.topology.onChannelClose(this)
    }
    this.wsOrDc.onerror = (evt: Event) => log.channel('Channel error: ', evt)
  }

  private createHeartbeatMsg() {
    return Message.encode(
      Message.create({ serviceId: 0, senderId: this.wc.myId, recipientId: this.id })
    ).finish()
  }

  private sendInitPing() {
    log.channel('initialize...')
    this.send(
      proto.Message.encode(
        proto.Message.create({
          initPing: {
            topology: this.wc.topologyEnum,
            wcId: this.wc.id,
            senderId: this.wc.myId,
            members: this.wc.members,
            key: this.wc.key,
          },
        })
      ).finish()
    )
  }
}
