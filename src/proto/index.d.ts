import * as $protobuf from 'protobufjs'

/** Properties of a Message. */
export interface IMessage {
  /** Message senderId */
  senderId?: number | null

  /** Message recipientId */
  recipientId?: number | null

  /** Message isService */
  isService?: boolean | null

  /** Message content */
  content?: Uint8Array | null
}

/** Represents a Message. */
export class Message implements IMessage {
  /**
   * Constructs a new Message.
   * @param [properties] Properties to set
   */
  constructor(properties?: IMessage)

  /** Message senderId. */
  public senderId: number

  /** Message recipientId. */
  public recipientId: number

  /** Message isService. */
  public isService: boolean

  /** Message content. */
  public content: Uint8Array

  /**
   * Creates a new Message instance using the specified properties.
   * @param [properties] Properties to set
   * @returns Message instance
   */
  public static create(properties?: IMessage): Message

  /**
   * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
   * @param message Message message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: IMessage, writer?: $protobuf.Writer): $protobuf.Writer

  /**
   * Decodes a Message message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns Message
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): Message
}

/** Namespace user. */
export namespace user {
  /** Properties of a Message. */
  interface IMessage {
    /** Message length */
    length?: number | null

    /** Message type */
    type?: user.Message.Type | null

    /** Message full */
    full?: Uint8Array | null

    /** Message chunk */
    chunk?: user.Message.IChunk | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: user.IMessage)

    /** Message length. */
    public length: number

    /** Message type. */
    public type: user.Message.Type

    /** Message full. */
    public full: Uint8Array

    /** Message chunk. */
    public chunk?: user.Message.IChunk | null

    /** Message content. */
    public content?: 'full' | 'chunk'

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: user.IMessage): user.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link user.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: user.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): user.Message
  }

  namespace Message {
    /** Properties of a Chunk. */
    interface IChunk {
      /** Chunk id */
      id?: number | null

      /** Chunk number */
      number?: number | null

      /** Chunk content */
      content?: Uint8Array | null
    }

    /** Represents a Chunk. */
    class Chunk implements IChunk {
      /**
       * Constructs a new Chunk.
       * @param [properties] Properties to set
       */
      constructor(properties?: user.Message.IChunk)

      /** Chunk id. */
      public id: number

      /** Chunk number. */
      public number: number

      /** Chunk content. */
      public content: Uint8Array

      /**
       * Creates a new Chunk instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Chunk instance
       */
      public static create(properties?: user.Message.IChunk): user.Message.Chunk

      /**
       * Encodes the specified Chunk message. Does not implicitly {@link user.Message.Chunk.verify|verify} messages.
       * @param message Chunk message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: user.Message.IChunk, writer?: $protobuf.Writer): $protobuf.Writer

      /**
       * Decodes a Chunk message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Chunk
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): user.Message.Chunk
    }

    /** Type enum. */
    enum Type {
      STRING = 0,
      U_INT_8_ARRAY = 1,
    }
  }
}

/** Namespace service. */
export namespace service {
  /** Properties of a Message. */
  interface IMessage {
    /** Message id */
    id?: number | null

    /** Message content */
    content?: Uint8Array | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: service.IMessage)

    /** Message id. */
    public id: number

    /** Message content. */
    public content: Uint8Array

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: service.IMessage): service.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link service.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: service.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): service.Message
  }
}

/** Namespace webChannel. */
export namespace webChannel {
  /** Properties of a Message. */
  interface IMessage {
    /** Message init */
    init?: webChannel.IInitData | null

    /** Message initOk */
    initOk?: boolean | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: webChannel.IMessage)

    /** Message init. */
    public init?: webChannel.IInitData | null

    /** Message initOk. */
    public initOk: boolean

