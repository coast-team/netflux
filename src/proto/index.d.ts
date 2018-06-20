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

        /** Message negotiation */
        negotiation?: (channelBuilder.INegotiation|null);

        /** Message connectionRequest */
        connectionRequest?: (Uint8Array|null);

        /** Message connectionResponse */
        connectionResponse?: (boolean|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.IMessage);

        /** Message negotiation. */
        public negotiation?: (channelBuilder.INegotiation|null);

        /** Message connectionRequest. */
        public connectionRequest: Uint8Array;

        /** Message connectionResponse. */
        public connectionResponse: boolean;

        /** Message type. */
        public type?: ("negotiation"|"connectionRequest"|"connectionResponse");

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

    /** Properties of a Negotiation. */
    interface INegotiation {

        /** Negotiation initiator */
        initiator?: (channelBuilder.IInfo|null);

        /** Negotiation passive */
        passive?: (channelBuilder.IInfo|null);
    }

    /** Represents a Negotiation. */
    class Negotiation implements INegotiation {

        /**
         * Constructs a new Negotiation.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.INegotiation);

        /** Negotiation initiator. */
        public initiator?: (channelBuilder.IInfo|null);

        /** Negotiation passive. */
        public passive?: (channelBuilder.IInfo|null);

        /**
         * Creates a new Negotiation instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Negotiation instance
         */
        public static create(properties?: channelBuilder.INegotiation): channelBuilder.Negotiation;

        /**
         * Encodes the specified Negotiation message. Does not implicitly {@link channelBuilder.Negotiation.verify|verify} messages.
         * @param message Negotiation message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channelBuilder.INegotiation, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Negotiation message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Negotiation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channelBuilder.Negotiation;
    }

    /** Properties of an Info. */
    interface IInfo {

        /** Info id */
        id?: (number|null);

        /** Info wss */
        wss?: (string|null);

        /** Info wcId */
        wcId?: (number|null);

        /** Info wsSupported */
        wsSupported?: (boolean|null);

        /** Info wsTried */
        wsTried?: (boolean|null);

        /** Info dcSupported */
        dcSupported?: (boolean|null);

        /** Info dcTried */
        dcTried?: (boolean|null);
    }

    /** Represents an Info. */
    class Info implements IInfo {

        /**
         * Constructs a new Info.
         * @param [properties] Properties to set
         */
        constructor(properties?: channelBuilder.IInfo);

        /** Info id. */
        public id: number;

        /** Info wss. */
        public wss: string;

        /** Info wcId. */
        public wcId: number;

        /** Info wsSupported. */
        public wsSupported: boolean;

        /** Info wsTried. */
        public wsTried: boolean;

        /** Info dcSupported. */
        public dcSupported: boolean;

        /** Info dcTried. */
        public dcTried: boolean;

        /**
         * Creates a new Info instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Info instance
         */
        public static create(properties?: channelBuilder.IInfo): channelBuilder.Info;

        /**
         * Encodes the specified Info message. Does not implicitly {@link channelBuilder.Info.verify|verify} messages.
         * @param message Info message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: channelBuilder.IInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Info message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Info
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): channelBuilder.Info;
    }
}

/** Namespace fullMesh. */
export namespace fullMesh {

    /** Properties of a Message. */
    interface IMessage {

        /** Message members */
        members?: (fullMesh.IPeers|null);

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

        /** Message members. */
        public members?: (fullMesh.IPeers|null);

        /** Message adjacentMembers. */
        public adjacentMembers?: (fullMesh.IPeers|null);

        /** Message heartbeat. */
        public heartbeat: boolean;

        /** Message type. */
        public type?: ("members"|"adjacentMembers"|"heartbeat");

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

    /** Properties of a ConnectionRequest. */
    interface IConnectionRequest {

        /** ConnectionRequest id */
        id?: (number|null);

        /** ConnectionRequest adjacentIds */
        adjacentIds?: (number[]|null);
    }

    /** Represents a ConnectionRequest. */
    class ConnectionRequest implements IConnectionRequest {

        /**
         * Constructs a new ConnectionRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: fullMesh.IConnectionRequest);

        /** ConnectionRequest id. */
        public id: number;

        /** ConnectionRequest adjacentIds. */
        public adjacentIds: number[];

        /**
         * Creates a new ConnectionRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ConnectionRequest instance
         */
        public static create(properties?: fullMesh.IConnectionRequest): fullMesh.ConnectionRequest;

        /**
         * Encodes the specified ConnectionRequest message. Does not implicitly {@link fullMesh.ConnectionRequest.verify|verify} messages.
         * @param message ConnectionRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: fullMesh.IConnectionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ConnectionRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ConnectionRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): fullMesh.ConnectionRequest;
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

        /** Content senderId */
        senderId?: (number|null);

        /** Content recipientId */
        recipientId?: (number|null);

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

        /** Content senderId. */
        public senderId: number;

        /** Content recipientId. */
        public recipientId: number;

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
