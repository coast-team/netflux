import * as $protobuf from "protobufjs";

/** Properties of a Message. */
export interface IMessage {

    /** Message senderId */
    senderId?: (number|null);

    /** Message recipientId */
    recipientId?: (number|null);

    /** Message isService */
    isService?: (boolean|null);

    /** Message content */
    content?: (Uint8Array|null);
}

/** Represents a Message. */
export class Message implements IMessage {

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
        length?: (number|null);

        /** Message type */
        type?: (user.Message.Type|null);

        /** Message full */
        full?: (Uint8Array|null);

        /** Message chunk */
        chunk?: (user.Message.IChunk|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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
        public content?: ("full"|"chunk");

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
            id?: (number|null);

            /** Chunk number */
            number?: (number|null);

            /** Chunk content */
            content?: (Uint8Array|null);
        }

        /** Represents a Chunk. */
        class Chunk implements IChunk {

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
        id?: (number|null);

        /** Message content */
        content?: (Uint8Array|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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
        init?: (webChannel.IInitData|null);

        /** Message initOk */
        initOk?: (webChannel.IPeers|null);

        /** Message ping */
        ping?: (boolean|null);

        /** Message pong */
        pong?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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
        public type?: ("init"|"initOk"|"ping"|"pong");

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
        topology?: (number|null);

        /** InitData wcId */
        wcId?: (number|null);

        /** InitData generatedIds */
        generatedIds?: (number[]|null);
    }

    /** Represents an InitData. */
    class InitData implements IInitData {

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
        members?: (number[]|null);
    }

    /** Represents a Peers. */
    class Peers implements IPeers {

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

/** Namespace channel. */
export namespace channel {

    /** Properties of a Message. */
    interface IMessage {

        /** Message heartbeat */
        heartbeat?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: channel.IMessage);

        /** Message heartbeat. */
        public heartbeat: boolean;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: channel.IMessage): channel.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link channel.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channel.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channel.Message;
    }
}

/** Namespace channelBuilder. */
export namespace channelBuilder {

    /** Properties of a Message. */
    interface IMessage {

        /** Message request */
        request?: (channelBuilder.IConnection|null);

        /** Message response */
        response?: (channelBuilder.IConnection|null);

        /** Message failed */
        failed?: (string|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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
        public type?: ("request"|"response"|"failed");

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
        wsUrl?: (string|null);

        /** Connection isWrtcSupport */
        isWrtcSupport?: (boolean|null);
    }

    /** Represents a Connection. */
    class Connection implements IConnection {

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
        connectTo?: (fullMesh.IPeers|null);

        /** Message connectedTo */
        connectedTo?: (fullMesh.IPeers|null);

        /** Message joiningPeerId */
        joiningPeerId?: (number|null);

        /** Message joinSucceed */
        joinSucceed?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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
        public type?: ("connectTo"|"connectedTo"|"joiningPeerId"|"joinSucceed");

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
        members?: (number[]|null);
    }

    /** Represents a Peers. */
    class Peers implements IPeers {

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
        isInitiator?: (boolean|null);

        /** Message offer */
        offer?: (string|null);

        /** Message answer */
        answer?: (string|null);

        /** Message iceCandidate */
        iceCandidate?: (webRTCBuilder.IIceCandidate|null);

        /** Message isError */
        isError?: (boolean|null);

        /** Message isEnd */
        isEnd?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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

        /** Message isError. */
        public isError: boolean;

        /** Message isEnd. */
        public isEnd: boolean;

        /** Message type. */
        public type?: ("offer"|"answer"|"iceCandidate"|"isError"|"isEnd");

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
        candidate?: (string|null);

        /** IceCandidate sdpMid */
        sdpMid?: (string|null);

        /** IceCandidate sdpMLineIndex */
        sdpMLineIndex?: (number|null);
    }

    /** Represents an IceCandidate. */
    class IceCandidate implements IIceCandidate {

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
        content?: (signaling.IContent|null);

        /** Message isFirst */
        isFirst?: (boolean|null);

        /** Message joined */
        joined?: (boolean|null);

        /** Message ping */
        ping?: (boolean|null);

        /** Message pong */
        pong?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

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
        public type?: ("content"|"isFirst"|"joined"|"ping"|"pong");

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
        id?: (number|null);

        /** Content data */
        data?: (Uint8Array|null);

        /** Content isError */
        isError?: (boolean|null);

        /** Content isEnd */
        isEnd?: (boolean|null);
    }

    /** Represents a Content. */
    class Content implements IContent {

        /**
         * Constructs a new Content.
         * @param [properties] Properties to set
         */
        constructor(properties?: signaling.IContent);

        /** Content id. */
        public id: number;

        /** Content data. */
        public data: Uint8Array;

        /** Content isError. */
        public isError: boolean;

        /** Content isEnd. */
        public isEnd: boolean;

        /** Content type. */
        public type?: ("data"|"isError"|"isEnd");

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
