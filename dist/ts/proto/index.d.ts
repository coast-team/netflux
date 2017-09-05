import * as $protobuf from "protobufjs";

/** Properties of a Message. */
export interface IMessage {

    /** Message senderId */
    senderId?: number;

    /** Message recipientId */
    recipientId?: number;

    /** Message isService */
    isService?: boolean;

    /** Message content */
    content?: Uint8Array;
}

/** Represents a Message. */
export class Message {

    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMessage);

    /** Message senderId. */
    public senderId: number;

    /** Message recipientId. */
    public recipientId: number;

    /** Message isService. */
    public isService: boolean;

    /** Message content. */
    public content: Uint8Array;

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: IMessage): Message;

    /**
     * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Message;
}

/** Namespace user. */
export namespace user {

    /** Properties of a Message. */
    interface IMessage {

        /** Message length */
        length?: number;

        /** Message type */
        type?: user.Message.Type;

        /** Message full */
        full?: Uint8Array;

        /** Message chunk */
        chunk?: user.Message.IChunk;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: user.IMessage);

        /** Message length. */
        public length: number;

        /** Message type. */
        public type: user.Message.Type;

        /** Message full. */
        public full: Uint8Array;

        /** Message chunk. */
        public chunk?: (user.Message.IChunk|null);

        /** Message content. */
        public content?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: user.IMessage): user.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link user.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: user.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): user.Message;
    }

    namespace Message {

        /** Properties of a Chunk. */
        interface IChunk {

            /** Chunk id */
            id?: number;

            /** Chunk number */
            number?: number;

            /** Chunk content */
            content?: Uint8Array;
        }

        /** Represents a Chunk. */
        class Chunk {

            /**
             * Constructs a new Chunk.
             * @param [properties] Properties to set
             */
            constructor(properties?: user.Message.IChunk);

            /** Chunk id. */
            public id: number;

            /** Chunk number. */
            public number: number;

            /** Chunk content. */
            public content: Uint8Array;

            /**
             * Creates a new Chunk instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Chunk instance
             */
            public static create(properties?: user.Message.IChunk): user.Message.Chunk;

            /**
             * Encodes the specified Chunk message. Does not implicitly {@link user.Message.Chunk.verify|verify} messages.
             * @param message Chunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: user.Message.IChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Chunk message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Chunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): user.Message.Chunk;
        }

        /** Type enum. */
        enum Type {
            STRING = 0,
            U_INT_8_ARRAY = 1
        }
    }
}

/** Namespace service. */
export namespace service {

    /** Properties of a Message. */
    interface IMessage {

        /** Message id */
        id?: number;

        /** Message content */
        content?: Uint8Array;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: service.IMessage);

        /** Message id. */
        public id: number;

        /** Message content. */
        public content: Uint8Array;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: service.IMessage): service.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link service.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: service.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): service.Message;
    }
}

/** Namespace webChannel. */
export namespace webChannel {

    /** Properties of a Message. */
    interface IMessage {

        /** Message init */
        init?: webChannel.IInitData;

        /** Message initOk */
        initOk?: webChannel.IPeers;

        /** Message ping */
        ping?: boolean;

        /** Message pong */
        pong?: boolean;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: webChannel.IMessage);

        /** Message init. */
        public init?: (webChannel.IInitData|null);

        /** Message initOk. */
        public initOk?: (webChannel.IPeers|null);

        /** Message ping. */
        public ping: boolean;

        /** Message pong. */
        public pong: boolean;

