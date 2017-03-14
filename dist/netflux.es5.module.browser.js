var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/**
 * Default timeout for any pending request.
 * @type {number}
 */
var DEFAULT_REQUEST_TIMEOUT = 60000;

/**
 * Item storage which is separate for each service. The `Map` key is the service `id`.
 */
var itemsStorage = new Map();

/**
 * Pending request map. Pending request is when a service uses a Promise
 * which will be fulfilled or rejected somewhere else in code. For exemple when
 * a peer is waiting for a feedback from another peer before Promise has completed.
 * @type {Map}
 */
var requestsStorage = new Map();

/**
 * Abstract class which each service should inherit. Each service is independent
 * and can store data temporarly in order to accomplish its task(s).
 */

var Service = function () {

  /**
   * It should be invoked only by calling `super` from the children constructor.
   *
   * @param {number} id The service unique identifier
   */
  function Service(id) {
    classCallCheck(this, Service);

    /**
     * The service unique identifier.
     * @type {number}
     */
    this.id = id;
    if (!itemsStorage.has(this.id)) itemsStorage.set(this.id, new WeakMap());
    if (!requestsStorage.has(this.id)) requestsStorage.set(this.id, new WeakMap());
  }

  /**
   * Add a new pending request identified by `obj` and `id`.
   * @param {Object} obj
   * @param {number} id
   * @param {{resolve: Promise.resolve, reject:Promise.reject}} data
   * @param {number} [timeout=DEFAULT_REQUEST_TIMEOUT] Timeout in milliseconds
   */


  createClass(Service, [{
    key: 'setPendingRequest',
    value: function setPendingRequest(obj, id, data) {
      var timeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_REQUEST_TIMEOUT;

      this.setTo(requestsStorage, obj, id, data);
      setTimeout(function () {
        data.reject('Pending request timeout');
      }, timeout);
    }

    /**
     * Get pending request identified by `obj` and `id`.
     *
     * @param  {Object} obj
     * @param  {number} id
     * @returns {{resolve: Promise.resolve, reject:Promise.reject}}
     */

  }, {
    key: 'getPendingRequest',
    value: function getPendingRequest(obj, id) {
      return this.getFrom(requestsStorage, obj, id);
    }

    /**
     * Add item with `obj` and `ìd` as identifier.
     * @param {Object} obj
     * @param {number} id
     * @param {Object} data
     */

  }, {
    key: 'setItem',
    value: function setItem(obj, id, data) {
      this.setTo(itemsStorage, obj, id, data);
    }

    /**
     * Get item identified by `obj` and `id`.
     *
     * @param {Object} obj
     * @param {number} id
     *
     * @returns {Object}
     */

  }, {
    key: 'getItem',
    value: function getItem(obj, id) {
      return this.getFrom(itemsStorage, obj, id);
    }

    /**
     * Get all items belonging to `obj`.
     *
     * @param {Object} obj
     * @returns {Map}
     */

  }, {
    key: 'getItems',
    value: function getItems(obj) {
      var items = itemsStorage.get(this.id).get(obj);
      if (items) return items;else return new Map();
    }

    /**
     * Remove item identified by `obj` and `id`.
     *
     * @param {Object} obj
     * @param {number} id
     */

  }, {
    key: 'removeItem',
    value: function removeItem(obj, id) {
      var currentServiceTemp = itemsStorage.get(this.id);
      var idMap = currentServiceTemp.get(obj);
      currentServiceTemp.get(obj).delete(id);
      if (idMap.size === 0) currentServiceTemp.delete(obj);
    }

    /**
     * @private
     * @param {Map} storage
     * @param {Object} obj
     * @param {number} id
     *
     * @returns {Object}
     */

  }, {
    key: 'getFrom',
    value: function getFrom(storage, obj, id) {
      var idMap = storage.get(this.id).get(obj);
      if (idMap !== undefined) {
        var item = idMap.get(id);
        if (item !== undefined) return item;
      }
      return null;
    }

    /**
     * @private
     * @param {Map} storage
     * @param {WebChannel} obj
     * @param {number} id
     * @param {Object} data
     *
     */

  }, {
    key: 'setTo',
    value: function setTo(storage, obj, id, data) {
      var currentServiceTemp = storage.get(this.id);
      var idMap = void 0;
      if (currentServiceTemp.has(obj)) {
        idMap = currentServiceTemp.get(obj);
      } else {
        idMap = new Map();
        currentServiceTemp.set(obj, idMap);
      }
      if (!idMap.has(id)) idMap.set(id, data);
    }
  }]);
  return Service;
}();

/**
 * It is responsible to preserve Web Channel
 * structure intact (i.e. all peers have the same vision of the Web Channel).
 * Among its duties are:
 *
 * - Add a new peer into Web Channel.
 * - Remove a peer from Web Channel.
 * - Send a broadcast message.
 * - Send a message to a particular peer.
 *
 * @see FullyConnectedService
 * @interface
 */

var TopologyInterface = function (_Service) {
  inherits(TopologyInterface, _Service);

  function TopologyInterface() {
    classCallCheck(this, TopologyInterface);
    return possibleConstructorReturn(this, (TopologyInterface.__proto__ || Object.getPrototypeOf(TopologyInterface)).apply(this, arguments));
  }

  createClass(TopologyInterface, [{
    key: 'connectTo',
    value: function connectTo(wc, peerIds) {
      var _this2 = this;

      var failed = [];
      if (peerIds.length === 0) return Promise.resolve(failed);else {
        return new Promise(function (resolve, reject) {
          var counter = 0;
          var cBuilder = ServiceFactory.get(CHANNEL_BUILDER);
          peerIds.forEach(function (id) {
            cBuilder.connectTo(wc, id).then(function (channel) {
              return _this2.onChannel(channel);
            }).then(function () {
              if (++counter === peerIds.length) resolve(failed);
            }).catch(function (reason) {
              failed.push({ id: id, reason: reason });
              if (++counter === peerIds.length) resolve(failed);
            });
          });
        });
      }
    }

    /**
     * Adds a new peer into Web Channel.
     *
     * @abstract
     * @param  {Channel} ch - Channel to be added (it should has
     * the `webChannel` property).
     * @return {Promise} - Resolved once the channel has been succesfully added,
     * rejected otherwise.
     */

  }, {
    key: 'add',
    value: function add(ch) {
      throw new Error('Must be implemented by subclass!');
    }

    /**
     * Send a message to all peers in Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel where the message will be propagated.
     * @param  {string} data - Data in stringified JSON format to be send.
     */

  }, {
    key: 'broadcast',
    value: function broadcast(wc, data) {
      throw new Error('Must be implemented by subclass!');
    }

    /**
     * Send a message to a particular peer in Web Channel.
     *
     * @abstract
     * @param  {string} id - Peer id.
     * @param  {WebChannel} wc - Web Channel where the message will be propagated.
     * @param  {string} data - Data in stringified JSON format to be send.
     */

  }, {
    key: 'sendTo',
    value: function sendTo(id, wc, data) {
      throw new Error('Must be implemented by subclass!');
    }

    /**
     * Leave Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel to leave.
     */

  }, {
    key: 'leave',
    value: function leave(wc) {
      throw new Error('Must be implemented by subclass!');
    }
  }]);
  return TopologyInterface;
}(Service);

/**
 * One of the internal message type. The message is intended for the `WebChannel`
 * members to notify them about the joining peer.
 * @type {number}
 */
var SHOULD_ADD_NEW_JOINING_PEER = 1;
/**
 * Connection service of the peer who received a message of this type should
 * establish connection with one or several peers.
 */
var SHOULD_CONNECT_TO = 2;
/**
 * One of the internal message type. The message sent by the joining peer to
 * notify all `WebChannel` members about his arrivel.
 * @type {number}
 */
var PEER_JOINED = 3;

var TICK = 4;
var TOCK = 5;

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */

var FullyConnectedService = function (_TopologyInterface) {
  inherits(FullyConnectedService, _TopologyInterface);

  function FullyConnectedService() {
    classCallCheck(this, FullyConnectedService);
    return possibleConstructorReturn(this, (FullyConnectedService.__proto__ || Object.getPrototypeOf(FullyConnectedService)).apply(this, arguments));
  }

  createClass(FullyConnectedService, [{
    key: 'add',


    /**
     * Add a peer to the `WebChannel`.
     *
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {Promise<number, string>}
     */
    value: function add(channel) {
      var _this2 = this;

      var wc = channel.webChannel;
      var peers = wc.members.slice();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItems', this).call(this, wc).keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var jpId = _step.value;
          peers[peers.length] = jpId;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.setJP(wc, channel.peerId, channel);
      wc.sendInner(this.id, { code: SHOULD_ADD_NEW_JOINING_PEER, jpId: channel.peerId });
      wc.sendInnerTo(channel, this.id, { code: SHOULD_CONNECT_TO, peers: peers });
      return new Promise(function (resolve, reject) {
        get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'setPendingRequest', _this2).call(_this2, wc, channel.peerId, { resolve: resolve, reject: reject });
      });
    }

    /**
     * Send message to all `WebChannel` members.
     *
     * @param {WebChannel} webChannel
     * @param {ArrayBuffer} data
     */

  }, {
    key: 'broadcast',
    value: function broadcast(webChannel, data) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = webChannel.channels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var c = _step2.value;
          c.send(data);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'sendTo',
    value: function sendTo(id, webChannel, data) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = webChannel.channels[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var c = _step3.value;

          if (c.peerId === id) {
            c.send(data);
            return;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: 'sendInnerTo',
    value: function sendInnerTo(recepient, wc, data) {
      // If the peer sent a message to himself
      if (recepient === wc.myId) wc.onChannelMessage(null, data);else {
        var jp = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, wc.myId);
        if (jp === null) jp = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, recepient);

        if (jp !== null) {
          // If me or recepient is joining the WebChannel
          jp.channel.send(data);
        } else if (wc.members.includes(recepient)) {
          // If recepient is a WebChannel member
          this.sendTo(recepient, wc, data);
        } else this.sendTo(wc.members[0], wc, data);
      }
    }
  }, {
    key: 'sendInner',
    value: function sendInner(wc, data) {
      var jp = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, wc.myId);
      if (jp === null) this.broadcast(wc, data);else jp.channel.send(data);
    }
  }, {
    key: 'leave',
    value: function leave(wc) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = wc.channels[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var c = _step4.value;

          c.clearHandlers();
          c.close();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      wc.channels.clear();
    }
  }, {
    key: 'onChannel',
    value: function onChannel(channel) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'setPendingRequest', _this3).call(_this3, channel.webChannel, channel.peerId, { resolve: resolve, reject: reject });
        channel.webChannel.sendInnerTo(channel, _this3.id, { code: TICK });
      });
    }

    /**
     * Close event handler for each `Channel` in the `WebChannel`.
     *
     * @param {CloseEvent} closeEvt
     * @param {Channel} channel
     *
     * @returns {boolean}
     */

  }, {
    key: 'onChannelClose',
    value: function onChannelClose(closeEvt, channel) {
      // TODO: need to check if this is a peer leaving and thus he closed channels
      // with all WebChannel members or this is abnormal channel closing
      var wc = channel.webChannel;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = wc.channels[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var c = _step5.value;

          if (c.peerId === channel.peerId) return wc.channels.delete(c);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      var jps = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItems', this).call(this, wc);
      jps.forEach(function (jp) {
        return jp.channels.delete(channel);
      });
      return false;
    }

    /**
     * Error event handler for each `Channel` in the `WebChannel`.
     *
     * @param {Event} evt
     * @param {Channel} channel
     */

  }, {
    key: 'onChannelError',
    value: function onChannelError(evt, channel) {
      console.error('Channel error with id: ' + channel.peerId + ': ', evt);
    }
  }, {
    key: 'onMessage',
    value: function onMessage(channel, senderId, recepientId, msg) {
      var _this4 = this;

      var wc = channel.webChannel;
      var jpMe = void 0;
      switch (msg.code) {
        case SHOULD_CONNECT_TO:
          jpMe = this.setJP(wc, wc.myId, channel);
          jpMe.channels.add(channel);
          get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'connectTo', this).call(this, wc, msg.peers).then(function (failed) {
            var msg = { code: PEER_JOINED };
            jpMe.channels.forEach(function (ch) {
              wc.sendInnerTo(ch, _this4.id, msg);
              wc.channels.add(ch);
              wc.onPeerJoin$(ch.peerId);
            });
            get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'removeItem', _this4).call(_this4, wc, wc.myId);
            get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItems', _this4).call(_this4, wc).forEach(function (jp) {
              return wc.sendInnerTo(jp.channel, _this4.id, msg);
            });
            wc.onJoin();
          });
          break;
        case PEER_JOINED:
          jpMe = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, wc.myId);
          get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'removeItem', this).call(this, wc, senderId);
          if (jpMe !== null) jpMe.channels.add(channel);else {
            wc.channels.add(channel);
            wc.onPeerJoin$(senderId);
            var request = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getPendingRequest', this).call(this, wc, senderId);
            if (request !== null) request.resolve(senderId);
          }
          break;
        case TICK:
          {
            this.setJP(wc, senderId, channel);
            var isJoining = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, wc.myId) !== null;
            wc.sendInnerTo(channel, this.id, { code: TOCK, isJoining: isJoining });
            break;
          }
        case TOCK:
          if (msg.isJoining) this.setJP(wc, senderId, channel);else get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, wc.myId).channels.add(channel);
          get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getPendingRequest', this).call(this, wc, senderId).resolve();
          break;
        case SHOULD_ADD_NEW_JOINING_PEER:
          this.setJP(wc, msg.jpId, channel);
          break;
      }
    }

    /**
     * @private
     * @param {WebChannel} wc
     * @param {number} jpId
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {type} Description
     */

  }, {
    key: 'setJP',
    value: function setJP(wc, jpId, channel) {
      var jp = get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'getItem', this).call(this, wc, jpId);
      if (!jp) {
        jp = new JoiningPeer(channel);
        get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'setItem', this).call(this, wc, jpId, jp);
      } else jp.channel = channel;
      return jp;
    }
  }]);
  return FullyConnectedService;
}(TopologyInterface);

/**
 * This class represents a temporary state of a peer, while he is about to join
 * the web channel. During the joining process every peer in the web channel
 * and the joining peer have an instance of this class with the same `id` and
 * `intermediaryId` attribute values. After the joining process has been finished
 * regardless of success, these instances will be deleted.
 */


