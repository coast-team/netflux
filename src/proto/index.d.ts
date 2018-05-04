import * as $protobuf from "protobufjs";

/** Properties of a Message. */
export interface IMessage {

    /** Message senderId */
    senderId?: (number|null);

    /** Message recipientId */
    recipientId?: (number|null);

    /** Message serviceId */
    serviceId?: (number|null);

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

    /** Message serviceId. */
    public serviceId: number;

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

/** Namespace userMessage. */
export namespace userMessage {

    /** Properties of a Message. */
    interface IMessage {

        /** Message length */
        length?: (number|null);

        /** Message type */
        type?: (userMessage.Message.Type|null);

        /** Message full */
        full?: (Uint8Array|null);

        /** Message chunk */
        chunk?: (userMessage.Message.IChunk|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: userMessage.IMessage);

        /** Message length. */
        public length: number;

        /** Message type. */
        public type: userMessage.Message.Type;

        /** Message full. */
        public full: Uint8Array;

        /** Message chunk. */
        public chunk?: (userMessage.Message.IChunk|null);

        /** Message contentType. */
        public contentType?: ("full"|"chunk");

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: userMessage.IMessage): userMessage.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link userMessage.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: userMessage.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): userMessage.Message;
    }

    namespace Message {

        /** Properties of a Chunk. */
        interface IChunk {

            /** Chunk id */
            id?: (number|null);

            /** Chunk nb */
            nb?: (number|null);

            /** Chunk content */
            content?: (Uint8Array|null);
        }

        /** Represents a Chunk. */
        class Chunk implements IChunk {

            /**
             * Constructs a new Chunk.
             * @param [properties] Properties to set
             */
            constructor(properties?: userMessage.Message.IChunk);

            /** Chunk id. */
            public id: number;

            /** Chunk nb. */
            public nb: number;

            /** Chunk content. */
            public content: Uint8Array;

            /**
             * Creates a new Chunk instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Chunk instance
             */
            public static create(properties?: userMessage.Message.IChunk): userMessage.Message.Chunk;

            /**
             * Encodes the specified Chunk message. Does not implicitly {@link userMessage.Message.Chunk.verify|verify} messages.
             * @param message Chunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: userMessage.Message.IChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Chunk message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Chunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): userMessage.Message.Chunk;
        }

        /** Type enum. */
        enum Type {
            STRING = 0,
            U_INT_8_ARRAY = 1
        }
    }
}

/** Namespace channelBuilder. */
export namespace channelBuilder {

    /** Properties of a Message. */
    interface IMessage {

        /** Message pair */
        pair?: (channelBuilder.IPeerPair|null);

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
        constructor(properties?: channelBuilder.IMessage);

        /** Message pair. */
        public pair?: (channelBuilder.IPeerPair|null);

        /** Message ping. */
        public ping: boolean;

        /** Message pong. */
        public pong: boolean;

        /** Message type. */
        public type?: ("pair"|"ping"|"pong");

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

    /** Properties of a PeerPair. */
    interface IPeerPair {

        /** PeerPair initiator */
        initiator?: (channelBuilder.IPeerInfo|null);

        /** PeerPair passive */
        passive?: (channelBuilder.IPeerInfo|null);
    }

    /** Represents a PeerPair. */
    class PeerPair implements IPeerPair {

        /**
         * Constructs a new PeerPair.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.IPeerPair);

        /** PeerPair initiator. */
        public initiator?: (channelBuilder.IPeerInfo|null);

        /** PeerPair passive. */
        public passive?: (channelBuilder.IPeerInfo|null);

        /**
         * Creates a new PeerPair instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PeerPair instance
         */
        public static create(properties?: channelBuilder.IPeerPair): channelBuilder.PeerPair;

        /**
         * Encodes the specified PeerPair message. Does not implicitly {@link channelBuilder.PeerPair.verify|verify} messages.
         * @param message PeerPair message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channelBuilder.IPeerPair, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PeerPair message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PeerPair
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channelBuilder.PeerPair;
    }

    /** Properties of a PeerInfo. */
    interface IPeerInfo {

        /** PeerInfo id */
        id?: (number|null);

        /** PeerInfo wss */
        wss?: (string|null);

        /** PeerInfo wcId */
        wcId?: (number|null);

        /** PeerInfo wsSupported */
        wsSupported?: (boolean|null);

        /** PeerInfo wsTried */
        wsTried?: (boolean|null);

        /** PeerInfo dcSupported */
        dcSupported?: (boolean|null);

        /** PeerInfo dcTried */
        dcTried?: (boolean|null);
    }

    /** Represents a PeerInfo. */
    class PeerInfo implements IPeerInfo {

        /**
         * Constructs a new PeerInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.IPeerInfo);

        /** PeerInfo id. */
        public id: number;

        /** PeerInfo wss. */
        public wss: string;

        /** PeerInfo wcId. */
        public wcId: number;

        /** PeerInfo wsSupported. */
        public wsSupported: boolean;

        /** PeerInfo wsTried. */
        public wsTried: boolean;

        /** PeerInfo dcSupported. */
        public dcSupported: boolean;

        /** PeerInfo dcTried. */
        public dcTried: boolean;

        /**
         * Creates a new PeerInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PeerInfo instance
         */
        public static create(properties?: channelBuilder.IPeerInfo): channelBuilder.PeerInfo;

        /**
         * Encodes the specified PeerInfo message. Does not implicitly {@link channelBuilder.PeerInfo.verify|verify} messages.
         * @param message PeerInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channelBuilder.IPeerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PeerInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PeerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channelBuilder.PeerInfo;
    }
}

/** Namespace fullMesh. */
export namespace fullMesh {

    /** Properties of a Message. */
    interface IMessage {

