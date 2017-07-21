/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const Message = $root.Message = (() => {

    function Message(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    Message.prototype.senderId = 0;
    Message.prototype.recipientId = 0;
    Message.prototype.isService = false;
    Message.prototype.content = $util.newBuffer([]);

    Message.create = function create(properties) {
        return new Message(properties);
    };

    Message.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.senderId != null && message.hasOwnProperty("senderId"))
            writer.uint32(8).uint32(message.senderId);
        if (message.recipientId != null && message.hasOwnProperty("recipientId"))
            writer.uint32(16).uint32(message.recipientId);
        if (message.isService != null && message.hasOwnProperty("isService"))
            writer.uint32(24).bool(message.isService);
        if (message.content != null && message.hasOwnProperty("content"))
            writer.uint32(34).bytes(message.content);
        return writer;
    };

    Message.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Message();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.senderId = reader.uint32();
                break;
            case 2:
                message.recipientId = reader.uint32();
                break;
            case 3:
                message.isService = reader.bool();
                break;
            case 4:
                message.content = reader.bytes();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    return Message;
})();

export const user = $root.user = (() => {

    const user = {};

    user.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.length = 0;
        Message.prototype.type = 0;
        Message.prototype.full = $util.newBuffer([]);
        Message.prototype.chunk = null;

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "content", {
            get: $util.oneOfGetter($oneOfFields = ["full", "chunk"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.length != null && message.hasOwnProperty("length"))
                writer.uint32(8).uint32(message.length);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(16).int32(message.type);
            if (message.full != null && message.hasOwnProperty("full"))
                writer.uint32(26).bytes(message.full);
            if (message.chunk != null && message.hasOwnProperty("chunk"))
                $root.user.Message.Chunk.encode(message.chunk, writer.uint32(34).fork()).ldelim();
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.user.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.length = reader.uint32();
                    break;
                case 2:
                    message.type = reader.int32();
                    break;
                case 3:
                    message.full = reader.bytes();
                    break;
                case 4:
                    message.chunk = $root.user.Message.Chunk.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        Message.Chunk = (function() {

            function Chunk(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            Chunk.prototype.id = 0;
            Chunk.prototype.number = 0;
            Chunk.prototype.content = $util.newBuffer([]);

            Chunk.create = function create(properties) {
                return new Chunk(properties);
            };

            Chunk.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && message.hasOwnProperty("id"))
                    writer.uint32(8).uint32(message.id);
                if (message.number != null && message.hasOwnProperty("number"))
                    writer.uint32(16).uint32(message.number);
                if (message.content != null && message.hasOwnProperty("content"))
                    writer.uint32(34).bytes(message.content);
                return writer;
            };

            Chunk.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.user.Message.Chunk();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
                        message.number = reader.uint32();
                        break;
                    case 4:
                        message.content = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            return Chunk;
        })();

        Message.Type = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "STRING"] = 0;
            values[valuesById[1] = "U_INT_8_ARRAY"] = 1;
            return values;
        })();

        return Message;
    })();

    return user;
})();

export const service = $root.service = (() => {

    const service = {};

    service.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.id = 0;
        Message.prototype.content = $util.newBuffer([]);

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(8).uint32(message.id);
            if (message.content != null && message.hasOwnProperty("content"))
                writer.uint32(18).bytes(message.content);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.service.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    message.content = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Message;
    })();

    return service;
})();

export const webChannel = $root.webChannel = (() => {

    const webChannel = {};

    webChannel.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.initWebChannel = null;
        Message.prototype.ping = false;
        Message.prototype.pong = false;

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["initWebChannel", "ping", "pong"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.initWebChannel != null && message.hasOwnProperty("initWebChannel"))
                $root.webChannel.InitWebChannel.encode(message.initWebChannel, writer.uint32(10).fork()).ldelim();
            if (message.ping != null && message.hasOwnProperty("ping"))
                writer.uint32(16).bool(message.ping);
            if (message.pong != null && message.hasOwnProperty("pong"))
                writer.uint32(24).bool(message.pong);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.webChannel.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.initWebChannel = $root.webChannel.InitWebChannel.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.ping = reader.bool();
                    break;
                case 3:
                    message.pong = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Message;
    })();

    webChannel.InitWebChannel = (function() {

        function InitWebChannel(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        InitWebChannel.prototype.topology = 0;
        InitWebChannel.prototype.wcId = 0;
        InitWebChannel.prototype.peerId = 0;

        InitWebChannel.create = function create(properties) {
            return new InitWebChannel(properties);
        };

        InitWebChannel.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.topology != null && message.hasOwnProperty("topology"))
                writer.uint32(8).uint32(message.topology);
            if (message.wcId != null && message.hasOwnProperty("wcId"))
                writer.uint32(16).uint32(message.wcId);
            if (message.peerId != null && message.hasOwnProperty("peerId"))
                writer.uint32(24).uint32(message.peerId);
            return writer;
        };

        InitWebChannel.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.webChannel.InitWebChannel();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.topology = reader.uint32();
                    break;
                case 2:
                    message.wcId = reader.uint32();
                    break;
                case 3:
                    message.peerId = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return InitWebChannel;
    })();

    return webChannel;
})();