        /** Message type. */
        public type?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: webChannel.IMessage): webChannel.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link webChannel.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: webChannel.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webChannel.Message;
    }

    /** Properties of an InitData. */
    interface IInitData {

        /** InitData topology */
        topology?: number;

        /** InitData wcId */
        wcId?: number;

        /** InitData generatedIds */
        generatedIds?: number[];
    }

    /** Represents an InitData. */
    class InitData {

        /**
         * Constructs a new InitData.
         * @param [properties] Properties to set
         */
        constructor(properties?: webChannel.IInitData);

        /** InitData topology. */
        public topology: number;

        /** InitData wcId. */
        public wcId: number;

        /** InitData generatedIds. */
        public generatedIds: number[];

        /**
         * Creates a new InitData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns InitData instance
         */
        public static create(properties?: webChannel.IInitData): webChannel.InitData;

        /**
         * Encodes the specified InitData message. Does not implicitly {@link webChannel.InitData.verify|verify} messages.
         * @param message InitData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: webChannel.IInitData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an InitData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns InitData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webChannel.InitData;
    }

    /** Properties of a Peers. */
    interface IPeers {

        /** Peers members */
        members?: number[];
    }

    /** Represents a Peers. */
    class Peers {

        /**
         * Constructs a new Peers.
         * @param [properties] Properties to set
         */
        constructor(properties?: webChannel.IPeers);

        /** Peers members. */
        public members: number[];

        /**
         * Creates a new Peers instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Peers instance
         */
        public static create(properties?: webChannel.IPeers): webChannel.Peers;

        /**
         * Encodes the specified Peers message. Does not implicitly {@link webChannel.Peers.verify|verify} messages.
         * @param message Peers message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: webChannel.IPeers, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Peers message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Peers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webChannel.Peers;
    }
}

/** Namespace channelBuilder. */
export namespace channelBuilder {

    /** Properties of a Message. */
    interface IMessage {

        /** Message request */
        request?: channelBuilder.IConnection;

        /** Message response */
        response?: channelBuilder.IConnection;

        /** Message failed */
        failed?: string;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.IMessage);

        /** Message request. */
        public request?: (channelBuilder.IConnection|null);

        /** Message response. */
        public response?: (channelBuilder.IConnection|null);

        /** Message failed. */
        public failed: string;

        /** Message type. */
        public type?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: channelBuilder.IMessage): channelBuilder.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link channelBuilder.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channelBuilder.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channelBuilder.Message;
    }

    /** Properties of a Connection. */
    interface IConnection {

        /** Connection wsUrl */
        wsUrl?: string;

        /** Connection isWrtcSupport */
        isWrtcSupport?: boolean;
    }

    /** Represents a Connection. */
    class Connection {

        /**
         * Constructs a new Connection.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.IConnection);

        /** Connection wsUrl. */
        public wsUrl: string;

        /** Connection isWrtcSupport. */
        public isWrtcSupport: boolean;

        /**
         * Creates a new Connection instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Connection instance
         */
        public static create(properties?: channelBuilder.IConnection): channelBuilder.Connection;

        /**
         * Encodes the specified Connection message. Does not implicitly {@link channelBuilder.Connection.verify|verify} messages.
         * @param message Connection message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channelBuilder.IConnection, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Connection message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Connection
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channelBuilder.Connection;
    }
}

/** Namespace fullMesh. */
export namespace fullMesh {

    /** Properties of a Message. */
    interface IMessage {

        /** Message connectTo */
        connectTo?: fullMesh.IPeers;

        /** Message connectedTo */
        connectedTo?: fullMesh.IPeers;

        /** Message joiningPeerId */
        joiningPeerId?: number;

        /** Message joinSucceed */
        joinSucceed?: boolean;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: fullMesh.IMessage);

        /** Message connectTo. */
        public connectTo?: (fullMesh.IPeers|null);

        /** Message connectedTo. */
        public connectedTo?: (fullMesh.IPeers|null);

        /** Message joiningPeerId. */
        public joiningPeerId: number;

        /** Message joinSucceed. */
        public joinSucceed: boolean;

        /** Message type. */
        public type?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: fullMesh.IMessage): fullMesh.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link fullMesh.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: fullMesh.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): fullMesh.Message;
    }

    /** Properties of a Peers. */
    interface IPeers {

        /** Peers members */
        members?: number[];
    }

    /** Represents a Peers. */
    class Peers {

        /**
         * Constructs a new Peers.
         * @param [properties] Properties to set
         */
        constructor(properties?: fullMesh.IPeers);

        /** Peers members. */
        public members: number[];

        /**
         * Creates a new Peers instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Peers instance
         */
        public static create(properties?: fullMesh.IPeers): fullMesh.Peers;

        /**
         * Encodes the specified Peers message. Does not implicitly {@link fullMesh.Peers.verify|verify} messages.
         * @param message Peers message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: fullMesh.IPeers, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Peers message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Peers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): fullMesh.Peers;
    }
}

/** Namespace webRTCBuilder. */
export namespace webRTCBuilder {

    /** Properties of a Message. */
    interface IMessage {

        /** Message isInitiator */
        isInitiator?: boolean;

        /** Message offer */
        offer?: string;

        /** Message answer */
        answer?: string;

        /** Message iceCandidate */
        iceCandidate?: webRTCBuilder.IIceCandidate;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: webRTCBuilder.IMessage);

        /** Message isInitiator. */
        public isInitiator: boolean;

        /** Message offer. */
        public offer: string;

        /** Message answer. */
        public answer: string;

        /** Message iceCandidate. */
        public iceCandidate?: (webRTCBuilder.IIceCandidate|null);

        /** Message type. */
        public type?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: webRTCBuilder.IMessage): webRTCBuilder.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link webRTCBuilder.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: webRTCBuilder.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webRTCBuilder.Message;
    }

    /** Properties of an IceCandidate. */
    interface IIceCandidate {

        /** IceCandidate candidate */
        candidate?: string;

        /** IceCandidate sdpMid */
        sdpMid?: string;

        /** IceCandidate sdpMLineIndex */
        sdpMLineIndex?: number;
    }

    /** Represents an IceCandidate. */
    class IceCandidate {

        /**
         * Constructs a new IceCandidate.
         * @param [properties] Properties to set
         */
        constructor(properties?: webRTCBuilder.IIceCandidate);

        /** IceCandidate candidate. */
        public candidate: string;

        /** IceCandidate sdpMid. */
        public sdpMid: string;

        /** IceCandidate sdpMLineIndex. */
        public sdpMLineIndex: number;

        /**
         * Creates a new IceCandidate instance using the specified properties.
         * @param [properties] Properties to set
         * @returns IceCandidate instance
         */
        public static create(properties?: webRTCBuilder.IIceCandidate): webRTCBuilder.IceCandidate;

        /**
         * Encodes the specified IceCandidate message. Does not implicitly {@link webRTCBuilder.IceCandidate.verify|verify} messages.
         * @param message IceCandidate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: webRTCBuilder.IIceCandidate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an IceCandidate message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns IceCandidate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webRTCBuilder.IceCandidate;
    }
}

/** Namespace signaling. */
export namespace signaling {

    /** Properties of a Message. */
    interface IMessage {

        /** Message content */
        content?: signaling.IContent;

        /** Message isFirst */
        isFirst?: boolean;

        /** Message joined */
        joined?: boolean;

        /** Message ping */
        ping?: boolean;

        /** Message pong */
        pong?: boolean;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: signaling.IMessage);

        /** Message content. */
        public content?: (signaling.IContent|null);

        /** Message isFirst. */
        public isFirst: boolean;

        /** Message joined. */
        public joined: boolean;

        /** Message ping. */
        public ping: boolean;

        /** Message pong. */
        public pong: boolean;

        /** Message type. */
        public type?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: signaling.IMessage): signaling.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link signaling.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: signaling.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): signaling.Message;
    }

    /** Properties of a Content. */
    interface IContent {

        /** Content id */
        id?: number;

        /** Content isEnd */
        isEnd?: boolean;

        /** Content data */
        data?: Uint8Array;

        /** Content isError */
        isError?: boolean;
    }

    /** Represents a Content. */
    class Content {

        /**
         * Constructs a new Content.
         * @param [properties] Properties to set
         */
        constructor(properties?: signaling.IContent);

        /** Content id. */
        public id: number;

        /** Content isEnd. */
        public isEnd: boolean;

        /** Content data. */
        public data: Uint8Array;

        /** Content isError. */
        public isError: boolean;

        /** Content type. */
        public type?: string;

        /**
         * Creates a new Content instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Content instance
         */
        public static create(properties?: signaling.IContent): signaling.Content;

        /**
         * Encodes the specified Content message. Does not implicitly {@link signaling.Content.verify|verify} messages.
         * @param message Content message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: signaling.IContent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Content message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Content
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): signaling.Content;
    }
}