var JoiningPeer = function JoiningPeer(channel, onJoin) {
  classCallCheck(this, JoiningPeer);

  /**
   * The channel between the joining peer and intermediary peer. It is null
   * for every peer, but the joining and intermediary peers.
   *
   * @type {Channel}
   */
  this.channel = channel;

  /**
   * This attribute is proper to each peer. Array of channels which will be
   * added to the current peer once it becomes the member of the web channel.
   * @type {Channel[]}
   */
  this.channels = new Set();
};

!function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = "function" == typeof require && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) {
    s(r[o]);
  }return s;
}({ 1: [function (require, module, exports) {}, {}], 2: [function (require, module, exports) {
    "use strict";
    !function () {
      var utils = require("./utils"),
          logging = utils.log,
          browserDetails = utils.browserDetails;module.exports.browserDetails = browserDetails, module.exports.extractVersion = utils.extractVersion, module.exports.disableLog = utils.disableLog;var chromeShim = require("./chrome/chrome_shim") || null,
          edgeShim = require("./edge/edge_shim") || null,
          firefoxShim = require("./firefox/firefox_shim") || null,
          safariShim = require("./safari/safari_shim") || null;switch (browserDetails.browser) {case "chrome":
          if (!chromeShim || !chromeShim.shimPeerConnection) return void logging("Chrome shim is not included in this adapter release.");logging("adapter.js shimming chrome."), module.exports.browserShim = chromeShim, chromeShim.shimGetUserMedia(), chromeShim.shimMediaStream(), utils.shimCreateObjectURL(), chromeShim.shimSourceObject(), chromeShim.shimPeerConnection(), chromeShim.shimOnTrack(), chromeShim.shimGetSendersWithDtmf();break;case "firefox":
          if (!firefoxShim || !firefoxShim.shimPeerConnection) return void logging("Firefox shim is not included in this adapter release.");logging("adapter.js shimming firefox."), module.exports.browserShim = firefoxShim, firefoxShim.shimGetUserMedia(), utils.shimCreateObjectURL(), firefoxShim.shimSourceObject(), firefoxShim.shimPeerConnection(), firefoxShim.shimOnTrack();break;case "edge":
          if (!edgeShim || !edgeShim.shimPeerConnection) return void logging("MS edge shim is not included in this adapter release.");logging("adapter.js shimming edge."), module.exports.browserShim = edgeShim, edgeShim.shimGetUserMedia(), utils.shimCreateObjectURL(), edgeShim.shimPeerConnection();break;case "safari":
          if (!safariShim) return void logging("Safari shim is not included in this adapter release.");logging("adapter.js shimming safari."), module.exports.browserShim = safariShim, safariShim.shimGetUserMedia();break;default:
          logging("Unsupported browser!");}
    }();
  }, { "./chrome/chrome_shim": 3, "./edge/edge_shim": 1, "./firefox/firefox_shim": 5, "./safari/safari_shim": 7, "./utils": 8 }], 3: [function (require, module, exports) {
    "use strict";
    var logging = require("../utils.js").log,
        browserDetails = require("../utils.js").browserDetails,
        chromeShim = { shimMediaStream: function shimMediaStream() {
        window.MediaStream = window.MediaStream || window.webkitMediaStream;
      }, shimOnTrack: function shimOnTrack() {
        "object" != (typeof window === "undefined" ? "undefined" : _typeof(window)) || !window.RTCPeerConnection || "ontrack" in window.RTCPeerConnection.prototype || Object.defineProperty(window.RTCPeerConnection.prototype, "ontrack", { get: function get$$1() {
            return this._ontrack;
          }, set: function set$$1(f) {
            var self = this;this._ontrack && (this.removeEventListener("track", this._ontrack), this.removeEventListener("addstream", this._ontrackpoly)), this.addEventListener("track", this._ontrack = f), this.addEventListener("addstream", this._ontrackpoly = function (e) {
              e.stream.addEventListener("addtrack", function (te) {
                var event = new Event("track");event.track = te.track, event.receiver = { track: te.track }, event.streams = [e.stream], self.dispatchEvent(event);
              }), e.stream.getTracks().forEach(function (track) {
                var event = new Event("track");event.track = track, event.receiver = { track: track }, event.streams = [e.stream], this.dispatchEvent(event);
              }.bind(this));
            }.bind(this));
          } });
      }, shimGetSendersWithDtmf: function shimGetSendersWithDtmf() {
        if ("object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && window.RTCPeerConnection && !("getSenders" in RTCPeerConnection.prototype) && "createDTMFSender" in RTCPeerConnection.prototype) {
          RTCPeerConnection.prototype.getSenders = function () {
            return this._senders;
          };var origAddStream = RTCPeerConnection.prototype.addStream,
              origRemoveStream = RTCPeerConnection.prototype.removeStream;RTCPeerConnection.prototype.addStream = function (stream) {
            var pc = this;pc._senders = pc._senders || [], origAddStream.apply(pc, [stream]), stream.getTracks().forEach(function (track) {
              pc._senders.push({ track: track, get dtmf() {
                  return void 0 === this._dtmf && ("audio" === track.kind ? this._dtmf = pc.createDTMFSender(track) : this._dtmf = null), this._dtmf;
                } });
            });
          }, RTCPeerConnection.prototype.removeStream = function (stream) {
            var pc = this;pc._senders = pc._senders || [], origRemoveStream.apply(pc, [stream]), stream.getTracks().forEach(function (track) {
              var sender = pc._senders.find(function (s) {
                return s.track === track;
              });sender && pc._senders.splice(pc._senders.indexOf(sender), 1);
            });
          };
        }
      }, shimSourceObject: function shimSourceObject() {
        "object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && (!window.HTMLMediaElement || "srcObject" in window.HTMLMediaElement.prototype || Object.defineProperty(window.HTMLMediaElement.prototype, "srcObject", { get: function get$$1() {
            return this._srcObject;
          }, set: function set$$1(stream) {
            var self = this;if (this._srcObject = stream, this.src && URL.revokeObjectURL(this.src), !stream) return void (this.src = "");this.src = URL.createObjectURL(stream), stream.addEventListener("addtrack", function () {
              self.src && URL.revokeObjectURL(self.src), self.src = URL.createObjectURL(stream);
            }), stream.addEventListener("removetrack", function () {
              self.src && URL.revokeObjectURL(self.src), self.src = URL.createObjectURL(stream);
            });
          } }));
      }, shimPeerConnection: function shimPeerConnection() {
        window.RTCPeerConnection || (window.RTCPeerConnection = function (pcConfig, pcConstraints) {
          return logging("PeerConnection"), pcConfig && pcConfig.iceTransportPolicy && (pcConfig.iceTransports = pcConfig.iceTransportPolicy), new webkitRTCPeerConnection(pcConfig, pcConstraints);
        }, window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype, webkitRTCPeerConnection.generateCertificate && Object.defineProperty(window.RTCPeerConnection, "generateCertificate", { get: function get$$1() {
            return webkitRTCPeerConnection.generateCertificate;
          } }));var origGetStats = RTCPeerConnection.prototype.getStats;RTCPeerConnection.prototype.getStats = function (selector, successCallback, errorCallback) {
          var self = this,
              args = arguments;if (arguments.length > 0 && "function" == typeof selector) return origGetStats.apply(this, arguments);if (0 === origGetStats.length && (0 === arguments.length || "function" != typeof arguments[0])) return origGetStats.apply(this, []);var fixChromeStats_ = function fixChromeStats_(response) {
            var standardReport = {};return response.result().forEach(function (report) {
              var standardStats = { id: report.id, timestamp: report.timestamp, type: { localcandidate: "local-candidate", remotecandidate: "remote-candidate" }[report.type] || report.type };report.names().forEach(function (name) {
                standardStats[name] = report.stat(name);
              }), standardReport[standardStats.id] = standardStats;
            }), standardReport;
          },
              makeMapStats = function makeMapStats(stats) {
            return new Map(Object.keys(stats).map(function (key) {
              return [key, stats[key]];
            }));
          };if (arguments.length >= 2) {
            var successCallbackWrapper_ = function successCallbackWrapper_(response) {
              args[1](makeMapStats(fixChromeStats_(response)));
            };return origGetStats.apply(this, [successCallbackWrapper_, arguments[0]]);
          }return new Promise(function (resolve, reject) {
            origGetStats.apply(self, [function (response) {
              resolve(makeMapStats(fixChromeStats_(response)));
            }, reject]);
          }).then(successCallback, errorCallback);
        }, browserDetails.version < 51 && ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function (method) {
          var nativeMethod = RTCPeerConnection.prototype[method];RTCPeerConnection.prototype[method] = function () {
            var args = arguments,
                self = this,
                promise = new Promise(function (resolve, reject) {
              nativeMethod.apply(self, [args[0], resolve, reject]);
            });return args.length < 2 ? promise : promise.then(function () {
              args[1].apply(null, []);
            }, function (err) {
              args.length >= 3 && args[2].apply(null, [err]);
            });
          };
        }), browserDetails.version < 52 && ["createOffer", "createAnswer"].forEach(function (method) {
          var nativeMethod = RTCPeerConnection.prototype[method];RTCPeerConnection.prototype[method] = function () {
            var self = this;if (arguments.length < 1 || 1 === arguments.length && "object" == _typeof(arguments[0])) {
              var opts = 1 === arguments.length ? arguments[0] : void 0;return new Promise(function (resolve, reject) {
                nativeMethod.apply(self, [resolve, reject, opts]);
              });
            }return nativeMethod.apply(this, arguments);
          };
        }), ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function (method) {
          var nativeMethod = RTCPeerConnection.prototype[method];RTCPeerConnection.prototype[method] = function () {
            return arguments[0] = new ("addIceCandidate" === method ? RTCIceCandidate : RTCSessionDescription)(arguments[0]), nativeMethod.apply(this, arguments);
          };
        });var nativeAddIceCandidate = RTCPeerConnection.prototype.addIceCandidate;RTCPeerConnection.prototype.addIceCandidate = function () {
          return arguments[0] ? nativeAddIceCandidate.apply(this, arguments) : (arguments[1] && arguments[1].apply(null), Promise.resolve());
        };
      } };module.exports = { shimMediaStream: chromeShim.shimMediaStream, shimOnTrack: chromeShim.shimOnTrack, shimGetSendersWithDtmf: chromeShim.shimGetSendersWithDtmf, shimSourceObject: chromeShim.shimSourceObject, shimPeerConnection: chromeShim.shimPeerConnection, shimGetUserMedia: require("./getusermedia") };
  }, { "../utils.js": 8, "./getusermedia": 4 }], 4: [function (require, module, exports) {
    "use strict";
    var logging = require("../utils.js").log,
        browserDetails = require("../utils.js").browserDetails;module.exports = function () {
      var constraintsToChrome_ = function constraintsToChrome_(c) {
        if ("object" != (typeof c === "undefined" ? "undefined" : _typeof(c)) || c.mandatory || c.optional) return c;var cc = {};return Object.keys(c).forEach(function (key) {
          if ("require" !== key && "advanced" !== key && "mediaSource" !== key) {
            var r = "object" == _typeof(c[key]) ? c[key] : { ideal: c[key] };void 0 !== r.exact && "number" == typeof r.exact && (r.min = r.max = r.exact);var oldname_ = function oldname_(prefix, name) {
              return prefix ? prefix + name.charAt(0).toUpperCase() + name.slice(1) : "deviceId" === name ? "sourceId" : name;
            };if (void 0 !== r.ideal) {
              cc.optional = cc.optional || [];var oc = {};"number" == typeof r.ideal ? (oc[oldname_("min", key)] = r.ideal, cc.optional.push(oc), oc = {}, oc[oldname_("max", key)] = r.ideal, cc.optional.push(oc)) : (oc[oldname_("", key)] = r.ideal, cc.optional.push(oc));
            }void 0 !== r.exact && "number" != typeof r.exact ? (cc.mandatory = cc.mandatory || {}, cc.mandatory[oldname_("", key)] = r.exact) : ["min", "max"].forEach(function (mix) {
              void 0 !== r[mix] && (cc.mandatory = cc.mandatory || {}, cc.mandatory[oldname_(mix, key)] = r[mix]);
            });
          }
        }), c.advanced && (cc.optional = (cc.optional || []).concat(c.advanced)), cc;
      },
          shimConstraints_ = function shimConstraints_(constraints, func) {
        if (constraints = JSON.parse(JSON.stringify(constraints)), constraints && constraints.audio && (constraints.audio = constraintsToChrome_(constraints.audio)), constraints && "object" == _typeof(constraints.video)) {
          var face = constraints.video.facingMode;face = face && ("object" == (typeof face === "undefined" ? "undefined" : _typeof(face)) ? face : { ideal: face });var getSupportedFacingModeLies = browserDetails.version < 59;if (face && ("user" === face.exact || "environment" === face.exact || "user" === face.ideal || "environment" === face.ideal) && (!navigator.mediaDevices.getSupportedConstraints || !navigator.mediaDevices.getSupportedConstraints().facingMode || getSupportedFacingModeLies) && (delete constraints.video.facingMode, "environment" === face.exact || "environment" === face.ideal)) return navigator.mediaDevices.enumerateDevices().then(function (devices) {
            devices = devices.filter(function (d) {
              return "videoinput" === d.kind;
            });var back = devices.find(function (d) {
              return d.label.toLowerCase().indexOf("back") !== -1;
            }) || devices.length && devices[devices.length - 1];return back && (constraints.video.deviceId = face.exact ? { exact: back.deviceId } : { ideal: back.deviceId }), constraints.video = constraintsToChrome_(constraints.video), logging("chrome: " + JSON.stringify(constraints)), func(constraints);
          });constraints.video = constraintsToChrome_(constraints.video);
        }return logging("chrome: " + JSON.stringify(constraints)), func(constraints);
      },
          shimError_ = function shimError_(e) {
        return { name: { PermissionDeniedError: "NotAllowedError", ConstraintNotSatisfiedError: "OverconstrainedError" }[e.name] || e.name, message: e.message, constraint: e.constraintName, toString: function toString() {
            return this.name + (this.message && ": ") + this.message;
          } };
      },
          getUserMedia_ = function getUserMedia_(constraints, onSuccess, onError) {
        shimConstraints_(constraints, function (c) {
          navigator.webkitGetUserMedia(c, onSuccess, function (e) {
            onError(shimError_(e));
          });
        });
      };navigator.getUserMedia = getUserMedia_;var getUserMediaPromise_ = function getUserMediaPromise_(constraints) {
        return new Promise(function (resolve, reject) {
          navigator.getUserMedia(constraints, resolve, reject);
        });
      };if (navigator.mediaDevices || (navigator.mediaDevices = { getUserMedia: getUserMediaPromise_, enumerateDevices: function enumerateDevices() {
          return new Promise(function (resolve) {
            var kinds = { audio: "audioinput", video: "videoinput" };return MediaStreamTrack.getSources(function (devices) {
              resolve(devices.map(function (device) {
                return { label: device.label, kind: kinds[device.kind], deviceId: device.id, groupId: "" };
              }));
            });
          });
        }, getSupportedConstraints: function getSupportedConstraints() {
          return { deviceId: !0, echoCancellation: !0, facingMode: !0, frameRate: !0, height: !0, width: !0 };
        } }), navigator.mediaDevices.getUserMedia) {
        var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia = function (cs) {
          return shimConstraints_(cs, function (c) {
            return origGetUserMedia(c).then(function (stream) {
              if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) throw stream.getTracks().forEach(function (track) {
                track.stop();
              }), new DOMException("", "NotFoundError");return stream;
            }, function (e) {
              return Promise.reject(shimError_(e));
            });
          });
        };
      } else navigator.mediaDevices.getUserMedia = function (constraints) {
        return getUserMediaPromise_(constraints);
      };void 0 === navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener = function () {
        logging("Dummy mediaDevices.addEventListener called.");
      }), void 0 === navigator.mediaDevices.removeEventListener && (navigator.mediaDevices.removeEventListener = function () {
        logging("Dummy mediaDevices.removeEventListener called.");
      });
    };
  }, { "../utils.js": 8 }], 5: [function (require, module, exports) {
    "use strict";
    var browserDetails = require("../utils").browserDetails,
        firefoxShim = { shimOnTrack: function shimOnTrack() {
        "object" != (typeof window === "undefined" ? "undefined" : _typeof(window)) || !window.RTCPeerConnection || "ontrack" in window.RTCPeerConnection.prototype || Object.defineProperty(window.RTCPeerConnection.prototype, "ontrack", { get: function get$$1() {
            return this._ontrack;
          }, set: function set$$1(f) {
            this._ontrack && (this.removeEventListener("track", this._ontrack), this.removeEventListener("addstream", this._ontrackpoly)), this.addEventListener("track", this._ontrack = f), this.addEventListener("addstream", this._ontrackpoly = function (e) {
              e.stream.getTracks().forEach(function (track) {
                var event = new Event("track");event.track = track, event.receiver = { track: track }, event.streams = [e.stream], this.dispatchEvent(event);
              }.bind(this));
            }.bind(this));
          } });
      }, shimSourceObject: function shimSourceObject() {
        "object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && (!window.HTMLMediaElement || "srcObject" in window.HTMLMediaElement.prototype || Object.defineProperty(window.HTMLMediaElement.prototype, "srcObject", { get: function get$$1() {
            return this.mozSrcObject;
          }, set: function set$$1(stream) {
            this.mozSrcObject = stream;
          } }));
      }, shimPeerConnection: function shimPeerConnection() {
        if ("object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && (window.RTCPeerConnection || window.mozRTCPeerConnection)) {
          window.RTCPeerConnection || (window.RTCPeerConnection = function (pcConfig, pcConstraints) {
            if (browserDetails.version < 38 && pcConfig && pcConfig.iceServers) {
              for (var newIceServers = [], i = 0; i < pcConfig.iceServers.length; i++) {
                var server = pcConfig.iceServers[i];if (server.hasOwnProperty("urls")) for (var j = 0; j < server.urls.length; j++) {
                  var newServer = { url: server.urls[j] };0 === server.urls[j].indexOf("turn") && (newServer.username = server.username, newServer.credential = server.credential), newIceServers.push(newServer);
                } else newIceServers.push(pcConfig.iceServers[i]);
              }pcConfig.iceServers = newIceServers;
            }return new mozRTCPeerConnection(pcConfig, pcConstraints);
          }, window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype, mozRTCPeerConnection.generateCertificate && Object.defineProperty(window.RTCPeerConnection, "generateCertificate", { get: function get$$1() {
              return mozRTCPeerConnection.generateCertificate;
            } }), window.RTCSessionDescription = mozRTCSessionDescription, window.RTCIceCandidate = mozRTCIceCandidate), ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function (method) {
            var nativeMethod = RTCPeerConnection.prototype[method];RTCPeerConnection.prototype[method] = function () {
              return arguments[0] = new ("addIceCandidate" === method ? RTCIceCandidate : RTCSessionDescription)(arguments[0]), nativeMethod.apply(this, arguments);
            };
          });var nativeAddIceCandidate = RTCPeerConnection.prototype.addIceCandidate;RTCPeerConnection.prototype.addIceCandidate = function () {
            return arguments[0] ? nativeAddIceCandidate.apply(this, arguments) : (arguments[1] && arguments[1].apply(null), Promise.resolve());
          };var makeMapStats = function makeMapStats(stats) {
            var map = new Map();return Object.keys(stats).forEach(function (key) {
              map.set(key, stats[key]), map[key] = stats[key];
            }), map;
          },
              modernStatsTypes = { inboundrtp: "inbound-rtp", outboundrtp: "outbound-rtp", candidatepair: "candidate-pair", localcandidate: "local-candidate", remotecandidate: "remote-candidate" },
              nativeGetStats = RTCPeerConnection.prototype.getStats;RTCPeerConnection.prototype.getStats = function (selector, onSucc, onErr) {
            return nativeGetStats.apply(this, [selector || null]).then(function (stats) {
              if (browserDetails.version < 48 && (stats = makeMapStats(stats)), browserDetails.version < 53 && !onSucc) try {
                stats.forEach(function (stat) {
                  stat.type = modernStatsTypes[stat.type] || stat.type;
                });
              } catch (e) {
                if ("TypeError" !== e.name) throw e;stats.forEach(function (stat, i) {
                  stats.set(i, Object.assign({}, stat, { type: modernStatsTypes[stat.type] || stat.type }));
                });
              }return stats;
            }).then(onSucc, onErr);
          };
        }
      } };module.exports = { shimOnTrack: firefoxShim.shimOnTrack, shimSourceObject: firefoxShim.shimSourceObject, shimPeerConnection: firefoxShim.shimPeerConnection, shimGetUserMedia: require("./getusermedia") };
  }, { "../utils": 8, "./getusermedia": 6 }], 6: [function (require, module, exports) {
    "use strict";
    var logging = require("../utils").log,
        browserDetails = require("../utils").browserDetails;module.exports = function () {
      var shimError_ = function shimError_(e) {
        return { name: { SecurityError: "NotAllowedError", PermissionDeniedError: "NotAllowedError" }[e.name] || e.name, message: { "The operation is insecure.": "The request is not allowed by the user agent or the platform in the current context." }[e.message] || e.message, constraint: e.constraint, toString: function toString() {
            return this.name + (this.message && ": ") + this.message;
          } };
      },
          getUserMedia_ = function getUserMedia_(constraints, onSuccess, onError) {
        var constraintsToFF37_ = function constraintsToFF37_(c) {
          if ("object" != (typeof c === "undefined" ? "undefined" : _typeof(c)) || c.require) return c;var require = [];return Object.keys(c).forEach(function (key) {
            if ("require" !== key && "advanced" !== key && "mediaSource" !== key) {
              var r = c[key] = "object" == _typeof(c[key]) ? c[key] : { ideal: c[key] };if (void 0 === r.min && void 0 === r.max && void 0 === r.exact || require.push(key), void 0 !== r.exact && ("number" == typeof r.exact ? r.min = r.max = r.exact : c[key] = r.exact, delete r.exact), void 0 !== r.ideal) {
                c.advanced = c.advanced || [];var oc = {};"number" == typeof r.ideal ? oc[key] = { min: r.ideal, max: r.ideal } : oc[key] = r.ideal, c.advanced.push(oc), delete r.ideal, Object.keys(r).length || delete c[key];
              }
            }
          }), require.length && (c.require = require), c;
        };return constraints = JSON.parse(JSON.stringify(constraints)), browserDetails.version < 38 && (logging("spec: " + JSON.stringify(constraints)), constraints.audio && (constraints.audio = constraintsToFF37_(constraints.audio)), constraints.video && (constraints.video = constraintsToFF37_(constraints.video)), logging("ff37: " + JSON.stringify(constraints))), navigator.mozGetUserMedia(constraints, onSuccess, function (e) {
          onError(shimError_(e));
        });
      },
          getUserMediaPromise_ = function getUserMediaPromise_(constraints) {
        return new Promise(function (resolve, reject) {
          getUserMedia_(constraints, resolve, reject);
        });
      };if (navigator.mediaDevices || (navigator.mediaDevices = { getUserMedia: getUserMediaPromise_, addEventListener: function addEventListener() {}, removeEventListener: function removeEventListener() {} }), navigator.mediaDevices.enumerateDevices = navigator.mediaDevices.enumerateDevices || function () {
        return new Promise(function (resolve) {
          resolve([{ kind: "audioinput", deviceId: "default", label: "", groupId: "" }, { kind: "videoinput", deviceId: "default", label: "", groupId: "" }]);
        });
      }, browserDetails.version < 41) {
        var orgEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);navigator.mediaDevices.enumerateDevices = function () {
          return orgEnumerateDevices().then(void 0, function (e) {
            if ("NotFoundError" === e.name) return [];throw e;
          });
        };
      }if (browserDetails.version < 49) {
        var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia = function (c) {
          return origGetUserMedia(c).then(function (stream) {
            if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) throw stream.getTracks().forEach(function (track) {
              track.stop();
            }), new DOMException("The object can not be found here.", "NotFoundError");return stream;
          }, function (e) {
            return Promise.reject(shimError_(e));
          });
        };
      }navigator.getUserMedia = function (constraints, onSuccess, onError) {
        if (browserDetails.version < 44) return getUserMedia_(constraints, onSuccess, onError);console.warn("navigator.getUserMedia has been replaced by navigator.mediaDevices.getUserMedia"), navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
      };
    };
  }, { "../utils": 8 }], 7: [function (require, module, exports) {
    "use strict";
    var safariShim = { shimGetUserMedia: function shimGetUserMedia() {
        navigator.getUserMedia || (navigator.webkitGetUserMedia ? navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator) : navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (navigator.getUserMedia = function (constraints, cb, errcb) {
          navigator.mediaDevices.getUserMedia(constraints).then(cb, errcb);
        }.bind(navigator)));
      } };module.exports = { shimGetUserMedia: safariShim.shimGetUserMedia };
  }, {}], 8: [function (require, module, exports) {
    "use strict";
    var logDisabled_ = !0,
        utils = { disableLog: function disableLog(bool) {
        return "boolean" != typeof bool ? new Error("Argument type: " + (typeof bool === "undefined" ? "undefined" : _typeof(bool)) + ". Please use a boolean.") : (logDisabled_ = bool, bool ? "adapter.js logging disabled" : "adapter.js logging enabled");
      }, log: function log() {
        if ("object" == (typeof window === "undefined" ? "undefined" : _typeof(window))) {
          if (logDisabled_) return;"undefined" != typeof console && "function" == typeof console.log && console.log.apply(console, arguments);
        }
      }, extractVersion: function extractVersion(uastring, expr, pos) {
        var match = uastring.match(expr);return match && match.length >= pos && parseInt(match[pos], 10);
      }, detectBrowser: function detectBrowser() {
        var result = {};if (result.browser = null, result.version = null, "undefined" == typeof window || !window.navigator) return result.browser = "Not a browser.", result;if (navigator.mozGetUserMedia) result.browser = "firefox", result.version = this.extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1);else if (navigator.webkitGetUserMedia) {
          if (window.webkitRTCPeerConnection) result.browser = "chrome", result.version = this.extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);else {
            if (!navigator.userAgent.match(/Version\/(\d+).(\d+)/)) return result.browser = "Unsupported webkit-based browser with GUM support but no WebRTC support.", result;result.browser = "safari", result.version = this.extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
          }
        } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) result.browser = "edge", result.version = this.extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);else {
          if (!navigator.mediaDevices || !navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) return result.browser = "Not a supported browser.", result;result.browser = "safari", result.version = this.extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
        }return result;
      }, shimCreateObjectURL: function shimCreateObjectURL() {
        if ("object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && window.HTMLMediaElement && "srcObject" in window.HTMLMediaElement.prototype) {
          var nativeCreateObjectURL = URL.createObjectURL.bind(URL),
              nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL),
              streams = new Map(),
              newId = 0;URL.createObjectURL = function (stream) {
            if ("getTracks" in stream) {
              var url = "polyblob:" + ++newId;return streams.set(url, stream), console.log("URL.createObjectURL(stream) is deprecated! Use elem.srcObject = stream instead!"), url;
            }return nativeCreateObjectURL(stream);
          }, URL.revokeObjectURL = function (url) {
            nativeRevokeObjectURL(url), streams.delete(url);
          };var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, "src");Object.defineProperty(window.HTMLMediaElement.prototype, "src", { get: function get$$1() {
              return dsc.get.apply(this);
            }, set: function set$$1(url) {
              return this.srcObject = streams.get(url) || null, dsc.set.apply(this, [url]);
            } });var nativeSetAttribute = HTMLMediaElement.prototype.setAttribute;HTMLMediaElement.prototype.setAttribute = function () {
            return 2 === arguments.length && "src" === ("" + arguments[0]).toLowerCase() && (this.srcObject = streams.get(arguments[1]) || null), nativeSetAttribute.apply(this, arguments);
          };
        }
      } };module.exports = { log: utils.log, disableLog: utils.disableLog, browserDetails: utils.detectBrowser(), extractVersion: utils.extractVersion, shimCreateObjectURL: utils.shimCreateObjectURL, detectBrowser: utils.detectBrowser.bind(utils) };
  }, {}] }, {}, [2]);