    /** Message type. */
    public type?: 'init' | 'initOk'

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: webChannel.IMessage): webChannel.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link webChannel.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: webChannel.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): webChannel.Message
  }

  /** Properties of an InitData. */
  interface IInitData {
    /** InitData topology */
    topology?: number | null

    /** InitData wcId */
    wcId?: number | null

    /** InitData generatedIds */
    generatedIds?: number[] | null

    /** InitData members */
    members?: number[] | null
  }

  /** Represents an InitData. */
  class InitData implements IInitData {
    /**
     * Constructs a new InitData.
     * @param [properties] Properties to set
     */
    constructor(properties?: webChannel.IInitData)

    /** InitData topology. */
    public topology: number

    /** InitData wcId. */
    public wcId: number

    /** InitData generatedIds. */
    public generatedIds: number[]

    /** InitData members. */
    public members: number[]

    /**
     * Creates a new InitData instance using the specified properties.
     * @param [properties] Properties to set
     * @returns InitData instance
     */
    public static create(properties?: webChannel.IInitData): webChannel.InitData

    /**
     * Encodes the specified InitData message. Does not implicitly {@link webChannel.InitData.verify|verify} messages.
     * @param message InitData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: webChannel.IInitData, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes an InitData message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns InitData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): webChannel.InitData
  }
}

/** Namespace channelBuilder. */
export namespace channelBuilder {
  /** Properties of a Message. */
  interface IMessage {
    /** Message pair */
    pair?: channelBuilder.IPeerPair | null

    /** Message ping */
    ping?: boolean | null

    /** Message pong */
    pong?: boolean | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: channelBuilder.IMessage)

    /** Message pair. */
    public pair?: channelBuilder.IPeerPair | null

    /** Message ping. */
    public ping: boolean

    /** Message pong. */
    public pong: boolean

    /** Message type. */
    public type?: 'pair' | 'ping' | 'pong'

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: channelBuilder.IMessage): channelBuilder.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link channelBuilder.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: channelBuilder.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): channelBuilder.Message
  }

  /** Properties of a PeerPair. */
  interface IPeerPair {
    /** PeerPair initiator */
    initiator?: channelBuilder.IPeerInfo | null

    /** PeerPair passive */
    passive?: channelBuilder.IPeerInfo | null
  }

  /** Represents a PeerPair. */
  class PeerPair implements IPeerPair {
    /**
     * Constructs a new PeerPair.
     * @param [properties] Properties to set
     */
    constructor(properties?: channelBuilder.IPeerPair)

    /** PeerPair initiator. */
    public initiator?: channelBuilder.IPeerInfo | null

    /** PeerPair passive. */
    public passive?: channelBuilder.IPeerInfo | null

    /**
     * Creates a new PeerPair instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PeerPair instance
     */
    public static create(properties?: channelBuilder.IPeerPair): channelBuilder.PeerPair

    /**
     * Encodes the specified PeerPair message. Does not implicitly {@link channelBuilder.PeerPair.verify|verify} messages.
     * @param message PeerPair message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: channelBuilder.IPeerPair, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a PeerPair message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PeerPair
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): channelBuilder.PeerPair
  }

  /** Properties of a PeerInfo. */
  interface IPeerInfo {
    /** PeerInfo id */
    id?: number | null

    /** PeerInfo wss */
    wss?: string | null

    /** PeerInfo wsSupported */
    wsSupported?: boolean | null

    /** PeerInfo wsTried */
    wsTried?: boolean | null

    /** PeerInfo dcSupported */
    dcSupported?: boolean | null

    /** PeerInfo dcTried */
    dcTried?: boolean | null
  }

  /** Represents a PeerInfo. */
  class PeerInfo implements IPeerInfo {
    /**
     * Constructs a new PeerInfo.
     * @param [properties] Properties to set
     */
    constructor(properties?: channelBuilder.IPeerInfo)

    /** PeerInfo id. */
    public id: number

    /** PeerInfo wss. */
    public wss: string

    /** PeerInfo wsSupported. */
    public wsSupported: boolean

    /** PeerInfo wsTried. */
    public wsTried: boolean

    /** PeerInfo dcSupported. */
    public dcSupported: boolean

    /** PeerInfo dcTried. */
    public dcTried: boolean

    /**
     * Creates a new PeerInfo instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PeerInfo instance
     */
    public static create(properties?: channelBuilder.IPeerInfo): channelBuilder.PeerInfo

    /**
     * Encodes the specified PeerInfo message. Does not implicitly {@link channelBuilder.PeerInfo.verify|verify} messages.
     * @param message PeerInfo message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: channelBuilder.IPeerInfo, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a PeerInfo message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PeerInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): channelBuilder.PeerInfo
  }
}

/** Namespace fullMesh. */
export namespace fullMesh {
  /** Properties of a Message. */
  interface IMessage {
    /** Message membersResponse */
    membersResponse?: fullMesh.IPeers | null

    /** Message membersRequest */
    membersRequest?: boolean | null

    /** Message adjacentMembers */
    adjacentMembers?: fullMesh.IPeers | null

    /** Message heartbeat */
    heartbeat?: boolean | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: fullMesh.IMessage)

    /** Message membersResponse. */
    public membersResponse?: fullMesh.IPeers | null

    /** Message membersRequest. */
    public membersRequest: boolean

    /** Message adjacentMembers. */
    public adjacentMembers?: fullMesh.IPeers | null

    /** Message heartbeat. */
    public heartbeat: boolean

    /** Message type. */
    public type?: 'membersResponse' | 'membersRequest' | 'adjacentMembers' | 'heartbeat'

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: fullMesh.IMessage): fullMesh.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link fullMesh.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: fullMesh.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): fullMesh.Message
  }

  /** Properties of a Peers. */
  interface IPeers {
    /** Peers ids */
    ids?: number[] | null
  }

  /** Represents a Peers. */
  class Peers implements IPeers {
    /**
     * Constructs a new Peers.
     * @param [properties] Properties to set
     */
    constructor(properties?: fullMesh.IPeers)

    /** Peers ids. */
    public ids: number[]

    /**
     * Creates a new Peers instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Peers instance
     */
    public static create(properties?: fullMesh.IPeers): fullMesh.Peers

    /**
     * Encodes the specified Peers message. Does not implicitly {@link fullMesh.Peers.verify|verify} messages.
     * @param message Peers message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: fullMesh.IPeers, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Peers message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Peers
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): fullMesh.Peers
  }
}

/** Namespace webRTCBuilder. */
export namespace webRTCBuilder {
  /** Properties of a Message. */
  interface IMessage {
    /** Message isInitiator */
    isInitiator?: boolean | null

    /** Message offer */
    offer?: string | null

    /** Message answer */
    answer?: string | null

    /** Message iceCandidate */
    iceCandidate?: webRTCBuilder.IIceCandidate | null

    /** Message isError */
    isError?: boolean | null

    /** Message isEnd */
    isEnd?: boolean | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: webRTCBuilder.IMessage)

    /** Message isInitiator. */
    public isInitiator: boolean

    /** Message offer. */
    public offer: string

    /** Message answer. */
    public answer: string

    /** Message iceCandidate. */
    public iceCandidate?: webRTCBuilder.IIceCandidate | null

    /** Message isError. */
    public isError: boolean

    /** Message isEnd. */
    public isEnd: boolean

    /** Message type. */
    public type?: 'offer' | 'answer' | 'iceCandidate' | 'isError' | 'isEnd'

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: webRTCBuilder.IMessage): webRTCBuilder.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link webRTCBuilder.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: webRTCBuilder.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): webRTCBuilder.Message
  }

  /** Properties of an IceCandidate. */
  interface IIceCandidate {
    /** IceCandidate candidate */
    candidate?: string | null

    /** IceCandidate sdpMid */
    sdpMid?: string | null

    /** IceCandidate sdpMLineIndex */
    sdpMLineIndex?: number | null
  }

  /** Represents an IceCandidate. */
  class IceCandidate implements IIceCandidate {
    /**
     * Constructs a new IceCandidate.
     * @param [properties] Properties to set
     */
    constructor(properties?: webRTCBuilder.IIceCandidate)

    /** IceCandidate candidate. */
    public candidate: string

    /** IceCandidate sdpMid. */
    public sdpMid: string

    /** IceCandidate sdpMLineIndex. */
    public sdpMLineIndex: number

    /**
     * Creates a new IceCandidate instance using the specified properties.
     * @param [properties] Properties to set
     * @returns IceCandidate instance
     */
    public static create(properties?: webRTCBuilder.IIceCandidate): webRTCBuilder.IceCandidate

    /**
     * Encodes the specified IceCandidate message. Does not implicitly {@link webRTCBuilder.IceCandidate.verify|verify} messages.
     * @param message IceCandidate message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: webRTCBuilder.IIceCandidate, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes an IceCandidate message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns IceCandidate
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): webRTCBuilder.IceCandidate
  }
}

/** Namespace signaling. */
export namespace signaling {
  /** Properties of a Message. */
  interface IMessage {
    /** Message content */
    content?: signaling.IContent | null

    /** Message isFirst */
    isFirst?: boolean | null

    /** Message stable */
    stable?: boolean | null

    /** Message heartbeat */
    heartbeat?: boolean | null

    /** Message tryAnother */
    tryAnother?: boolean | null
  }

  /** Represents a Message. */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: signaling.IMessage)

    /** Message content. */
    public content?: signaling.IContent | null

    /** Message isFirst. */
    public isFirst: boolean

    /** Message stable. */
    public stable: boolean

    /** Message heartbeat. */
    public heartbeat: boolean

    /** Message tryAnother. */
    public tryAnother: boolean

    /** Message type. */
    public type?: 'content' | 'isFirst' | 'stable' | 'heartbeat' | 'tryAnother'

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: signaling.IMessage): signaling.Message

    /**
     * Encodes the specified Message message. Does not implicitly {@link signaling.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: signaling.IMessage, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): signaling.Message
  }

  /** Properties of a Content. */
  interface IContent {
    /** Content id */
    id?: number | null

    /** Content data */
    data?: Uint8Array | null

    /** Content isError */
    isError?: boolean | null

    /** Content isEnd */
    isEnd?: boolean | null
  }

  /** Represents a Content. */
  class Content implements IContent {
    /**
     * Constructs a new Content.
     * @param [properties] Properties to set
     */
    constructor(properties?: signaling.IContent)

    /** Content id. */
    public id: number

    /** Content data. */
    public data: Uint8Array

    /** Content isError. */
    public isError: boolean

    /** Content isEnd. */
    public isEnd: boolean

    /** Content type. */
    public type?: 'data' | 'isError' | 'isEnd'

    /**
     * Creates a new Content instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Content instance
     */
    public static create(properties?: signaling.IContent): signaling.Content

    /**
     * Encodes the specified Content message. Does not implicitly {@link signaling.Content.verify|verify} messages.
     * @param message Content message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: signaling.IContent, writer?: $protobuf.Writer): $protobuf.Writer

    /**
     * Decodes a Content message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Content
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): signaling.Content
  }
}