export const channelBuilder = $root.channelBuilder = (() => {

    const channelBuilder = {};

    channelBuilder.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.request = null;
        Message.prototype.response = null;
        Message.prototype.failed = "";

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["request", "response", "failed"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.request != null && message.hasOwnProperty("request"))
                $root.channelBuilder.Connection.encode(message.request, writer.uint32(10).fork()).ldelim();
            if (message.response != null && message.hasOwnProperty("response"))
                $root.channelBuilder.Connection.encode(message.response, writer.uint32(18).fork()).ldelim();
            if (message.failed != null && message.hasOwnProperty("failed"))
                writer.uint32(26).string(message.failed);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.channelBuilder.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.request = $root.channelBuilder.Connection.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.response = $root.channelBuilder.Connection.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.failed = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Message;
    })();

    channelBuilder.Connection = (function() {

        function Connection(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Connection.prototype.wsUrl = "";
        Connection.prototype.isWrtcSupport = false;

        Connection.create = function create(properties) {
            return new Connection(properties);
        };

        Connection.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.wsUrl != null && message.hasOwnProperty("wsUrl"))
                writer.uint32(10).string(message.wsUrl);
            if (message.isWrtcSupport != null && message.hasOwnProperty("isWrtcSupport"))
                writer.uint32(16).bool(message.isWrtcSupport);
            return writer;
        };

        Connection.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.channelBuilder.Connection();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.wsUrl = reader.string();
                    break;
                case 2:
                    message.isWrtcSupport = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Connection;
    })();

    return channelBuilder;
})();

export const fullMesh = $root.fullMesh = (() => {

    const fullMesh = {};

    fullMesh.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.connectTo = null;
        Message.prototype.connectedTo = null;
        Message.prototype.joiningPeerId = 0;
        Message.prototype.joinedPeerId = 0;

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["connectTo", "connectedTo", "joiningPeerId", "joinedPeerId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.connectTo != null && message.hasOwnProperty("connectTo"))
                $root.fullMesh.Peers.encode(message.connectTo, writer.uint32(10).fork()).ldelim();
            if (message.connectedTo != null && message.hasOwnProperty("connectedTo"))
                $root.fullMesh.Peers.encode(message.connectedTo, writer.uint32(18).fork()).ldelim();
            if (message.joiningPeerId != null && message.hasOwnProperty("joiningPeerId"))
                writer.uint32(24).uint32(message.joiningPeerId);
            if (message.joinedPeerId != null && message.hasOwnProperty("joinedPeerId"))
                writer.uint32(32).uint32(message.joinedPeerId);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullMesh.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.connectTo = $root.fullMesh.Peers.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.connectedTo = $root.fullMesh.Peers.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.joiningPeerId = reader.uint32();
                    break;
                case 4:
                    message.joinedPeerId = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Message;
    })();

    fullMesh.Peers = (function() {

        function Peers(properties) {
            this.peers = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Peers.prototype.peers = $util.emptyArray;

        Peers.create = function create(properties) {
            return new Peers(properties);
        };

        Peers.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.peers != null && message.peers.length) {
                writer.uint32(10).fork();
                for (let i = 0; i < message.peers.length; ++i)
                    writer.uint32(message.peers[i]);
                writer.ldelim();
            }
            return writer;
        };

        Peers.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullMesh.Peers();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.peers && message.peers.length))
                        message.peers = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.peers.push(reader.uint32());
                    } else
                        message.peers.push(reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Peers;
    })();

    return fullMesh;
})();