var NodeCloseEvent = function CloseEvent(name) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  classCallCheck(this, CloseEvent);

  this.name = name;
  this.wasClean = options.wasClean || false;
  this.code = options.code || 0;
  this.reason = options.reason || '';
};

/**
 * Utility class contains some helper static methods.
 */

var Util = function () {
  function Util() {
    classCallCheck(this, Util);
  }

  createClass(Util, null, [{
    key: 'isBrowser',


    /**
     * Check execution environment.
     *
     * @returns {boolean} Description
     */
    value: function isBrowser() {
      if (typeof window === 'undefined' || typeof process !== 'undefined' && process.title === 'node') {
        return false;
      }
      return true;
    }

    /**
     * Check whether the channel is a socket.
     *
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {boolean}
     */

  }, {
    key: 'isSocket',
    value: function isSocket(channel) {
      return channel.constructor.name === 'WebSocket';
    }

    /**
     * Check whether the string is a valid URL.
     *
     * @param {string} str
     *
     * @returns {type} Description
     */

  }, {
    key: 'isURL',
    value: function isURL(str) {
      var regex = '^' +
      // protocol identifier
      '(?:(?:wss|ws|http|https)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' + '(?:';

      var tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))?';

      regex +=
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' + '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' + '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' + '|' +
      // host name
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
      // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' + tld + ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' + '$';

      if (!new RegExp(regex, 'i').exec(str)) return false;
      return true;
    }
  }, {
    key: 'require',
    value: function require(libConst) {
      try {
        switch (libConst) {
          case Util.WEB_RTC:
            return window;
          case Util.WEB_SOCKET:
            return window.WebSocket;
          case Util.TEXT_ENCODING:
            return window;
          case Util.EVENT_SOURCE:
            return window.EventSource;
          case Util.FETCH:
            return window.fetch;
          case Util.CLOSE_EVENT:
            return Util.isBrowser() ? window.CloseEvent : NodeCloseEvent;
          default:
            console.error(libConst + ' is unknown library');
            return undefined;
        }
      } catch (err) {
        console.error(err.message);
        return undefined;
      }
    }
  }, {
    key: 'WEB_RTC',
    get: function get$$1() {
      return 1;
    }
  }, {
    key: 'WEB_SOCKET',
    get: function get$$1() {
      return 2;
    }
  }, {
    key: 'TEXT_ENCODING',
    get: function get$$1() {
      return 3;
    }
  }, {
    key: 'EVENT_SOURCE',
    get: function get$$1() {
      return 4;
    }
  }, {
    key: 'FETCH',
    get: function get$$1() {
      return 5;
    }
  }, {
    key: 'CLOSE_EVENT',
    get: function get$$1() {
      return 6;
    }
  }]);
  return Util;
}();

