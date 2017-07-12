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
    Message.prototype.isInner = false;
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
        if (message.isInner != null && message.hasOwnProperty("isInner"))
            writer.uint32(24).bool(message.isInner);
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
                message.isInner = reader.bool();
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
                    writer.uint32(26).bytes(message.content);
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
                    case 3:
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
            values[valuesById[1] = "ARRAY_BUFFER"] = 1;
            return values;
        })();

        return Message;
    })();

    return user;
})();

export const inner = $root.inner = (() => {

    const inner = {};

    inner.Message = (function() {

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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.inner.Message();
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

    return inner;
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

export const fullyConnected = $root.fullyConnected = (() => {

    const fullyConnected = {};

    fullyConnected.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.shouldConnectTo = null;
        Message.prototype.newJoiningPeer = null;
        Message.prototype.peerJoined = false;
        Message.prototype.tick = false;
        Message.prototype.tock = null;

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["shouldConnectTo", "newJoiningPeer", "peerJoined", "tick", "tock"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.shouldConnectTo != null && message.hasOwnProperty("shouldConnectTo"))
                $root.fullyConnected.ShouldConnectTo.encode(message.shouldConnectTo, writer.uint32(10).fork()).ldelim();
            if (message.newJoiningPeer != null && message.hasOwnProperty("newJoiningPeer"))
                $root.fullyConnected.NewJoiningPeer.encode(message.newJoiningPeer, writer.uint32(18).fork()).ldelim();
            if (message.peerJoined != null && message.hasOwnProperty("peerJoined"))
                writer.uint32(24).bool(message.peerJoined);
            if (message.tick != null && message.hasOwnProperty("tick"))
                writer.uint32(32).bool(message.tick);
            if (message.tock != null && message.hasOwnProperty("tock"))
                $root.fullyConnected.Tock.encode(message.tock, writer.uint32(42).fork()).ldelim();
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullyConnected.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.shouldConnectTo = $root.fullyConnected.ShouldConnectTo.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.newJoiningPeer = $root.fullyConnected.NewJoiningPeer.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.peerJoined = reader.bool();
                    break;
                case 4:
                    message.tick = reader.bool();
                    break;
                case 5:
                    message.tock = $root.fullyConnected.Tock.decode(reader, reader.uint32());
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

    fullyConnected.ShouldConnectTo = (function() {

        function ShouldConnectTo(properties) {
            this.peers = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        ShouldConnectTo.prototype.peers = $util.emptyArray;

        ShouldConnectTo.create = function create(properties) {
            return new ShouldConnectTo(properties);
        };

        ShouldConnectTo.encode = function encode(message, writer) {
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

        ShouldConnectTo.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullyConnected.ShouldConnectTo();
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

        return ShouldConnectTo;
    })();

    fullyConnected.Tock = (function() {

        function Tock(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Tock.prototype.isJoining = false;

        Tock.create = function create(properties) {
            return new Tock(properties);
        };

        Tock.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.isJoining != null && message.hasOwnProperty("isJoining"))
                writer.uint32(8).bool(message.isJoining);
            return writer;
        };

        Tock.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullyConnected.Tock();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.isJoining = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Tock;
    })();

    fullyConnected.NewJoiningPeer = (function() {

        function NewJoiningPeer(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        NewJoiningPeer.prototype.jpId = 0;

        NewJoiningPeer.create = function create(properties) {
            return new NewJoiningPeer(properties);
        };

        NewJoiningPeer.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.jpId != null && message.hasOwnProperty("jpId"))
                writer.uint32(8).uint32(message.jpId);
            return writer;
        };

        NewJoiningPeer.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullyConnected.NewJoiningPeer();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.jpId = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return NewJoiningPeer;
    })();

    return fullyConnected;
})();

export const spray = $root.spray = (() => {

    const spray = {};

    spray.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.shouldAdd = null;
        Message.prototype.exchangeInit = null;
        Message.prototype.exchangeResp = null;

        let $oneOfFields;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["shouldAdd", "exchangeInit", "exchangeResp"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.shouldAdd != null && message.hasOwnProperty("shouldAdd"))
                $root.spray.ShouldAdd.encode(message.shouldAdd, writer.uint32(10).fork()).ldelim();
            if (message.exchangeInit != null && message.hasOwnProperty("exchangeInit"))
                $root.spray.ExchangeInit.encode(message.exchangeInit, writer.uint32(18).fork()).ldelim();
            if (message.exchangeResp != null && message.hasOwnProperty("exchangeResp"))
                $root.spray.ExchangeResp.encode(message.exchangeResp, writer.uint32(26).fork()).ldelim();
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.spray.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.shouldAdd = $root.spray.ShouldAdd.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.exchangeInit = $root.spray.ExchangeInit.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.exchangeResp = $root.spray.ExchangeResp.decode(reader, reader.uint32());
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

    spray.ShouldAdd = (function() {

        function ShouldAdd(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        ShouldAdd.prototype.peerId = 0;

        ShouldAdd.create = function create(properties) {
            return new ShouldAdd(properties);
        };

        ShouldAdd.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.peerId != null && message.hasOwnProperty("peerId"))
                writer.uint32(8).uint32(message.peerId);
            return writer;
        };

        ShouldAdd.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.spray.ShouldAdd();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.peerId = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return ShouldAdd;
    })();

    spray.ExchangeInit = (function() {

        function ExchangeInit(properties) {
            this.sample = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        ExchangeInit.prototype.sample = $util.emptyArray;

        ExchangeInit.create = function create(properties) {
            return new ExchangeInit(properties);
        };

        ExchangeInit.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.sample != null && message.sample.length)
                for (let i = 0; i < message.sample.length; ++i)
                    writer.uint32(10).bytes(message.sample[i]);
            return writer;
        };

        ExchangeInit.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.spray.ExchangeInit();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.sample && message.sample.length))
                        message.sample = [];
                    message.sample.push(reader.bytes());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return ExchangeInit;
    })();

    spray.ExchangeResp = (function() {

        function ExchangeResp(properties) {
            this.respSample = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        ExchangeResp.prototype.respSample = $util.emptyArray;

        ExchangeResp.create = function create(properties) {
            return new ExchangeResp(properties);
        };

        ExchangeResp.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.respSample != null && message.respSample.length)
                for (let i = 0; i < message.respSample.length; ++i)
                    writer.uint32(10).bytes(message.respSample[i]);
            return writer;
        };

        ExchangeResp.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.spray.ExchangeResp();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.respSample && message.respSample.length))
                        message.respSample = [];
                    message.respSample.push(reader.bytes());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return ExchangeResp;
    })();

    return spray;
})();