        /** Message membersResponse */
        membersResponse?: (fullMesh.IPeers|null);

        /** Message membersRequest */
        membersRequest?: (boolean|null);

        /** Message adjacentMembers */
        adjacentMembers?: (fullMesh.IPeers|null);

        /** Message heartbeat */
        heartbeat?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: fullMesh.IMessage);

        /** Message membersResponse. */
        public membersResponse?: (fullMesh.IPeers|null);

        /** Message membersRequest. */
        public membersRequest: boolean;

        /** Message adjacentMembers. */
        public adjacentMembers?: (fullMesh.IPeers|null);

        /** Message heartbeat. */
        public heartbeat: boolean;

        /** Message type. */
        public type?: ("membersResponse"|"membersRequest"|"adjacentMembers"|"heartbeat");

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

        /** Peers ids */
        ids?: (number[]|null);
    }

    /** Represents a Peers. */
    class Peers implements IPeers {

        /**
         * Constructs a new Peers.
         * @param [properties] Properties to set
         */
        constructor(properties?: fullMesh.IPeers);

        /** Peers ids. */
        public ids: number[];

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

/** Namespace dataChannelBuilder. */
export namespace dataChannelBuilder {

    /** Properties of a Message. */
    interface IMessage {

        /** Message offer */
        offer?: (string|null);

        /** Message answer */
        answer?: (string|null);

        /** Message candidate */
        candidate?: (dataChannelBuilder.IIceCandidate|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: dataChannelBuilder.IMessage);

        /** Message offer. */
        public offer: string;

        /** Message answer. */
        public answer: string;

        /** Message candidate. */
        public candidate?: (dataChannelBuilder.IIceCandidate|null);

        /** Message type. */
        public type?: ("offer"|"answer"|"candidate");

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: dataChannelBuilder.IMessage): dataChannelBuilder.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link dataChannelBuilder.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: dataChannelBuilder.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dataChannelBuilder.Message;
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
        constructor(properties?: dataChannelBuilder.IIceCandidate);

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
        public static create(properties?: dataChannelBuilder.IIceCandidate): dataChannelBuilder.IceCandidate;

        /**
         * Encodes the specified IceCandidate message. Does not implicitly {@link dataChannelBuilder.IceCandidate.verify|verify} messages.
         * @param message IceCandidate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: dataChannelBuilder.IIceCandidate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an IceCandidate message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns IceCandidate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dataChannelBuilder.IceCandidate;
    }
}

/** Namespace channel. */
export namespace channel {

    /** Properties of a Message. */
    interface IMessage {

        /** Message initPing */
        initPing?: (channel.IData|null);

        /** Message initPong */
        initPong?: (number|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: channel.IMessage);

        /** Message initPing. */
        public initPing?: (channel.IData|null);

        /** Message initPong. */
        public initPong: number;

        /** Message type. */
        public type?: ("initPing"|"initPong");

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

    /** Properties of a Data. */
    interface IData {

        /** Data topology */
        topology?: (number|null);

        /** Data wcId */
        wcId?: (number|null);

        /** Data senderId */
        senderId?: (number|null);

        /** Data members */
        members?: (number[]|null);

        /** Data key */
        key?: (string|null);
    }

    /** Represents a Data. */
    class Data implements IData {

        /**
         * Constructs a new Data.
         * @param [properties] Properties to set
         */
        constructor(properties?: channel.IData);

        /** Data topology. */
        public topology: number;

        /** Data wcId. */
        public wcId: number;

        /** Data senderId. */
        public senderId: number;

        /** Data members. */
        public members: number[];

        /** Data key. */
        public key: string;

        /**
         * Creates a new Data instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Data instance
         */
        public static create(properties?: channel.IData): channel.Data;

        /**
         * Encodes the specified Data message. Does not implicitly {@link channel.Data.verify|verify} messages.
         * @param message Data message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channel.IData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Data message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Data
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channel.Data;
    }
}

/** Namespace signaling. */
export namespace signaling {

    /** Properties of a Message. */
    interface IMessage {

        /** Message heartbeat */
        heartbeat?: (boolean|null);

        /** Message content */
        content?: (signaling.IContent|null);

        /** Message connect */
        connect?: (signaling.IGroupData|null);

        /** Message connected */
        connected?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: signaling.IMessage);

        /** Message heartbeat. */
        public heartbeat: boolean;

        /** Message content. */
        public content?: (signaling.IContent|null);

        /** Message connect. */
        public connect?: (signaling.IGroupData|null);

        /** Message connected. */
        public connected: boolean;

        /** Message type. */
        public type?: ("heartbeat"|"content"|"connect"|"connected");

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

        /** Content lastData */
        lastData?: (boolean|null);

        /** Content data */
        data?: (Uint8Array|null);
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

        /** Content lastData. */
        public lastData: boolean;

        /** Content data. */
        public data: Uint8Array;

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

    /** Properties of a GroupData. */
    interface IGroupData {

        /** GroupData id */
        id?: (number|null);

        /** GroupData members */
        members?: (number[]|null);
    }

    /** Represents a GroupData. */
    class GroupData implements IGroupData {

        /**
         * Constructs a new GroupData.
         * @param [properties] Properties to set
         */
        constructor(properties?: signaling.IGroupData);

        /** GroupData id. */
        public id: number;

        /** GroupData members. */
        public members: number[];

        /**
         * Creates a new GroupData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GroupData instance
         */
        public static create(properties?: signaling.IGroupData): signaling.GroupData;

        /**
         * Encodes the specified GroupData message. Does not implicitly {@link signaling.GroupData.verify|verify} messages.
         * @param message GroupData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: signaling.IGroupData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GroupData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GroupData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): signaling.GroupData;
    }
}