var wrtc = Util.require(Util.WEB_RTC);
var CloseEvent = Util.require(Util.CLOSE_EVENT);

var CONNECT_TIMEOUT = 30000;
var REMOVE_ITEM_TIMEOUT = 5000;

/**
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 */

var WebRTCService = function (_Service) {
  inherits(WebRTCService, _Service);

  /**
   * @param  {number} id Service identifier
   * @param  {RTCIceServer} iceServers WebRTC configuration object
   */
  function WebRTCService(id, iceServers) {
    classCallCheck(this, WebRTCService);

    /**
     * @private
     * @type {RTCIceServer}
     */
    var _this = possibleConstructorReturn(this, (WebRTCService.__proto__ || Object.getPrototypeOf(WebRTCService)).call(this, id));

    _this.iceServers = iceServers;
    return _this;
  }

  /**
   * @param {Channel} channel
   * @param {number} senderId
   * @param {number} recepientId
   * @param {Object} msg
   */


  createClass(WebRTCService, [{
    key: 'onMessage',
    value: function onMessage(channel, senderId, recepientId, msg) {
      var _this2 = this;

      var wc = channel.webChannel;
      var item = get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'getItem', this).call(this, wc, senderId);
      if (!item) {
        item = new CandidatesBuffer();
        get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'setItem', this).call(this, wc, senderId, item);
      }
      if ('offer' in msg) {
        item.pc = this.createPeerConnection(function (candidate) {
          wc.sendInnerTo(senderId, _this2.id, { candidate: candidate });
        });
        this.listenOnDataChannel(item.pc, function (dataCh) {
          setTimeout(function () {
            return get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'removeItem', _this2).call(_this2, wc, senderId);
          }, REMOVE_ITEM_TIMEOUT);
          ServiceFactory.get(CHANNEL_BUILDER).onChannel(wc, dataCh, senderId);
        });
        this.createAnswer(item.pc, msg.offer, item.candidates).then(function (answer) {
          return wc.sendInnerTo(senderId, _this2.id, { answer: answer });
        }).catch(function (err) {
          return console.error('During Establishing dataChannel connection over webChannel: ' + err.message);
        });
      }if ('answer' in msg) {
        item.pc.setRemoteDescription(msg.answer).then(function () {
          return item.pc.addReceivedCandidates(item.candidates);
        }).catch(function (err) {
          return console.error('Set answer (webChannel): ' + err.message);
        });
      } else if ('candidate' in msg) {
        this.addIceCandidate(item, msg.candidate);
      }
    }

    /**
     * Establishes an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
     *
     * @param {WebChannel} wc
     * @param {number} id
     *
     * @returns {Promise<RTCDataChannel, string>}
     */

  }, {
    key: 'connectOverWebChannel',
    value: function connectOverWebChannel(wc, id) {
      var _this3 = this;

      var item = new CandidatesBuffer(this.createPeerConnection(function (candidate) {
        wc.sendInnerTo(id, _this3.id, { candidate: candidate });
      }));
      get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'setItem', this).call(this, wc, id, item);
      return new Promise(function (resolve, reject) {
        setTimeout(reject, CONNECT_TIMEOUT, 'WebRTC connect timeout');
        _this3.createDataChannel(item.pc, function (dataCh) {
          setTimeout(function () {
            return get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'removeItem', _this3).call(_this3, wc, id);
          }, REMOVE_ITEM_TIMEOUT);
          resolve(dataCh);
        });
        _this3.createOffer(item.pc).then(function (offer) {
          return wc.sendInnerTo(id, _this3.id, { offer: offer });
        }).catch(reject);
      });
    }

    /**
     *
     * @param {WebSocket} ws
     * @param {function(channel: RTCDataChannel)} onChannel
     *
     */

  }, {
    key: 'listenFromSignaling',
    value: function listenFromSignaling(ws, onChannel) {
      var _this4 = this;

      ws.onmessage = function (evt) {
        var msg = JSON.parse(evt.data);
        if ('id' in msg && 'data' in msg) {
          var item = get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'getItem', _this4).call(_this4, ws, msg.id);
          if (!item) {
            item = new CandidatesBuffer(_this4.createPeerConnection(function (candidate) {
              if (ws.readyState === 1) ws.send(JSON.stringify({ id: msg.id, data: { candidate: candidate } }));
            }));
            get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'setItem', _this4).call(_this4, ws, msg.id, item);
          }
          if ('offer' in msg.data) {
            _this4.listenOnDataChannel(item.pc, function (dataCh) {
              setTimeout(function () {
                return get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'removeItem', _this4).call(_this4, ws, msg.id);
              }, REMOVE_ITEM_TIMEOUT);
              onChannel(dataCh);
            });
            _this4.createAnswer(item.pc, msg.data.offer, item.candidates).then(function (answer) {
              ws.send(JSON.stringify({ id: msg.id, data: { answer: answer } }));
            }).catch(function (err) {
              console.error('During establishing data channel connection through signaling: ' + err.message);
            });
          } else if ('candidate' in msg.data) {
            _this4.addIceCandidate(item, msg.data.candidate);
          }
        }
      };
    }

    /**
     *
     * @param {type} ws
     * @param {type} key Description
     *
     * @returns {type} Description
     */

  }, {
    key: 'connectOverSignaling',
    value: function connectOverSignaling(ws, key) {
      var _this5 = this;

      var item = new CandidatesBuffer(this.createPeerConnection(function (candidate) {
        if (ws.readyState === 1) ws.send(JSON.stringify({ data: { candidate: candidate } }));
      }));
      get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'setItem', this).call(this, ws, key, item);
      return new Promise(function (resolve, reject) {
        ws.onclose = function (closeEvt) {
          return reject(closeEvt.reason);
        };
        ws.onmessage = function (evt) {
          try {
            var msg = JSON.parse(evt.data);
            if ('data' in msg) {
              if ('answer' in msg.data) {
                item.pc.setRemoteDescription(msg.data.answer).then(function () {
                  return item.pc.addReceivedCandidates(item.candidates);
                }).catch(function (err) {
                  return reject('Set answer (signaling): ' + err.message);
                });
              } else if ('candidate' in msg.data) {
                _this5.addIceCandidate(get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'getItem', _this5).call(_this5, ws, key), msg.data.candidate);
              }
            }
          } catch (err) {
            reject('Unknown message from the server ' + ws.url + ': ' + evt.data);
          }
        };

        _this5.createDataChannel(item.pc, function (dataCh) {
          setTimeout(function () {
            return get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'removeItem', _this5).call(_this5, ws, key);
          }, REMOVE_ITEM_TIMEOUT);
          resolve(dataCh);
        });
        _this5.createOffer(item.pc).then(function (offer) {
          return ws.send(JSON.stringify({ data: { offer: offer } }));
        }).catch(reject);
      });
    }

    /**
     * Creates an SDP offer.
     *
     * @private
     * @param  {RTCPeerConnection} pc
     * @return {Promise<RTCSessionDescription, string>} - Resolved when the offer has been succesfully created,
     * set as local description and sent to the peer.
     */

  }, {
    key: 'createOffer',
    value: function createOffer(pc) {
      return pc.createOffer().then(function (offer) {
        return pc.setLocalDescription(offer);
      }).then(function () {
        return {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        };
      });
    }

    /**
     * Creates an SDP answer.
     *
     * @private
     * @param {RTCPeerConnection} pc
     * @param {string} offer
     * @param {string[]} candidates
     * @return {Promise<RTCSessionDescription, string>} - Resolved when the offer
     *  has been succesfully created, set as local description and sent to the peer.
     */

  }, {
    key: 'createAnswer',
    value: function createAnswer(pc, offer, candidates) {
      return pc.setRemoteDescription(offer).then(function () {
        pc.addReceivedCandidates(candidates);
        return pc.createAnswer();
      }).then(function (answer) {
        return pc.setLocalDescription(answer);
      }).then(function () {
        return {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        };
      });
    }

    /**
     * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
     *
     * @private
     * @param  {function(candidate: Object)} onCandidate
     * candidate event handler.
     * @return {RTCPeerConnection}
     */

  }, {
    key: 'createPeerConnection',
    value: function createPeerConnection(onCandidate) {
      var _this6 = this;

      var pc = new wrtc.RTCPeerConnection({ iceServers: this.iceServers });
      pc.isRemoteDescriptionSet = false;
      pc.addReceivedCandidates = function (candidates) {
        pc.isRemoteDescriptionSet = true;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = candidates[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var c = _step.value;
            _this6.addIceCandidate({ pc: pc }, c);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      };
      pc.onicecandidate = function (evt) {
        if (evt.candidate !== null) {
          var candidate = {
            candidate: evt.candidate.candidate,
            sdpMid: evt.candidate.sdpMid,
            sdpMLineIndex: evt.candidate.sdpMLineIndex
          };
          onCandidate(candidate);
        }
      };
      return pc;
    }

    /**
     *
     * @private
     * @param {RTCPeerConnection} pc
     * @param {function(dc: RTCDataChannel)} onOpen
     *
     */

  }, {
    key: 'createDataChannel',
    value: function createDataChannel(pc, onOpen) {
      var dc = pc.createDataChannel(null);
      dc.onopen = function (evt) {
        return onOpen(dc);
      };
      this.setUpOnDisconnect(pc, dc);
    }

    /**
     *
     * @private
     * @param {RTCPeerConnection} pc
     * @param {function(dc: RTCDataChannel)} onOpen
     *
     */

  }, {
    key: 'listenOnDataChannel',
    value: function listenOnDataChannel(pc, onOpen) {
      var _this7 = this;

      pc.ondatachannel = function (dcEvt) {
        _this7.setUpOnDisconnect(pc, dcEvt.channel);
        dcEvt.channel.onopen = function (evt) {
          return onOpen(dcEvt.channel);
        };
      };
    }

    /**
     * @private
     * @param {RTCPeerConnection} pc
     * @param {RTCDataChannel} dataCh
     */

  }, {
    key: 'setUpOnDisconnect',
    value: function setUpOnDisconnect(pc, dataCh) {
      pc.oniceconnectionstatechange = function () {
        if (pc.iceConnectionState === 'disconnected') {
          if (dataCh.onclose) {
            dataCh.onclose(new CloseEvent('disconnect', {
              code: 4201,
              reason: 'disconnected'
            }));
          }
        }
      };
    }

    /**
     * @private
     * @param {CandidatesBuffer|null} obj
     * @param {string} candidate
     */

  }, {
    key: 'addIceCandidate',
    value: function addIceCandidate(obj, candidate) {
      if (obj !== null && obj.pc && obj.pc.isRemoteDescriptionSet) {
        obj.pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate)).catch(function (evt) {
          return console.error('Add ICE candidate: ' + evt.message);
        });
      } else obj.candidates[obj.candidates.length] = candidate;
    }
  }]);
  return WebRTCService;
}(Service);

/**
 * @private
 */


var CandidatesBuffer = function CandidatesBuffer() {
  var pc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var candidates = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  classCallCheck(this, CandidatesBuffer);

  this.pc = pc;
  this.candidates = candidates;
};

var WebSocket = Util.require(Util.WEB_SOCKET);

var CONNECT_TIMEOUT$1 = 2000;

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */

var WebSocketService = function (_Service) {
  inherits(WebSocketService, _Service);

  function WebSocketService() {
    classCallCheck(this, WebSocketService);
    return possibleConstructorReturn(this, (WebSocketService.__proto__ || Object.getPrototypeOf(WebSocketService)).apply(this, arguments));
  }

  createClass(WebSocketService, [{
    key: 'connect',


    /**
     * Creates WebSocket with server.
     *
     * @param {string} url - Server url
     * @returns {Promise<WebSocket, string>} It is resolved once the WebSocket has been created and rejected otherwise
     */
    value: function connect(url) {
      return new Promise(function (resolve, reject) {
        try {
          var ws = new WebSocket(url);
          ws.onopen = function () {
            return resolve(ws);
          };
          // Timeout for node (otherwise it will loop forever if incorrect address)
          setTimeout(function () {
            if (ws.readyState !== ws.OPEN) {
              reject('WebSocket connection timeout with ' + url + ' within ' + CONNECT_TIMEOUT$1 + 'ms');
            }
          }, CONNECT_TIMEOUT$1);
        } catch (err) {
          reject(err.message);
        }
      });
    }
  }]);
  return WebSocketService;
}(Service);

var EventSource = Util.require(Util.EVENT_SOURCE);
var fetch = Util.require(Util.FETCH);
var CloseEvent$1 = Util.require(Util.CLOSE_EVENT);

var CONNECT_TIMEOUT$2 = 5000;

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */

