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

    /** Message meta */
    meta?: IMeta;
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

    /** Message meta. */
    public meta?: (IMeta|null);

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

/** Properties of a Meta. */
export interface IMeta {

    /** Meta timestamp */
    timestamp?: number;
}

/** Represents a Meta. */
export class Meta {

    /**
     * Constructs a new Meta.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMeta);

    /** Meta timestamp. */
    public timestamp: number;

    /**
     * Creates a new Meta instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Meta instance
     */
    public static create(properties?: IMeta): Meta;

    /**
     * Encodes the specified Meta message. Does not implicitly {@link Meta.verify|verify} messages.
     * @param message Meta message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMeta, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Meta message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Meta
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Meta;
}

/** Namespace user. */
export namespace user {

    /** Properties of a Message. */
    interface IMessage {

        /** Message length */
        length?: number;

        /** Message type */
        type?: user.Type;

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
        public type: user.Type;

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

        /** Message initWebChannel */
        initWebChannel?: webChannel.IInitWebChannel;

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

        /** Message initWebChannel. */
        public initWebChannel?: (webChannel.IInitWebChannel|null);

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

    /** Properties of an InitWebChannel. */
    interface IInitWebChannel {

        /** InitWebChannel topology */
        topology?: number;

        /** InitWebChannel wcId */
        wcId?: number;

        /** InitWebChannel peerId */
        peerId?: number;
    }

    /** Represents an InitWebChannel. */
    class InitWebChannel {

        /**
         * Constructs a new InitWebChannel.
         * @param [properties] Properties to set
         */
        constructor(properties?: webChannel.IInitWebChannel);

        /** InitWebChannel topology. */
        public topology: number;

        /** InitWebChannel wcId. */
        public wcId: number;

        /** InitWebChannel peerId. */
        public peerId: number;

        /**
         * Creates a new InitWebChannel instance using the specified properties.
         * @param [properties] Properties to set
         * @returns InitWebChannel instance
         */
        public static create(properties?: webChannel.IInitWebChannel): webChannel.InitWebChannel;

        /**
         * Encodes the specified InitWebChannel message. Does not implicitly {@link webChannel.InitWebChannel.verify|verify} messages.
         * @param message InitWebChannel message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: webChannel.IInitWebChannel, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an InitWebChannel message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns InitWebChannel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webChannel.InitWebChannel;
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

        /** Message joinFailedPeerId */
        joinFailedPeerId?: number;
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

        /** Message joinFailedPeerId. */
        public joinFailedPeerId: number;

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

        /** Peers peers */
        peers?: number[];
    }

    /** Represents a Peers. */
    class Peers {

        /**
         * Constructs a new Peers.
         * @param [properties] Properties to set
         */
        constructor(properties?: fullMesh.IPeers);

        /** Peers peers. */
        public peers: number[];

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

/** Namespace spray. */
export namespace spray {

    /** Properties of a Message. */
    interface IMessage {

        /** Message shouldAdd */
        shouldAdd?: number;

        /** Message exchangeInit */
        exchangeInit?: spray.ISample;

        /** Message exchangeResp */
        exchangeResp?: spray.ISample;

        /** Message connectTo */
        connectTo?: number;

        /** Message connectedTo */
        connectedTo?: spray.IPeers;

        /** Message joinedPeerId */
        joinedPeerId?: number;

        /** Message joinedPeerIdFinished */
        joinedPeerIdFinished?: number;
    }

    /** Represents a Message. */
    class Message {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: spray.IMessage);

        /** Message shouldAdd. */
        public shouldAdd: number;

        /** Message exchangeInit. */
        public exchangeInit?: (spray.ISample|null);

        /** Message exchangeResp. */
        public exchangeResp?: (spray.ISample|null);

        /** Message connectTo. */
        public connectTo: number;

        /** Message connectedTo. */
        public connectedTo?: (spray.IPeers|null);

        /** Message joinedPeerId. */
        public joinedPeerId: number;

        /** Message joinedPeerIdFinished. */
        public joinedPeerIdFinished: number;

        /** Message type. */
        public type?: string;

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: spray.IMessage): spray.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link spray.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: spray.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): spray.Message;
    }

    /** Properties of a Sample. */
    interface ISample {

        /** Sample sample */
        sample?: number[];
    }

    /** Represents a Sample. */
    class Sample {

        /**
         * Constructs a new Sample.
         * @param [properties] Properties to set
         */
        constructor(properties?: spray.ISample);

        /** Sample sample. */
        public sample: number[];

        /**
         * Creates a new Sample instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Sample instance
         */
        public static create(properties?: spray.ISample): spray.Sample;

        /**
         * Encodes the specified Sample message. Does not implicitly {@link spray.Sample.verify|verify} messages.
         * @param message Sample message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: spray.ISample, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Sample message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Sample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): spray.Sample;
    }

    /** Properties of a Peers. */
    interface IPeers {

        /** Peers peers */
        peers?: number[];
    }

    /** Represents a Peers. */
    class Peers {

        /**
         * Constructs a new Peers.
         * @param [properties] Properties to set
         */
        constructor(properties?: spray.IPeers);

        /** Peers peers. */
        public peers: number[];

        /**
         * Creates a new Peers instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Peers instance
         */
        public static create(properties?: spray.IPeers): spray.Peers;

        /**
         * Encodes the specified Peers message. Does not implicitly {@link spray.Peers.verify|verify} messages.
         * @param message Peers message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: spray.IPeers, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Peers message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Peers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): spray.Peers;
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
        iceCandidate?: webRTCBuilder.Message.IIceCandidate;
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
        public iceCandidate?: (webRTCBuilder.Message.IIceCandidate|null);

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

    namespace Message {

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
            constructor(properties?: webRTCBuilder.Message.IIceCandidate);

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
            public static create(properties?: webRTCBuilder.Message.IIceCandidate): webRTCBuilder.Message.IceCandidate;

            /**
             * Encodes the specified IceCandidate message. Does not implicitly {@link webRTCBuilder.Message.IceCandidate.verify|verify} messages.
             * @param message IceCandidate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: webRTCBuilder.Message.IIceCandidate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an IceCandidate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns IceCandidate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): webRTCBuilder.Message.IceCandidate;
        }
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