export const webRTCBuilder = $root.webRTCBuilder = (() => {

    const webRTCBuilder = {};

    webRTCBuilder.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.offer = "";
        Message.prototype.answer = "";
        Message.prototype.candidate = null;

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["offer", "answer", "candidate"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.offer != null && message.hasOwnProperty("offer"))
                writer.uint32(10).string(message.offer);
            if (message.answer != null && message.hasOwnProperty("answer"))
                writer.uint32(18).string(message.answer);
            if (message.candidate != null && message.hasOwnProperty("candidate"))
                $root.webRTCBuilder.Candidate.encode(message.candidate, writer.uint32(26).fork()).ldelim();
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.webRTCBuilder.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.offer = reader.string();
                    break;
                case 2:
                    message.answer = reader.string();
                    break;
                case 3:
                    message.candidate = $root.webRTCBuilder.Candidate.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Message;
    })();

    webRTCBuilder.Candidate = (function() {

        function Candidate(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Candidate.prototype.candidate = "";
        Candidate.prototype.sdpMid = "";
        Candidate.prototype.sdpMLineIndex = 0;

        Candidate.create = function create(properties) {
            return new Candidate(properties);
        };

        Candidate.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.candidate != null && message.hasOwnProperty("candidate"))
                writer.uint32(10).string(message.candidate);
            if (message.sdpMid != null && message.hasOwnProperty("sdpMid"))
                writer.uint32(18).string(message.sdpMid);
            if (message.sdpMLineIndex != null && message.hasOwnProperty("sdpMLineIndex"))
                writer.uint32(24).uint32(message.sdpMLineIndex);
            return writer;
        };

        Candidate.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.webRTCBuilder.Candidate();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.candidate = reader.string();
                    break;
                case 2:
                    message.sdpMid = reader.string();
                    break;
                case 3:
                    message.sdpMLineIndex = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Candidate;
    })();

    return webRTCBuilder;
})();

export const signaling = $root.signaling = (() => {

    const signaling = {};

    signaling.Incoming = (function() {

        function Incoming(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Incoming.prototype.content = null;
        Incoming.prototype.isFirst = false;
        Incoming.prototype.ping = false;
        Incoming.prototype.pong = false;

        let $oneOfFields;

        Object.defineProperty(Incoming.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["content", "isFirst", "ping", "pong"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Incoming.create = function create(properties) {
            return new Incoming(properties);
        };

        Incoming.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.content != null && message.hasOwnProperty("content"))
                $root.signaling.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
            if (message.isFirst != null && message.hasOwnProperty("isFirst"))
                writer.uint32(16).bool(message.isFirst);
            if (message.ping != null && message.hasOwnProperty("ping"))
                writer.uint32(24).bool(message.ping);
            if (message.pong != null && message.hasOwnProperty("pong"))
                writer.uint32(32).bool(message.pong);
            return writer;
        };

        Incoming.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.signaling.Incoming();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.content = $root.signaling.Content.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.isFirst = reader.bool();
                    break;
                case 3:
                    message.ping = reader.bool();
                    break;
                case 4:
                    message.pong = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Incoming;
    })();

    signaling.Outcoming = (function() {

        function Outcoming(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Outcoming.prototype.content = null;
        Outcoming.prototype.joined = false;
        Outcoming.prototype.ping = false;
        Outcoming.prototype.pong = false;

        let $oneOfFields;

        Object.defineProperty(Outcoming.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["content", "joined", "ping", "pong"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Outcoming.create = function create(properties) {
            return new Outcoming(properties);
        };

        Outcoming.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.content != null && message.hasOwnProperty("content"))
                $root.signaling.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
            if (message.joined != null && message.hasOwnProperty("joined"))
                writer.uint32(16).bool(message.joined);
            if (message.ping != null && message.hasOwnProperty("ping"))
                writer.uint32(24).bool(message.ping);
            if (message.pong != null && message.hasOwnProperty("pong"))
                writer.uint32(32).bool(message.pong);
            return writer;
        };

        Outcoming.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.signaling.Outcoming();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.content = $root.signaling.Content.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.joined = reader.bool();
                    break;
                case 3:
                    message.ping = reader.bool();
                    break;
                case 4:
                    message.pong = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Outcoming;
    })();

    signaling.Content = (function() {

        function Content(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Content.prototype.id = 0;
        Content.prototype.data = $util.newBuffer([]);
        Content.prototype.isError = false;
        Content.prototype.isEnd = false;

        let $oneOfFields;

        Object.defineProperty(Content.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["data", "isError", "isEnd"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Content.create = function create(properties) {
            return new Content(properties);
        };

        Content.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(8).uint32(message.id);
            if (message.data != null && message.hasOwnProperty("data"))
                writer.uint32(18).bytes(message.data);
            if (message.isError != null && message.hasOwnProperty("isError"))
                writer.uint32(24).bool(message.isError);
            if (message.isEnd != null && message.hasOwnProperty("isEnd"))
                writer.uint32(32).bool(message.isEnd);
            return writer;
        };

        Content.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.signaling.Content();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    message.data = reader.bytes();
                    break;
                case 3:
                    message.isError = reader.bool();
                    break;
                case 4:
                    message.isEnd = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Content;
    })();

    return signaling;
})();

export { $root as default };