var EventSourceService = function (_Service) {
  inherits(EventSourceService, _Service);

  function EventSourceService() {
    classCallCheck(this, EventSourceService);
    return possibleConstructorReturn(this, (EventSourceService.__proto__ || Object.getPrototypeOf(EventSourceService)).apply(this, arguments));
  }

  createClass(EventSourceService, [{
    key: 'connect',


    /**
     * Creates RichEventSource object.
     *
     * @param {string} url - Server url
     * @returns {Promise<EventSource, string>} It is resolved once the WebSocket has been created and rejected otherwise
     */
    value: function connect(url) {
      return new Promise(function (resolve, reject) {
        try {
          var res = new RichEventSource(url);
          res.onopen = function () {
            return resolve(res);
          };
          res.onerror = function (err) {
            return reject(err.message);
          };
          // Timeout if "auth" event has not been received.
          setTimeout(function () {
            reject('Authentication event has not been received from ' + url + ' within ' + CONNECT_TIMEOUT$2 + 'ms');
          }, CONNECT_TIMEOUT$2);
        } catch (err) {
          reject(err.message);
        }
      });
    }
  }]);
  return EventSourceService;
}(Service);

var RichEventSource = function () {
  function RichEventSource(url) {
    var _this2 = this;

    classCallCheck(this, RichEventSource);

    this.auth = '';
    this._onopen = function () {};
    this._onerror = function () {};
    this._onclose = function () {};
    this.es = new EventSource(url);
    this.es.addEventListener('auth', function (evtMsg) {
      _this2.auth = evtMsg.data;
      _this2._onopen();
    });
    this.es.addEventListener('close', function (evtMsg) {
      var data = JSON.parse(evtMsg.data);
      _this2.es.close();
      _this2._onclose(new CloseEvent$1('close', {
        wasClean: true,
        code: data.code,
        reason: data.reason
      }));
    });
    this.es.onerror = this._onerror;
  }

  createClass(RichEventSource, [{
    key: 'close',
    value: function close() {
      this.es.close();
      this._onclose(new CloseEvent$1('close', { wasClean: true, code: 1000 }));
    }
  }, {
    key: 'send',
    value: function send() {
      var _this3 = this;

      var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      fetch(this.url, { method: 'POST', body: this.auth + '@' + str }).then(function (response) {
        if (response.status !== 200) {
          _this3._onerror(new Error(response.status + ': ' + response.statusText));
        }
      }).catch(function (err) {
        return _this3._onerror(err);
      });
    }
  }, {
    key: 'CONNECTING',
    get: function get$$1() {
      return this.es.OPEN !== undefined ? this.es.OPEN : 0;
    }
  }, {
    key: 'OPEN',
    get: function get$$1() {
      return this.es.OPEN !== undefined ? this.es.OPEN : 1;
    }
  }, {
    key: 'CLOSED',
    get: function get$$1() {
      return this.es.OPEN !== undefined ? this.es.OPEN : 2;
    }
  }, {
    key: 'url',
    get: function get$$1() {
      return this.es.url;
    }
  }, {
    key: 'readyState',
    get: function get$$1() {
      return this.es.readyState;
    }
  }, {
    key: 'onopen',
    get: function get$$1() {
      return this._onopen;
    },
    set: function set$$1(cb) {
      this._onopen = cb;
    }
  }, {
    key: 'onmessage',
    get: function get$$1() {
      return this.es.onmessage;
    },
    set: function set$$1(cb) {
      this.es.onmessage = cb;
    }
  }, {
    key: 'onclose',
    get: function get$$1() {
      return this._onclose;
    },
    set: function set$$1(cb) {
      this._onclose = cb;
    }
  }, {
    key: 'onerror',
    get: function get$$1() {
      return this._onerror;
    },
    set: function set$$1(cb) {
      this._onerror = cb;
    }
  }]);
  return RichEventSource;
}();

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketService` and `WebRTCService`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */

var ChannelBuilderService = function (_Service) {
  inherits(ChannelBuilderService, _Service);

  /**
   * @param {number} id Service identifier
   */
  function ChannelBuilderService(id) {
    classCallCheck(this, ChannelBuilderService);

    /**
     * @private
     */
    var _this = possibleConstructorReturn(this, (ChannelBuilderService.__proto__ || Object.getPrototypeOf(ChannelBuilderService)).call(this, id));

    _this.WS = [WEB_SOCKET];
    /**
     * @private
     */
    _this.WR = [WEB_RTC];
    /**
     * @private
     */
    _this.WS_WR = [WEB_SOCKET, WEB_RTC];
    /**
     * @private
     */
    _this.WR_WS = [WEB_RTC, WEB_SOCKET];
    return _this;
  }

  /**
   * Establish a channel with the peer identified by `id`.
   *
   * @param {WebChannel} wc
   * @param {number} id
   *
   * @returns {Promise<Channel, string>}
   */


  createClass(ChannelBuilderService, [{
    key: 'connectTo',
    value: function connectTo(wc, id) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'setPendingRequest', _this2).call(_this2, wc, id, { resolve: resolve, reject: reject });
        wc.sendInnerTo(id, _this2.id, _this2.availableConnectors(wc));
      });
    }

    /**
     * @param {WebChannel} wc
     *
     * @returns {{listenOn: string, connectors: number[]}}
     */

  }, {
    key: 'availableConnectors',
    value: function availableConnectors(wc) {
      var res = {};
      var connectors = [];
      if (Util.require(Util.WEB_RTC) !== undefined) {
        connectors[connectors.length] = WEB_RTC;
      }
      if (wc.settings.listenOn !== '') {
        connectors[connectors.length] = WEB_SOCKET;
        res.listenOn = wc.settings.listenOn;
      }
      if (connectors.length === 2 && connectors[0] !== wc.settings.connector) {
        connectors.reverse();
      }
      res.connectors = connectors;
      return res;
    }

    /**
     * @param {WebChannel} wc
     * @param {WebSocket|RTCDataChannel} channel
     * @param {number} senderId
     */

  }, {
    key: 'onChannel',
    value: function onChannel(wc, channel, senderId) {
      var _this3 = this;

      wc.initChannel(channel, senderId).then(function (channel) {
        var pendReq = get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'getPendingRequest', _this3).call(_this3, wc, senderId);
        if (pendReq !== null) pendReq.resolve(channel);
      });
    }

    /**
     * @param {Channel} channel
     * @param {number} senderId
     * @param {number} recepientId
     * @param {Object} msg
     */

  }, {
    key: 'onMessage',
    value: function onMessage(channel, senderId, recepientId, msg) {
      var _this4 = this;

      var wc = channel.webChannel;
      var myConnectObj = this.availableConnectors(wc);
      var myConnectors = myConnectObj.connectors;

      if ('failedReason' in msg) {
        get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'getPendingRequest', this).call(this, wc, senderId).reject(msg.failedReason);
      } else if ('shouldConnect' in msg) {
        if (this.isEqual(msg.shouldConnect, this.WS)) {
          ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn).then(function (channel) {
            channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
            _this4.onChannel(wc, channel, senderId);
          }).catch(function (reason) {
            get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'getPendingRequest', _this4).call(_this4, wc, senderId).reject('Failed to establish a socket: ' + reason);
          });
        } else if (this.isEqual(msg.shouldConnect, this.WS_WR)) {
          ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn).then(function (channel) {
            channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
            _this4.onChannel(wc, channel, senderId);
          }).catch(function (reason) {
            return ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId);
          }).then(function (channel) {
            return _this4.onChannel(wc, channel, senderId);
          }).catch(function (reason) {
            if ('feedbackOnFail' in msg && msg.feedbackOnFail === true) {
              wc.sendInnerTo(senderId, _this4.id, { tryOn: _this4.WS, listenOn: myConnectObj.listenOn });
            } else {
              get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'getPendingRequest', _this4).call(_this4, wc, senderId).reject('Failed to establish a socket and then a data channel: ' + reason);
            }
          });
        }
      } else if ('tryOn' in msg && this.isEqual(msg.tryOn, this.WS)) {
        ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn).then(function (channel) {
          channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
          _this4.onChannel(wc, channel, senderId);
        }).catch(function (reason) {
          return wc.sendInnerTo(senderId, _this4.id, { failedReason: 'Failed to establish a socket: ' + reason });
        });
      } else if ('connectors' in msg) {
        if (!this.isValid(msg.connectors)) {
          wc.sendInnerTo(senderId, this.id, { failedReason: 'Unknown connectors: ' + msg.connectors });
        } else {
          // []
          if (msg.connectors.length === 0) {
            if (myConnectors.length === 0 || this.isEqual(myConnectors, this.WS)) {
              wc.sendInnerTo(senderId, this.id, { failedReason: 'No common connectors' });
            } else {
              wc.sendInnerTo(senderId, this.id, { shouldConnect: this.WS, listenOn: myConnectObj.listenOn });
            }
          }

          // [ws]
          if (this.isEqual(msg.connectors, this.WS)) {
            if (myConnectors.length === 0 || this.isEqual(myConnectors, this.WS)) {
              this.ws(wc, senderId, msg.listenOn);
            } else {
              this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn);
            }
          }

          // [wr]
          if (this.isEqual(msg.connectors, this.WR)) {
            if (myConnectors.length === 0) {
              wc.sendInnerTo(senderId, this.id, { failedReason: 'No common connectors' });
            } else if (this.isEqual(myConnectors, this.WS)) {
              wc.sendInnerTo(senderId, this.id, { shouldConnect: this.WS, listenOn: myConnectObj.listenOn });
            } else if (this.isEqual(myConnectors, this.WR)) {
              ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId).then(function (channel) {
                return _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                wc.sendInnerTo(senderId, _this4.id, { failedReason: 'Failed establish a data channel: ' + reason });
              });
            } else if (this.isEqual(myConnectors, this.WS_WR)) {
              wc.sendInnerTo(senderId, this.id, { shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn });
            } else if (this.isEqual(myConnectors, this.WR_WS)) {
              ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId).then(function (channel) {
                return _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                wc.sendInnerTo(senderId, _this4.id, { shouldConnect: _this4.WS, listenOn: myConnectObj.listenOn });
              });
            }
          }

          // [ws, wr]
          if (this.isEqual(msg.connectors, this.WS_WR)) {
            if (myConnectors.length === 0) {
              this.ws(wc, senderId, msg.listenOn);
            } else if (this.isEqual(myConnectors, this.WS)) {
              this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn);
            } else if (this.isEqual(myConnectors, this.WR)) {
              ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn).then(function (channel) {
                channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
                _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId);
              }).then(function (channel) {
                return _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return wc.sendInnerTo(senderId, _this4.id, { failedReason: 'Failed to establish a socket and then a data channel: ' + reason });
              });
            } else if (this.isEqual(myConnectors, this.WS_WR)) {
              ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn).then(function (channel) {
                channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
                _this4.onChannel(wc, channel, senderId);
              });
            } else if (this.isEqual(myConnectors, this.WR_WS)) {
              wc.sendInnerTo(senderId, this.id, { shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn });
            } else {
              ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn).then(function (channel) {
                channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
                _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId);
              }).then(function (channel) {
                return _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return wc.sendInnerTo(senderId, _this4.id, { shouldConnect: _this4.WS, listenOn: myConnectObj.listenOn });
              });
            }
          }

          // [wr, ws]
          if (this.isEqual(msg.connectors, this.WR_WS)) {
            if (myConnectors.length === 0) {
              this.ws(wc, senderId, msg.listenOn);
            } else if (this.isEqual(myConnectors, this.WS)) {
              this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn);
            } else if (this.isEqual(myConnectors, this.WR)) {
              ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId).then(function (channel) {
                return _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn);
              }).then(function (channel) {
                channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
                _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return wc.sendInnerTo(senderId, _this4.id, { failedReason: 'Failed to establish a data channel and then a socket: ' + reason });
              });
            } else if (this.isEqual(myConnectors, this.WS_WR)) {
              wc.sendInnerTo(senderId, this.id, { shouldConnect: this.WS_WR, feedbackOnFail: true, listenOn: myConnectObj.listenOn });
            } else if (this.isEqual(myConnectors, this.WR_WS)) {
              ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId).then(function (channel) {
                return _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn);
              }).then(function (channel) {
                channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
                _this4.onChannel(wc, channel, senderId);
              }).catch(function (reason) {
                return wc.sendInnerTo(senderId, _this4.id, { shouldConnect: _this4.WS, listenOn: myConnectObj.listenOn });
              });
            }
          }
        }
      }
    }

    /**
     * @private
     * @param {WebChannel} wc
     * @param {number} senderId
     * @param {string} peerWsURL
     * @param {string} myWsURL
     */

  }, {
    key: 'wsWs',
    value: function wsWs(wc, senderId, peerWsURL, myWsURL) {
      var _this5 = this;

      ServiceFactory.get(WEB_SOCKET).connect(peerWsURL).then(function (channel) {
        channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
        _this5.onChannel(wc, channel, senderId);
      }).catch(function (reason) {
        wc.sendInnerTo(senderId, _this5.id, { shouldConnect: _this5.WS, listenOn: myWsURL });
      });
    }

    /**
     * @private
     * @param {WebChannel} wc
     * @param {number} senderId
     * @param {string} peerWsURL
     */

  }, {
    key: 'ws',
    value: function ws(wc, senderId, peerWsURL) {
      var _this6 = this;

      ServiceFactory.get(WEB_SOCKET).connect(peerWsURL).then(function (channel) {
        channel.send(JSON.stringify({ wcId: wc.id, senderId: wc.myId }));
        _this6.onChannel(wc, channel, senderId);
      }).catch(function (reason) {
        wc.sendInnerTo(senderId, _this6.id, {
          failedReason: 'Failed to establish a socket: ' + reason
        });
      });
    }

    /**
     * @private
     * @param {number[]} connectors
     *
     * @returns {boolean}
     */

  }, {
    key: 'isValid',
    value: function isValid(connectors) {
      if (this.isEqual(connectors, this.WS) || this.isEqual(connectors, this.WR) || this.isEqual(connectors, this.WS_WR) || this.isEqual(connectors, this.WR_WS)) return true;
      return false;
    }

    /**
     * @private
     * @param {number[]} arr1
     * @param {number[]} arr2
     *
     * @returns {type} Description
     */

  }, {
    key: 'isEqual',
    value: function isEqual(arr1, arr2) {
      if (arr1.length !== arr2.length) return false;
      for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
      return true;
    }
  }]);
  return ChannelBuilderService;
}(Service);

var ted = Util.require(Util.TEXT_ENCODING);

/**
 * Maximum size of the user message sent over `Channel`. Is meant without metadata.
 * @type {number}
 */
var MAX_USER_MSG_SIZE = 16365;

/**
 * User message offset in the array buffer. All data before are metadata.
 * @type {number}
 */
var USER_MSG_OFFSET = 19;

/**
 * First index in the array buffer after header (which is the part of metadata).
 * @type {number}
 */
var HEADER_OFFSET = 9;

/**
 * Maximum message id number.
 * @type {number}
 */
var MAX_MSG_ID_SIZE = 65535;

/**
 * User allowed message type: {@link ArrayBuffer}
 * @type {number}
 */
var ARRAY_BUFFER_TYPE = 1;

/**
 * User allowed message type: {@link external:Uint8Array}
 * @type {number}
 */
var U_INT_8_ARRAY_TYPE = 2;

/**
 * User allowed message type: {@link external:String}
 * @type {number}
 */
var STRING_TYPE = 3;

/**
 * User allowed message type: {@link external:Int8Array}
 * @type {number}
 */
var INT_8_ARRAY_TYPE = 4;

/**
 * User allowed message type: {@link external:Uint8ClampedArray}
 * @type {number}
 */
var U_INT_8_CLAMPED_ARRAY_TYPE = 5;

/**
 * User allowed message type: {@link external:Int16Array}
 * @type {number}
 */
var INT_16_ARRAY_TYPE = 6;

/**
 * User allowed message type: {@link external:Uint16Array}
 * @type {number}
 */
var U_INT_16_ARRAY_TYPE = 7;

/**
 * User allowed message type: {@link external:Int32Array}
 * @type {number}
 */
var INT_32_ARRAY_TYPE = 8;

/**
 * User allowed message type: {@link external:Uint32Array}
 * @type {number}
 */
var U_INT_32_ARRAY_TYPE = 9;

/**
 * User allowed message type: {@link external:Float32Array}
 * @type {number}
 */
var FLOAT_32_ARRAY_TYPE = 10;

/**
 * User allowed message type: {@link external:Float64Array}
 * @type {number}
 */
var FLOAT_64_ARRAY_TYPE = 11;

/**
 * Buffer for big user messages.
 */
var buffers = new WeakMap();

/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */

var MessageBuilderService = function (_Service) {
  inherits(MessageBuilderService, _Service);

  function MessageBuilderService() {
    classCallCheck(this, MessageBuilderService);
    return possibleConstructorReturn(this, (MessageBuilderService.__proto__ || Object.getPrototypeOf(MessageBuilderService)).apply(this, arguments));
  }

  createClass(MessageBuilderService, [{
    key: 'handleUserMessage',


    /**
     * @callback MessageBuilderService~Send
     * @param {ArrayBuffer} dataChunk - If the message is too big this
     * action would be executed for each data chunk until send whole message
     */

    /**
     * @private
     * @typedef {ARRAY_BUFFER_TYPE|U_INT_8_ARRAY_TYPE|STRING_TYPE|INT_8_ARRAY_TYPE|U_INT_8_CLAMPED_ARRAY_TYPE|INT_16_ARRAY_TYPE|U_INT_16_ARRAY_TYPE|INT_32_ARRAY_TYPE|U_INT_32_ARRAY_TYPE|FLOAT_32_ARRAY_TYPE|FLOAT_64_ARRAY_TYPE} MessageTypeEnum
     */

    /**
     * Prepare user message to be sent over the `WebChannel`.
     *
     * @param {UserMessage} data Message to be sent
     * @param {number} senderId Id of the peer who sends this message
     * @param {number} recipientId Id of the recipient peer
     * @param {function(dataChunk: ArrayBuffer)} action Send callback executed for each
     * data chunk if the message is too big
     * @param {boolean} [isBroadcast=true] Equals to true if this message would be
     * sent to all `WebChannel` members and false if only to one member
     */
    value: function handleUserMessage(data, senderId, recipientId, action) {
      var isBroadcast = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

      var workingData = this.userDataToType(data);
      var dataUint8Array = workingData.content;
      if (dataUint8Array.byteLength <= MAX_USER_MSG_SIZE) {
        var dataView = this.initHeader(1, senderId, recipientId, dataUint8Array.byteLength + USER_MSG_OFFSET);
        dataView.setUint32(HEADER_OFFSET, dataUint8Array.byteLength);
        dataView.setUint8(13, workingData.type);
        dataView.setUint8(14, isBroadcast ? 1 : 0);
        var resultUint8Array = new Uint8Array(dataView.buffer);
        resultUint8Array.set(dataUint8Array, USER_MSG_OFFSET);
        action(resultUint8Array.buffer);
      } else {
        var msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE);
        var totalChunksNb = Math.ceil(dataUint8Array.byteLength / MAX_USER_MSG_SIZE);
        for (var chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
          var currentChunkMsgByteLength = Math.min(MAX_USER_MSG_SIZE, dataUint8Array.byteLength - MAX_USER_MSG_SIZE * chunkNb);
          var _dataView = this.initHeader(USER_DATA, senderId, recipientId, USER_MSG_OFFSET + currentChunkMsgByteLength);
          _dataView.setUint32(9, dataUint8Array.byteLength);
          _dataView.setUint8(13, workingData.type);
          _dataView.setUint8(14, isBroadcast ? 1 : 0);
          _dataView.setUint16(15, msgId);
          _dataView.setUint16(17, chunkNb);
          var _resultUint8Array = new Uint8Array(_dataView.buffer);
          var j = USER_MSG_OFFSET;
          var startIndex = MAX_USER_MSG_SIZE * chunkNb;
          var endIndex = startIndex + currentChunkMsgByteLength;
          for (var i = startIndex; i < endIndex; i++) {
            _resultUint8Array[j++] = dataUint8Array[i];
          }
          action(_resultUint8Array.buffer);
        }
      }
    }

    /**
     * Build a message which can be then sent trough the `Channel`.
     *
     * @param {number} code One of the internal message type code (e.g. {@link
     * USER_DATA})
     * @param {number} [senderId=null]
     * @param {number} [recepientId=null]
     * @param {Object} [data={}] Could be empty if the code is enough
     * @returns {ArrayBuffer} - Built message
     */

  }, {
    key: 'msg',
    value: function msg(code) {
      var senderId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var recepientId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      var msgEncoded = new ted.TextEncoder().encode(JSON.stringify(data));
      var msgSize = msgEncoded.byteLength + HEADER_OFFSET;
      var dataView = this.initHeader(code, senderId, recepientId, msgSize);
      var fullMsg = new Uint8Array(dataView.buffer);
      fullMsg.set(msgEncoded, HEADER_OFFSET);
      return fullMsg.buffer;
    }

    /**
     * Read user message which was prepared by another peer with
     * {@link MessageBuilderService#handleUserMessage} and sent.
     * @param {WebChannel} wc WebChannel
     * @param {number} senderId Id of the peer who sent this message
     * @param {ArrayBuffer} data Message
     * @param {function(msg: UserMessage, isBroadcast: boolean)} action Callback when the message is ready
     */

  }, {
    key: 'readUserMessage',
    value: function readUserMessage(wc, senderId, data, action) {
      var _this2 = this;

      var dataView = new DataView(data);
      var msgSize = dataView.getUint32(HEADER_OFFSET);
      var dataType = dataView.getUint8(13);
      var isBroadcast = dataView.getUint8(14);
      if (msgSize > MAX_USER_MSG_SIZE) {
        var msgId = dataView.getUint16(15);
        var chunk = dataView.getUint16(17);
        var buffer = this.getBuffer(wc, senderId, msgId);
        if (buffer === undefined) {
          this.setBuffer(wc, senderId, msgId, new Buffer(msgSize, data, chunk, function (fullData) {
            action(_this2.extractUserData(fullData, dataType), isBroadcast);
          }));
        } else {
          buffer.add(data, chunk);
        }
      } else {
        var dataArray = new Uint8Array(data);
        var userData = new Uint8Array(data.byteLength - USER_MSG_OFFSET);
        var j = USER_MSG_OFFSET;
        for (var i = 0; i < userData.byteLength; i++) {
          userData[i] = dataArray[j++];
        }
        action(this.extractUserData(userData.buffer, dataType), isBroadcast);
      }
    }

    /**
     * Read internal Netflux message.
     * @param {ArrayBuffer} data Message
     * @returns {Object}
     */

  }, {
    key: 'readInternalMessage',
    value: function readInternalMessage(data) {
      var uInt8Array = new Uint8Array(data);
      return JSON.parse(new ted.TextDecoder().decode(uInt8Array.subarray(HEADER_OFFSET, uInt8Array.byteLength)));
    }

    /**
     * Extract header from the message. Each user message has a header which is
     * a part of the message metadata.
     * @param {ArrayBuffer} data Whole message
     * @returns {MessageHeader}
     */

  }, {
    key: 'readHeader',
    value: function readHeader(data) {
      var dataView = new DataView(data);
      return {
        code: dataView.getUint8(0),
        senderId: dataView.getUint32(1),
        recepientId: dataView.getUint32(5)
      };
    }

    /**
     * Create an `ArrayBuffer` and fill in the header.
     * @private
     * @param {number} code Message type code
     * @param {number} senderId Sender peer id
     * @param {number} recipientId Recipient peer id
     * @param {number} dataSize Message size in bytes
     * @return {DataView} Data view with initialized header
     */

  }, {
    key: 'initHeader',
    value: function initHeader(code, senderId, recipientId, dataSize) {
      var dataView = new DataView(new ArrayBuffer(dataSize));
      dataView.setUint8(0, code);
      dataView.setUint32(1, senderId);
      dataView.setUint32(5, recipientId);
      return dataView;
    }

    /**
     * Netflux sends data in `ArrayBuffer`, but the user can send data in different
     * types. This function retrieve the inital message sent by the user.
     * @private
     * @param {ArrayBuffer} buffer Message as it was received by the `WebChannel`
     * @param {MessageTypeEnum} type Message type as it was defined by the user
     * @returns {ArrayBuffer|TypedArray} Initial user message
     */

  }, {
    key: 'extractUserData',
    value: function extractUserData(buffer, type) {
      switch (type) {
        case ARRAY_BUFFER_TYPE:
          return buffer;
        case U_INT_8_ARRAY_TYPE:
          return new Uint8Array(buffer);
        case STRING_TYPE:
          return new ted.TextDecoder().decode(new Uint8Array(buffer));
        case INT_8_ARRAY_TYPE:
          return new Int8Array(buffer);
        case U_INT_8_CLAMPED_ARRAY_TYPE:
          return new Uint8ClampedArray(buffer);
        case INT_16_ARRAY_TYPE:
          return new Int16Array(buffer);
        case U_INT_16_ARRAY_TYPE:
          return new Uint16Array(buffer);
        case INT_32_ARRAY_TYPE:
          return new Int32Array(buffer);
        case U_INT_32_ARRAY_TYPE:
          return new Uint32Array(buffer);
        case FLOAT_32_ARRAY_TYPE:
          return new Float32Array(buffer);
        case FLOAT_64_ARRAY_TYPE:
          return new Float64Array(buffer);
        default:
          throw new Error('Unknown type');
      }
    }

    /**
     * Identify the user message type.
     *
     * @private
     * @param {UserMessage} data User message
     * @returns {MessageTypeEnum} User message type
     */

  }, {
    key: 'userDataToType',
    value: function userDataToType(data) {
      var result = {};
      if (data instanceof ArrayBuffer) {
        result.type = ARRAY_BUFFER_TYPE;
        result.content = new Uint8Array(data);
      } else if (data instanceof Uint8Array) {
        result.type = U_INT_8_ARRAY_TYPE;
        result.content = data;
      } else if (typeof data === 'string' || data instanceof String) {
        result.type = STRING_TYPE;
        result.content = new ted.TextEncoder().encode(data);
      } else {
        result.content = new Uint8Array(data.buffer);
        if (data instanceof Int8Array) {
          result.type = INT_8_ARRAY_TYPE;
        } else if (data instanceof Uint8ClampedArray) {
          result.type = U_INT_8_CLAMPED_ARRAY_TYPE;
        } else if (data instanceof Int16Array) {
          result.type = INT_16_ARRAY_TYPE;
        } else if (data instanceof Uint16Array) {
          result.type = U_INT_16_ARRAY_TYPE;
        } else if (data instanceof Int32Array) {
          result.type = INT_32_ARRAY_TYPE;
        } else if (data instanceof Uint32Array) {
          result.type = U_INT_32_ARRAY_TYPE;
        } else if (data instanceof Float32Array) {
          result.type = FLOAT_32_ARRAY_TYPE;
        } else if (data instanceof Float64Array) {
          result.type = FLOAT_64_ARRAY_TYPE;
        } else {
          throw new Error('Unknown data object');
        }
      }
      return result;
    }

    /**
     * Get the buffer.
     * @private
     * @param {WebChannel} wc WebChannel
     * @param {number} peerId Peer id
     * @param {number} msgId Message id
     * @returns {Buffer|undefined} Returns buffer if it was found and undefined if not
     */

  }, {
    key: 'getBuffer',
    value: function getBuffer(wc, peerId, msgId) {
      var wcBuffer = buffers.get(wc);
      if (wcBuffer !== undefined) {
        var peerBuffer = wcBuffer.get(peerId);
        if (peerBuffer !== undefined) {
          return peerBuffer.get(msgId);
        }
      }
      return undefined;
    }

    /**
     * Add a new buffer to the buffer array.
     * @private
     * @param {WebChannel} wc WebChannel
     * @param {number} peerId Peer id
     * @param {number} msgId Message id
     * @param {Buffer} buffer
     */

  }, {
    key: 'setBuffer',
    value: function setBuffer(wc, peerId, msgId, buffer) {
      var wcBuffer = buffers.get(wc);
      if (wcBuffer === undefined) {
        wcBuffer = new Map();
        buffers.set(wc, wcBuffer);
      }
      var peerBuffer = wcBuffer.get(peerId);
      if (peerBuffer === undefined) {
        peerBuffer = new Map();
        wcBuffer.set(peerId, peerBuffer);
      }
      peerBuffer.set(msgId, buffer);
    }
  }]);
  return MessageBuilderService;
}(Service);

/**
 * Buffer class used when the user message exceeds the message size limit which
 * may be sent over a `Channel`. Each buffer is identified by `WebChannel` id,
 * peer id (who sends the big message) and message id (in case if the peer sends
 * more then 1 big message at a time).
 * @private
 */


var Buffer = function () {

  /**
   * @param {number} fullDataSize The total user message size
   * @param {ArrayBuffer} data The first chunk of the user message
   * @param {number} chunkNb Number of the chunk
   * @param {function(buffer: ArrayBuffer)} action Callback to be executed when all
   * message chunks are received and thus the message is ready
   */
  function Buffer(fullDataSize, data, chunkNb, action) {
    classCallCheck(this, Buffer);

    this.fullData = new Uint8Array(fullDataSize);
    this.currentSize = 0;
    this.action = action;
    this.add(data, chunkNb);
  }

  /**
   * Add a chunk of message to the buffer.
   * @param {ArrayBuffer} data - Message chunk
   * @param {number} chunkNb - Number of the chunk
   */


  createClass(Buffer, [{
    key: 'add',
    value: function add(data, chunkNb) {
      var dataChunk = new Uint8Array(data);
      var dataChunkSize = data.byteLength;
      this.currentSize += dataChunkSize - USER_MSG_OFFSET;
      var index = chunkNb * MAX_USER_MSG_SIZE;
      for (var i = USER_MSG_OFFSET; i < dataChunkSize; i++) {
        this.fullData[index++] = dataChunk[i];
      }
      if (this.currentSize === this.fullData.byteLength) {
        this.action(this.fullData.buffer);
      }
    }
  }]);
  return Buffer;
}();

/**
 * {@link WebRTCService} identifier.
 * @type {number}
 */
var WEB_RTC = 0;

/**
* {@link WebSocketService} identifier.
* @type {number}
*/
var WEB_SOCKET = 1;

/**
* {@link WebSocketService} identifier.
* @type {number}
*/
var EVENT_SOURCE = 5;

/**
 * {@link ChannelBuilderService} identifier.
 * @ignore
 * @type {number}
 */
var CHANNEL_BUILDER = 2;

/**
 * {@link FullyConnectedService} identifier.
 * @ignore
 * @type {number}
 */
var FULLY_CONNECTED = 3;

/**
 * {@link MessageBuilderService} identifier
 * @ignore
 * @type {number}
 */
var MESSAGE_BUILDER = 4;

/**
 * Contains singletons services.
 * @type {Map}
 */
var services = new Map();

/**
 * It is a factory helper class which is responsible to instantiate any service class.
 */

var ServiceFactory = function () {
  function ServiceFactory() {
    classCallCheck(this, ServiceFactory);
  }

  createClass(ServiceFactory, null, [{
    key: 'get',

    /**
     * Provides the service instance specified by `id`.
     *
     * @throws {Error} If the service `id` is unknown
     * @param  {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id The service identifier
     * @param  {Object} [options] Any options that the service accepts
     * @returns {Service}
     */
    value: function get$$1(id) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (services.has(id)) {
        return services.get(id);
      }
      var service = void 0;
      switch (id) {
        case WEB_RTC:
          return new WebRTCService(WEB_RTC, options);
        case WEB_SOCKET:
          return new WebSocketService(WEB_SOCKET);
        case EVENT_SOURCE:
          return new EventSourceService(EVENT_SOURCE);
        case CHANNEL_BUILDER:
          return new ChannelBuilderService(CHANNEL_BUILDER);
        case FULLY_CONNECTED:
          service = new FullyConnectedService(FULLY_CONNECTED);
          services.set(id, service);
          return service;
        case MESSAGE_BUILDER:
          service = new MessageBuilderService(MESSAGE_BUILDER);
          services.set(id, service);
          return service;
        default:
          throw new Error(id + ' is an Unknown service id');
      }
    }
  }]);
  return ServiceFactory;
}();

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */

var Channel = function () {
  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   * @param {WebSocket|RTCDataChannel} channel Data channel or web socket
   * @param {WebChannel} webChannel The `WebChannel` this channel will be part of
   * @param {number} peerId Identifier of the peer who is at the other end of
   * this channel
   */
  function Channel(channel, webChannel, peerId) {
    classCallCheck(this, Channel);

    /**
     * Data channel or web socket.
     * @private
     * @type {external:WebSocket|external:RTCDataChannel}
     */
    this.channel = channel;

    /**
     * The `WebChannel` which this channel belongs to.
     * @type {WebChannel}
     */
    this.webChannel = null;

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = -1;

    /**
     * Send message.
     * @type {function(message: ArrayBuffer)}
     */
    this.send = null;

    if (Util.isBrowser()) {
      channel.binaryType = 'arraybuffer';
      this.send = this.sendBrowser;
    } else if (Util.isSocket(channel)) {
      this.send = this.sendInNodeThroughSocket;
    } else {
      channel.binaryType = 'arraybuffer';
      this.send = this.sendInNodeThroughDataChannel;
    }
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageBuilderService} (see{@link MessageBuilderService#msg},
   * {@link MessageBuilderService#handleUserMessage}).
   *
   * @private
   * @param {ArrayBuffer} data Message
   */


  createClass(Channel, [{
    key: 'sendBrowser',
    value: function sendBrowser(data) {
      // if (this.channel.readyState !== 'closed' && new Int8Array(data).length !== 0) {
      if (this.isOpen()) {
        try {
          this.channel.send(data);
        } catch (err) {
          console.error('Channel send: ' + err.message);
        }
      }
    }

    /**
     * @private
     * @param {ArrayBuffer} data
     */

  }, {
    key: 'sendInNodeThroughSocket',
    value: function sendInNodeThroughSocket(data) {
      if (this.isOpen()) {
        try {
          this.channel.send(data, { binary: true });
        } catch (err) {
          console.error('Channel send: ' + err.message);
        }
      }
    }

    /**
     * @private
     * @param {ArrayBuffer} data
     */

  }, {
    key: 'sendInNodeThroughDataChannel',
    value: function sendInNodeThroughDataChannel(data) {
      this.sendBrowser(data.slice(0));
    }

    /**
     * @param {function(msg: ArrayBuffer)} handler
     */

  }, {
    key: 'clearHandlers',


    /**
     */
    value: function clearHandlers() {
      this.onMessage = function () {};
      this.onClose = function () {};
      this.onError = function () {};
    }

    /**
     * @returns {boolean}
     */

  }, {
    key: 'isOpen',
    value: function isOpen() {
      var state = this.channel.readyState;
      return state === 1 || state === 'open';
    }

    /**
     * Close the channel.
     */

  }, {
    key: 'close',
    value: function close() {
      this.channel.close();
    }
  }, {
    key: 'onMessage',
    set: function set$$1(handler) {
      if (!Util.isBrowser() && Util.isSocket(this.channel)) {
        this.channel.onmessage = function (msgEvt) {
          handler(new Uint8Array(msgEvt.data).buffer);
        };
      } else this.channel.onmessage = function (msgEvt) {
        return handler(msgEvt.data);
      };
    }

    /**
     * @param {function(message: CloseEvent)} handler
     */

  }, {
    key: 'onClose',
    set: function set$$1(handler) {
      var _this = this;

      this.channel.onclose = function (closeEvt) {
        if (_this.webChannel !== null && handler(closeEvt)) {
          _this.webChannel.members.splice(_this.webChannel.members.indexOf(_this.peerId), 1);
          _this.webChannel.onPeerLeave(_this.peerId);
        } else handler(closeEvt);
      };
    }

    /**
     * @param {function(message: Event)} handler
     */

  }, {
    key: 'onError',
    set: function set$$1(handler) {
      this.channel.onerror = function (evt) {
        return handler(evt);
      };
    }
  }]);
  return Channel;
}();

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */

var SignalingGate = function () {

  /**
   * @param {WebChannel} wc
   * @param {function(ch: RTCDataChannel)} onChannel
   */
  function SignalingGate(wc, onChannel) {
    classCallCheck(this, SignalingGate);

    /**
     * @type {WebChannel}
     */
    this.webChannel = wc;
    /**
     * Signaling server url.
     * @private
     * @type {string}
     */
    this.url = null;
    /**
     * Key related to the `url`.
     * @private
     * @type {string}
     */
    this.key = null;
    /**
     * Connection with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket|external:EventSource}
     */
    this.con = null;

    this.onChannel = onChannel;
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {string} [key = this.generateKey()]
   * @returns {Promise<OpenData, string>}
   */


  createClass(SignalingGate, [{
    key: 'open',
    value: function open(url) {
      var _this = this;

      var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.generateKey();

      return new Promise(function (resolve, reject) {
        _this.getConnectionService(url).connect(url).then(function (sigCon) {
          sigCon.onclose = function (closeEvt) {
            return reject(closeEvt.reason);
          };
          sigCon.onerror = function (err) {
            return reject(err.message);
          };
          sigCon.onmessage = function (evt) {
            try {
              var msg = JSON.parse(evt.data);
              if ('opened' in msg) {
                if (msg.opened) {
                  resolve(_this.listenOnOpen(sigCon, key));
                } else reject('Could not open with ' + key);
              } else reject('Unknown message from ' + url + ': ' + evt.data);
            } catch (err) {
              reject('Server responce is not a JSON string: ' + err.message);
            }
          };
          sigCon.send(JSON.stringify({ open: key }));
        }).catch(function (err) {
          reject(err);
        });
      });
    }

    /**
     * Open the gate when the connection with the signaling server exists already.
     *
     * @param {WebSocket|RichEventSource} sigCon Connection with the signaling
     * @param {string} key
     * @returns {Promise<OpenData, string>}
     */

  }, {
    key: 'openExisted',
    value: function openExisted(sigCon, key) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        sigCon.onclose = function (closeEvt) {
          return reject(closeEvt.reason);
        };
        sigCon.onerror = function (err) {
          return reject(err.message);
        };
        sigCon.onmessage = function (evt) {
          try {
            var msg = JSON.parse(evt.data);
            if ('opened' in msg) {
              if (msg.opened) {
                resolve(_this2.listenOnOpen(sigCon, key));
              } else reject('Could not open with ' + key);
            } else reject('Unknown message from ' + sigCon.url + ': ' + evt.data);
          } catch (err) {
            reject('Server responce is not a JSON string: ' + err.message);
          }
        };
        sigCon.send(JSON.stringify({ open: key }));
      });
    }
  }, {
    key: 'join',
    value: function join(url, key) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.getConnectionService(url).connect(url).then(function (sigCon) {
          sigCon.onclose = function (closeEvt) {
            return reject(closeEvt.reason);
          };
          sigCon.onerror = function (err) {
            return reject(err.message);
          };
          sigCon.onmessage = function (evt) {
            try {
              var msg = JSON.parse(evt.data);
              if ('opened' in msg) {
                if (!msg.opened) {
                  if ('useThis' in msg) {
                    if (msg.useThis) {
                      resolve({ opened: false, con: sigCon });
                    } else {
                      reject('Open a gate with bot server is not possible');
                    }
                  } else {
                    ServiceFactory.get(WEB_RTC, _this3.webChannel.settings.iceServers).connectOverSignaling(sigCon, key).then(function (dc) {
                      return resolve({ opened: false, con: dc, sigCon: sigCon });
                    }).catch(reject);
                  }
                } else {
                  _this3.listenOnOpen(sigCon, key);
                  resolve({ opened: true, sigCon: sigCon });
                }
              } else reject('Unknown message from ' + url + ': ' + evt.data);
            } catch (err) {
              reject(err.message);
            }
          };
          sigCon.send(JSON.stringify({ join: key }));
        }).catch(reject);
      });
    }

    /**
     * Check if the door is opened or closed.
     *
     * @returns {boolean} - Returns true if the door is opened and false if it is
     * closed
     */

  }, {
    key: 'isOpen',
    value: function isOpen() {
      return this.con !== null && this.con.readyState === this.con.OPEN;
    }

    /**
     * Get open data.
     *
     * @returns {OpenData|null} Open data if the door is open and null otherwise
     */

  }, {
    key: 'getOpenData',
    value: function getOpenData() {
      if (this.isOpen()) {
        return {
          url: this.url,
          key: this.key
        };
      }
      return null;
    }

    /**
     * Close the door if it is open and do nothing if it is closed already.
     */

  }, {
    key: 'close',
    value: function close() {
      if (this.isOpen()) {
        this.con.close();
      }
    }

    /**
     * Get the connection service for signaling server.
     *
     * @private
     * @param {string} url Signaling server url
     *
     * @returns {Service}
     */

  }, {
    key: 'getConnectionService',
    value: function getConnectionService(url) {
      if (Util.isURL(url)) {
        if (url.search(/^wss?/) !== -1) {
          return ServiceFactory.get(WEB_SOCKET);
        } else {
          return ServiceFactory.get(EVENT_SOURCE);
        }
      } else {
        throw new Error(url + ' is not a valid URL');
      }
    }
  }, {
    key: 'listenOnOpen',
    value: function listenOnOpen(sigCon, key) {
      var _this4 = this;

      ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers).listenFromSignaling(sigCon, function (con) {
        return _this4.onChannel(con);
      });
      this.con = sigCon;
      this.con.onclose = function (closeEvt) {
        _this4.key = null;
        _this4.con = null;
        _this4.url = null;
        _this4.webChannel.onClose(closeEvt);
      };
      this.key = key;
      if (sigCon.url.endsWith('/')) {
        this.url = sigCon.url.substr(0, sigCon.url.length - 1);
      } else {
        this.url = sigCon.url;
      }
      return { url: this.url, key: key };
    }

    /**
     * Generate random key which will be used to join the `WebChannel`.
     *
     * @private
     * @returns {string} - Generated key
     */

  }, {
    key: 'generateKey',
    value: function generateKey() {
      var MIN_LENGTH = 5;
      var DELTA_LENGTH = 0;
      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var result = '';
      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

      for (var i = 0; i < length; i++) {
        result += MASK[Math.round(Math.random() * (MASK.length - 1))];
      }
      return result;
    }
  }]);
  return SignalingGate;
}();

/**
 * Maximum identifier number for {@link WebChannel#generateId} function.
 * @type {number}
 */
var MAX_ID = 2147483647;

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
var PING_TIMEOUT = 5000;

var ID_TIMEOUT = 10000;

/**
 * One of the internal message type. It's a peer message.
 * @ignore
 * @type {number}
 */
var USER_DATA = 1;

/**
 * One of the internal message type. This message should be threated by a
 * specific service class.
 * @type {number}
 */
var INNER_DATA = 2;

var INITIALIZATION = 3;

/**
 * One of the internal message type. Ping message.
 * @type {number}
 */
var PING = 4;

/**
 * One of the internal message type. Pong message, response to the ping message.
 * @type {number}
 */
var PONG = 5;

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */

var WebChannel = function () {

  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  function WebChannel(settings) {
    var _this = this;

    classCallCheck(this, WebChannel);

    /**
     * @private
     * @type {WebChannelSettings}
     */
    this.settings = settings;

    /**
     * Channels through which this peer is connected with other peers. This
     * attribute depends on the `WebChannel` topology. E. g. in fully connected
     * `WebChannel` you are connected to each other peer in the group, however
     * in the star structure this attribute contains only the connection to
     * the central peer.
     * @private
     * @type {external:Set}
     */
    this.channels = new Set();

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
    this.onJoin = function () {};

    /**
     * `WebChannel` topology.
     * @private
     * @type {Service}
     */
    this.manager = ServiceFactory.get(this.settings.topology);

    /**
     * Message builder service instance.
     *
     * @private
     * @type {MessageBuilderService}
     */
    this.msgBld = ServiceFactory.get(MESSAGE_BUILDER);

    /**
     * An array of all peer ids except this.
     * @type {number[]}
     */
    this.members = [];

    /**
     * @private
     * @type {Set<number>}
     */
    this.generatedIds = new Set();

    /**
     * @private
     * @type {Date}
     */
    this.pingTime = 0;

    /**
     * @private
     * @type {number}
     */
    this.maxTime = 0;

    /**
     * @private
     * @type {function(delay: number)}
     */
    this.pingFinish = function () {};

    /**
     * @private
     * @type {number}
     */
    this.pongNb = 0;

    /**
     * The `WebChannel` gate.
     * @private
     * @type {SignalingGate}
     */
    this.gate = new SignalingGate(this, function (ch) {
      return _this.addChannel(ch);
    });

    /**
     * Unique `WebChannel` identifier. Its value is the same for all `WebChannel` members.
     * @type {number}
     */
    this.id = this.generateId();

    /**
     * Unique peer identifier of you in this `WebChannel`. After each `join` function call
     * this id will change, because it is up to the `WebChannel` to assign it when
     * you join.
     * @type {number}
     */
    this.myId = this.generateId();

    /**
     * Is the event handler called when a new peer has  joined the `WebChannel`.
     * @type {function(id: number)}
     */
    this.onPeerJoin = function () {};

    /**
     * Is the event handler called when a peer hes left the `WebChannel`.
     * @type {function(id: number)}
     */
    this.onPeerLeave = function () {};

    /**
     * Is the event handler called when a message is available on the `WebChannel`.
     * @type {function(id: number, msg: UserMessage, isBroadcast: boolean)}
     */
    this.onMessage = function () {};

    /**
     * Is the event handler called when the `WebChannel` has been closed.
     * @type {function(closeEvt: CloseEvent)}
     */
    this.onClose = function () {};
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string|WebSocket} keyOrSocket The key provided by one of the `WebChannel` members or a socket
   * @param  {string} [url=this.settings.signalingURL] Server URL
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */


  createClass(WebChannel, [{
    key: 'join',
    value: function join(keyOrSocket) {
      var _this2 = this;

      var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.settings.signalingURL;

      return new Promise(function (resolve, reject) {
        if (keyOrSocket.constructor.name !== 'WebSocket') {
          _this2.gate.join(url, keyOrSocket).then(function (res) {
            if (res.opened) {
              resolve();
            } else {
              _this2.onJoin = function () {
                _this2.gate.openExisted(res.sigCon, keyOrSocket).then(resolve);
              };
              _this2.initChannel(res.con).catch(reject);
            }
          }).catch(reject);
        } else {
          _this2.onJoin = resolve;
          _this2.initChannel(keyOrSocket).catch(reject);
        }
      });
    }

    /**
     * Invite a peer to join the `WebChannel`.
     *
     * @param {string|WebSocket} urlOrSocket
     *
     * @returns {Promise<undefined,string>}
     */

  }, {
    key: 'invite',
    value: function invite(urlOrSocket) {
      var _this3 = this;

      if (typeof urlOrSocket === 'string' || urlOrSocket instanceof String) {
        if (!Util.isURL(urlOrSocket)) {
          return Promise.reject(urlOrSocket + ' is not a valid URL');
        }
        return ServiceFactory.get(WEB_SOCKET).connect(urlOrSocket).then(function (ws) {
          ws.send(JSON.stringify({ wcId: _this3.id }));
          return _this3.addChannel(ws);
        });
      } else if (urlOrSocket.constructor.name === 'WebSocket') {
        return this.addChannel(urlOrSocket);
      } else {
        return Promise.reject(urlOrSocket + ' is not a valid URL');
      }
    }

    /**
     * Enable other peers to join the `WebChannel` with your help as an
     * intermediary peer.
     * @param  {string} [key] Key to use. If none provide, then generate one.
     * @returns {Promise} It is resolved once the `WebChannel` is open. The
     * callback function take a parameter of type {@link SignalingGate~AccessData}.
     */

  }, {
    key: 'open',
    value: function open() {
      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (Util.isURL(this.settings.signalingURL)) {
        if (key !== null) {
          return this.gate.open(this.settings.signalingURL, key);
        } else {
          return this.gate.open(this.settings.signalingURL);
        }
      } else {
        return Promise.reject(this.settings.signalingURL + ' is not a valid URL');
      }
    }

    /**
     * Prevent clients to join the `WebChannel` even if they possesses a key.
     */

  }, {
    key: 'close',
    value: function close() {
      this.gate.close();
    }

    /**
     * If the `WebChannel` is open, the clients can join it through you, otherwise
     * it is not possible.
     * @returns {boolean} True if the `WebChannel` is open, false otherwise
     */

  }, {
    key: 'isOpen',
    value: function isOpen() {
      return this.gate.isOpen();
    }

    /**
     * Get the data allowing to join the `WebChannel`. It is the same data which
     * {@link WebChannel#open} callback function provides.
     * @returns {OpenData|null} - Data to join the `WebChannel` or null is the `WebChannel` is closed
     */

  }, {
    key: 'getOpenData',
    value: function getOpenData() {
      return this.gate.getOpenData();
    }

    /**
     * Leave the `WebChannel`. No longer can receive and send messages to the group.
     */

  }, {
    key: 'leave',
    value: function leave() {
      this.pingTime = 0;
      if (this.channels.size !== 0) {
        this.members = [];
        this.manager.leave(this);
      }
      if (this.isOpen()) {
        this.gate.close();
      }
    }

    /**
     * Send the message to all `WebChannel` members.
     * @param  {UserMessage} data - Message
     */

  }, {
    key: 'send',
    value: function send(data) {
      var _this4 = this;

      if (this.channels.size !== 0) {
        this.msgBld.handleUserMessage(data, this.myId, null, function (dataChunk) {
          _this4.manager.broadcast(_this4, dataChunk);
        });
      }
    }

    /**
     * Send the message to a particular peer in the `WebChannel`.
     * @param  {number} id - Id of the recipient peer
     * @param  {UserMessage} data - Message
     */

  }, {
    key: 'sendTo',
    value: function sendTo(id, data) {
      var _this5 = this;

      if (this.channels.size !== 0) {
        this.msgBld.handleUserMessage(data, this.myId, id, function (dataChunk) {
          _this5.manager.sendTo(id, _this5, dataChunk);
        }, false);
      }
    }

    /**
     * Get the ping of the `WebChannel`. It is an amount in milliseconds which
     * corresponds to the longest ping to each `WebChannel` member.
     * @returns {Promise}
     */

  }, {
    key: 'ping',
    value: function ping() {
      var _this6 = this;

      if (this.channels.size !== 0 && this.pingTime === 0) {
        return new Promise(function (resolve, reject) {
          if (_this6.pingTime === 0) {
            _this6.pingTime = Date.now();
            _this6.maxTime = 0;
            _this6.pongNb = 0;
            _this6.pingFinish = function (delay) {
              return resolve(delay);
            };
            _this6.manager.broadcast(_this6, _this6.msgBld.msg(PING, _this6.myId));
            setTimeout(function () {
              return resolve(PING_TIMEOUT);
            }, PING_TIMEOUT);
          }
        });
      } else return Promise.reject('No peers to ping');
    }

    /**
     * @private
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {Promise<undefined,string>}
     */

  }, {
    key: 'addChannel',
    value: function addChannel(channel) {
      var _this7 = this;

      return this.initChannel(channel).then(function (channel) {
        var msg = _this7.msgBld.msg(INITIALIZATION, _this7.myId, channel.peerId, {
          manager: _this7.manager.id,
          wcId: _this7.id
        });
        channel.send(msg);
        return _this7.manager.add(channel);
      });
    }

    /**
     * @private
     * @param {number} peerId
     */

  }, {
    key: 'onPeerJoin$',
    value: function onPeerJoin$(peerId) {
      this.members[this.members.length] = peerId;
      this.onPeerJoin(peerId);
    }

    /**
     * @private
     * @param {number} peerId
     */

  }, {
    key: 'onPeerLeave$',
    value: function onPeerLeave$(peerId) {
      this.members.splice(this.members.indexOf(peerId), 1);
      this.onPeerLeave(peerId);
    }

    /**
     * Send a message to a service of the same peer, joining peer or any peer in
     * the `WebChannel`.
     * @private
     * @param {number} recepient - Identifier of recepient peer id
     * @param {string} serviceId - Service id
     * @param {Object} data - Message to send
     * @param {boolean} [forward=false] - SHould the message be forwarded?
     */

  }, {
    key: 'sendInnerTo',
    value: function sendInnerTo(recepient, serviceId, data) {
      var forward = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      if (forward) {
        this.manager.sendInnerTo(recepient, this, data);
      } else {
        if (Number.isInteger(recepient)) {
          var msg = this.msgBld.msg(INNER_DATA, this.myId, recepient, { serviceId: serviceId, data: data });
          this.manager.sendInnerTo(recepient, this, msg);
        } else {
          recepient.send(this.msgBld.msg(INNER_DATA, this.myId, recepient.peerId, { serviceId: serviceId, data: data }));
        }
      }
    }

    /**
     * @private
     * @param {number} serviceId
     * @param {Object} data
     */

  }, {
    key: 'sendInner',
    value: function sendInner(serviceId, data) {
      this.manager.sendInner(this, this.msgBld.msg(INNER_DATA, this.myId, null, { serviceId: serviceId, data: data }));
    }

    /**
     * Message event handler (`WebChannel` mediator). All messages arrive here first.
     * @private
     * @param {Channel} channel - The channel the message came from
     * @param {external:ArrayBuffer} data - Message
     */

  }, {
    key: 'onChannelMessage',
    value: function onChannelMessage(channel, data) {
      var _this8 = this;

      var header = this.msgBld.readHeader(data);
      if (header.code === USER_DATA) {
        this.msgBld.readUserMessage(this, header.senderId, data, function (fullData, isBroadcast) {
          _this8.onMessage(header.senderId, fullData, isBroadcast);
        });
      } else {
        var msg = this.msgBld.readInternalMessage(data);
        switch (header.code) {
          case INITIALIZATION:
            {
              this.settings.topology = msg.manager;
              this.manager = ServiceFactory.get(this.settings.topology);
              this.myId = header.recepientId;
              this.id = msg.wcId;
              channel.peerId = header.senderId;
              break;
            }
          case INNER_DATA:
            {
              if (header.recepientId === 0 || this.myId === header.recepientId) {
                this.getService(msg.serviceId).onMessage(channel, header.senderId, header.recepientId, msg.data);
              } else this.sendInnerTo(header.recepientId, null, data, true);
              break;
            }
          case PING:
            this.manager.sendTo(header.senderId, this, this.msgBld.msg(PONG, this.myId));
            break;
          case PONG:
            {
              var now = Date.now();
              this.pongNb++;
              this.maxTime = Math.max(this.maxTime, now - this.pingTime);
              if (this.pongNb === this.members.length) {
                this.pingFinish(this.maxTime);
                this.pingTime = 0;
              }
              break;
            }
          default:
            throw new Error('Unknown message type code: "' + header.code + '"');
        }
      }
    }

    /**
     * Initialize channel. The *Channel* object is a facade for *WebSocket* and
     * *RTCDataChannel*.
     * @private
     * @param {external:WebSocket|external:RTCDataChannel} ch - Channel to
     * initialize
     * @param {number} [id] - Assign an id to this channel. It would be generated
     * if not provided
     * @returns {Promise} - Resolved once the channel is initialized on both sides
     */

  }, {
    key: 'initChannel',
    value: function initChannel(ch) {
      var _this9 = this;

      var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

      if (id === -1) id = this.generateId();
      var channel = new Channel(ch);
      channel.peerId = id;
      channel.webChannel = this;
      channel.onMessage = function (data) {
        return _this9.onChannelMessage(channel, data);
      };
      channel.onClose = function (closeEvt) {
        return _this9.manager.onChannelClose(closeEvt, channel);
      };
      channel.onError = function (evt) {
        return _this9.manager.onChannelError(evt, channel);
      };
      return Promise.resolve(channel);
    }

    /**
     * @private
     * @param {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id
     *
     * @returns {Service}
     */

  }, {
    key: 'getService',
    value: function getService(id) {
      if (id === WEB_RTC) {
        return ServiceFactory.get(WEB_RTC, this.settings.iceServers);
      }
      return ServiceFactory.get(id);
    }

    /**
     * Generate random id for a `WebChannel` or a new peer.
     * @private
     * @returns {number} - Generated id
     */

  }, {
    key: 'generateId',
    value: function generateId() {
      var _this10 = this;

      var _loop = function _loop() {
        var id = Math.ceil(Math.random() * MAX_ID);
        if (id === _this10.myId) return 'continue';
        if (_this10.members.includes(id)) return 'continue';
        if (_this10.generatedIds.has(id)) return 'continue';
        _this10.generatedIds.add(id);
        setTimeout(function () {
          return _this10.generatedIds.delete(id);
        }, ID_TIMEOUT);
        return {
          v: id
        };
      };

      do {
        var _ret = _loop();

        switch (_ret) {
          case 'continue':
            continue;

          default:
            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
      } while (true);
    }
  }]);
  return WebChannel;
}();

/**
 * Create `WebChannel`.
 *
 * @param {WebChannelSettings} options
 * @param {WEB_RTC|WEB_SOCKET} [options.connector=WEB_RTC] Which connector is preferable during connection establishment
 * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
 * @param {string} [options.signalingURL='wss://sigver-coastteam.rhcloud.com:8443'] Signaling server url
 * @param {RTCIceServer} [options.iceServers=[{urls:'stun:turn01.uswest.xirsys.com'}]] Set of ice servers for WebRTC
 * @param {string} [options.listenOn=''] Server url when the peer is listen on web socket
 *
 * @returns {WebChannel}
 */
function create(options) {
  var defaultSettings = {
    connector: WEB_RTC,
    topology: FULLY_CONNECTED,
    signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
    iceServers: [{ urls: 'stun:turn01.uswest.xirsys.com' }],
    listenOn: ''
  };
  var mySettings = Object.assign({}, defaultSettings, options);
  return new WebChannel(mySettings);
}



/**
 * An event handler to be called when the *close* event is received either by the *WebSocket* or by the *RTCDataChannel*.
 * @callback closeEventHandler
 * @param {external:CloseEvent} evt Close event object
 */

/**
 * An event handler to be called when a *Channel* has been established.
 * @callback channelEventHandler
 * @param {Channel} channel Netflux channel
 */

export { create, WEB_SOCKET, WEB_RTC };