export const webRTC = $root.webRTC = (() => {

    const webRTC = {};

    webRTC.Message = (function() {

        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Message.prototype.offer = null;
        Message.prototype.answer = null;
        Message.prototype.candidate = "";

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
                $root.webRTC.SDP.encode(message.offer, writer.uint32(10).fork()).ldelim();
            if (message.answer != null && message.hasOwnProperty("answer"))
                $root.webRTC.SDP.encode(message.answer, writer.uint32(18).fork()).ldelim();
            if (message.candidate != null && message.hasOwnProperty("candidate"))
                writer.uint32(26).string(message.candidate);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.webRTC.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.offer = $root.webRTC.SDP.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.answer = $root.webRTC.SDP.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.candidate = reader.string();
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

    webRTC.SDP = (function() {

        function SDP(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        SDP.prototype.type = "";
        SDP.prototype.sdp = "";

        SDP.create = function create(properties) {
            return new SDP(properties);
        };

        SDP.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(10).string(message.type);
            if (message.sdp != null && message.hasOwnProperty("sdp"))
                writer.uint32(18).string(message.sdp);
            return writer;
        };

        SDP.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.webRTC.SDP();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.string();
                    break;
                case 2:
                    message.sdp = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return SDP;
    })();

    return webRTC;
})();

export { $root as default };
