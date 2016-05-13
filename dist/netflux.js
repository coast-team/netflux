(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["nf"] = factory();
	else
		root["nf"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.FULLY_CONNECTED = exports.WEBRTC = exports.WebChannel = undefined;

	var _WebChannel = __webpack_require__(1);

	Object.defineProperty(exports, 'WebChannel', {
	  enumerable: true,
	  get: function get() {
	    return _WebChannel.WebChannel;
	  }
	});

	var _serviceProvider = __webpack_require__(2);

	Object.defineProperty(exports, 'WEBRTC', {
	  enumerable: true,
	  get: function get() {
	    return _serviceProvider.WEBRTC;
	  }
	});
	Object.defineProperty(exports, 'FULLY_CONNECTED', {
	  enumerable: true,
	  get: function get() {
	    return _serviceProvider.FULLY_CONNECTED;
	  }
	});

	__webpack_require__(12);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.WebChannel = undefined;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _serviceProvider = __webpack_require__(2);

	var _serviceProvider2 = _interopRequireDefault(_serviceProvider);

	var _MessageFormatterService = __webpack_require__(9);

	var _Channel = __webpack_require__(10);

	var _Channel2 = _interopRequireDefault(_Channel);

	var _Buffer = __webpack_require__(11);

	var _Buffer2 = _interopRequireDefault(_Buffer);

	var _JoiningPeer = __webpack_require__(6);

	var _JoiningPeer2 = _interopRequireDefault(_JoiningPeer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var formatter = (0, _serviceProvider2.default)(_serviceProvider.MESSAGE_FORMATTER);

	/**
	 * Constant used to build a message designated to API user.
	 * @type {int}
	 */
	var USER_DATA = 0;

	/**
	 * Constant used to build a message designated to a specific service.
	 * @type {int}
	 */
	var SERVICE_DATA = 1;
	/**
	 * Constant used to build a message that a user has left Web Channel.
	 * @type {int}
	 */
	var LEAVE = 2;
	/**
	 * Constant used to build a message to be sent to a newly joining peer.
	 * @type {int}
	 */
	var JOIN_INIT = 3;
	/**
	 * Constant used to build a message to be sent to all peers in Web Channel to
	 * notify them about a new peer who is about to join the Web Channel.
	 * @type {int}
	 */
	var JOIN_NEW_MEMBER = 4;
	/**
	 * Constant used to build a message to be sent to all peers in Web Channel to
	 * notify them that the new peer who should join the Web Channel, refuse to join.
	 * @type {int}
	 */
	var REMOVE_NEW_MEMBER = 5;
	/**
	 * Constant used to build a message to be sent to a newly joining peer that he
	 * has can now succesfully join Web Channel.
	 * @type {int}
	 */
	var JOIN_FINILIZE = 6;
	/**
	 * Constant used to build a message to be sent by the newly joining peer to all
	 * peers in Web Channel to notify them that he has succesfully joined the Web
	 * Channel.
	 * @type {int}
	 */
	var JOIN_SUCCESS = 7;
	/**
	 * @type {int}
	 */
	var INIT_CHANNEL_PONG = 9;

	/**
	 * This class is an API starting point. It represents a group of collaborators
	 * also called peers. Each peer can send/receive broadcast as well as personal
	 * messages. Every peer in the `WebChannel` can invite another person to join
	 * the *WebChannel* and he also possess enough information to be able to add it
	 * preserving the current *WebChannel* structure (network topology).
	 */

	var WebChannel = function () {

	  /**
	   * `WebChannel` constructor. `WebChannel` can be parameterized in terms of
	   * network topology and connector technology (WebRTC or WebSocket. Currently
	   * WebRTC is only available).
	   *
	   * @param  {Object} [options] `WebChannel` configuration.
	   * @param  {string} [options.topology=FULLY_CONNECTED] Defines the network
	   *            topology.
	   * @param  {string} [options.connector=WEBRTC] Determines the connection
	   *            technology to use for build `WebChannel`.
	   * @return {WebChannel} Empty `WebChannel` without any connection.
	   */

	  function WebChannel() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebChannel);

	    this.defaults = {
	      connector: _serviceProvider.WEBRTC,
	      topology: _serviceProvider.FULLY_CONNECTED
	    };
	    this.settings = Object.assign({}, this.defaults, options);

	    /**
	     * Channels through which this peer is connected with other peers. This
	     * attribute depends on the `WebChannel` topology. E. g. in fully connected
	     * `WebChannel` you are connected to each other peer in the group, however
	     * in the star structure this attribute contains only the connection to
	     * the central peer.
	     *
	     * @private
	     */
	    this.channels = new Set();

	    /**
	     * This event handler is used to resolve *Promise* in `WebChannel.join`.
	     *
	     * @private
	     */
	    this.onJoin;

	    /** @private */
	    this.joiningPeers = new Set();
	    /** @private */
	    this.connectWithRequests = new Map();

	    /** @private */
	    this.topology = this.settings.topology;

	    // Public attributes

	    /**
	     * Unique identifier of this `WebChannel`. The same for all peers.
	     * @readonly
	     */
	    this.id = this.generateId();

	    /**
	     * Unique peer identifier in this `WebChannel`. After each `join` function call
	     * this id will change, because it is up to the `WebChannel` to assign it when
	     * you join.
	     *
	     * @readonly
	     */
	    this.myId = this.generateId();

	    this.buffers = new Map();

	    this.onJoining = function (id) {};
	    this.onMessage = function (id, msg) {};
	    this.onLeaving = function (id) {};
	  }

	  /** Leave `WebChannel`. No longer can receive and send messages to the group. */


	  _createClass(WebChannel, [{
	    key: 'leave',
	    value: function leave() {
	      var msg = formatter.msg(LEAVE, { id: this.myId });
	      this.manager.broadcast(this, msg);
	    }

	    /**
	     * Send broadcast message.
	     *
	     * @param  {string} data Message
	     */

	  }, {
	    key: 'send',
	    value: function send(data) {
	      var _this = this;

	      formatter.splitUserMessage(data, USER_DATA, this.myId, null, function (dataChunk) {
	        _this.manager.broadcast(_this, dataChunk);
	      });
	    }

	    /**
	     * Send the message to a particular peer.
	     *
	     * @param  {type} id Peer id of the recipient peer
	     * @param  {type} data Message
	     */

	  }, {
	    key: 'sendTo',
	    value: function sendTo(id, data) {
	      var _this2 = this;

	      formatter.splitUserMessage(data, USER_DATA, this.myId, id, function (dataChunk) {
	        _this2.manager.sendTo(id, _this2, dataChunk);
	      });
	    }

	    /**
	     * Enable other peers to join the `WebChannel` with your help as an intermediary
	     * peer.
	     *
	     * @param  {Object} [options] Any available connection service options.
	     * @return {string} The key required by other peer to join the `WebChannel`.
	     */

	  }, {
	    key: 'openForJoining',
	    value: function openForJoining() {
	      var _this3 = this;

	      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	      var settings = Object.assign({}, this.settings, options);

	      var cBuilder = (0, _serviceProvider2.default)(settings.connector, settings);
	      return cBuilder.open(this.generateKey(), function (channel) {
	        _this3.initChannel(channel, false).then(function (channel) {
	          var jp = new _JoiningPeer2.default(channel.peerId, _this3.myId);
	          jp.intermediaryChannel = channel;
	          _this3.joiningPeers.add(jp);
	          channel.send(formatter.msg(JOIN_INIT, {
	            manager: _this3.settings.topology,
	            id: channel.peerId,
	            intermediaryId: _this3.myId }));
	          _this3.manager.broadcast(_this3, formatter.msg(JOIN_NEW_MEMBER, { id: channel.peerId, intermediaryId: _this3.myId }));
	          _this3.manager.add(channel).then(function () {
	            return channel.send(formatter.msg(JOIN_FINILIZE));
	          }).catch(function (msg) {
	            _this3.manager.broadcast(_this3, formatter(REMOVE_NEW_MEMBER, { id: channel.peerId }));
	            _this3.removeJoiningPeer(jp.id);
	          });
	        });
	      }).then(function (data) {
	        _this3.webRTCOpen = data.socket;
	        return { key: data.key, url: data.url };
	      });
	    }

	    /**
	     * Prevent other peers to join the `WebChannel` even if they have a key.
	     */

	  }, {
	    key: 'closeForJoining',
	    value: function closeForJoining() {
	      if (Reflect.has(this, 'webRTCOpen')) {
	        this.webRTCOpen.close();
	      }
	    }

	    /**
	     * Join the `WebChannel`.
	     *
	     * @param  {string} key The key provided by a `WebChannel` member.
	     * @param  {type} [options] Any available connection service options.
	     * @return {Promise} It resolves once you became a `WebChannel` member.
	     */

	  }, {
	    key: 'join',
	    value: function join(key) {
	      var _this4 = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);

	      var cBuilder = (0, _serviceProvider2.default)(settings.connector, settings);
	      return new Promise(function (resolve, reject) {
	        _this4.onJoin = function () {
	          return resolve(_this4);
	        };
	        cBuilder.join(key).then(function (channel) {
	          return _this4.initChannel(channel, true);
	        }).catch(reject);
	      });
	    }

	    /**
	     *
	     *
	     * @private
	     * @return {type}  description
	     */

	  }, {
	    key: 'isInviting',
	    value: function isInviting() {}

	    /**
	     * has - description
	     *
	     * @private
	     * @param  {type} peerId description
	     * @return {type}        description
	     */

	  }, {
	    key: 'has',
	    value: function has(peerId) {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = this.channels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var c = _step.value;

	          if (c.peerId === peerId) {
	            return true;
	          }
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

	      return false;
	    }

	    /**
	     * Send a message to a service of the same peer, joining peer or any peer in
	     * the Web Channel).
	     *
	     * @private
	     * @param  {string} serviceName - Service name.
	     * @param  {string} recepient - Identifier of recepient peer id.
	     * @param  {Object} [msg={}] - Message to send.
	     */

	  }, {
	    key: 'sendSrvMsg',
	    value: function sendSrvMsg(serviceName, recepient) {
	      var msg = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
	      var channel = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

	      var fullMsg = formatter.msg(SERVICE_DATA, { serviceName: serviceName, recepient: recepient, data: Object.assign({}, msg) });
	      if (channel !== null) {
	        channel.send(fullMsg);
	        return;
	      }
	      if (recepient === this.myId) {
	        this.onChannelMessage(null, fullMsg);
	      } else {
	        // If this function caller is a peer who is joining
	        if (this.isJoining()) {
	          this.getJoiningPeer(this.myId).intermediaryChannel.send(fullMsg);
	        } else {
	          // If the recepient is a joining peer
	          if (this.hasJoiningPeer(recepient)) {
	            var jp = this.getJoiningPeer(recepient);
	            // If I am an intermediary peer for recepient
	            if (jp.intermediaryId === this.myId) {
	              jp.intermediaryChannel.send(fullMsg);
	              // If not, then send this message to the recepient's intermediary peer
	            } else {
	                this.manager.sendTo(jp.intermediaryId, this, fullMsg);
	              }
	            // If the recepient is a member of webChannel
	          } else {
	              this.manager.sendTo(recepient, this, fullMsg);
	            }
	        }
	      }
	    }
	  }, {
	    key: 'onChannelMessage',
	    value: function onChannelMessage(channel, data) {
	      var _this5 = this;

	      var decoder = new TextDecoder();
	      var dataView = new DataView(data);
	      var code = dataView.getUint8(0);
	      if (code === USER_DATA) {
	        var _ret = function () {
	          var totalMsgByteLength = dataView.getUint32(12);
	          var senderId = dataView.getUint32(2);
	          if (totalMsgByteLength > formatter.getMaxMsgByteLength()) {
	            (function () {
	              var msgId = dataView.getUint32(10);
	              var msgMap = void 0;
	              if (_this5.buffers.has(senderId)) {
	                msgMap = _this5.buffers.get(senderId);
	              } else {
	                msgMap = new Map();
	                _this5.buffers.set(senderId, msgMap);
	              }
	              var chunkNb = dataView.getUint16(16);
	              if (msgMap.has(msgId)) {
	                msgMap.get(msgId).add(dataView.buffer, chunkNb);
	              } else {
	                var buf = new _Buffer2.default(totalMsgByteLength, function (i8array) {
	                  _this5.onMessage(senderId, decoder.decode(i8array));
	                  msgMap.delete(msgId);
	                });
	                buf.add(dataView.buffer, chunkNb);
	                msgMap.set(msgId, buf);
	              }
	            })();
	          } else {
	            var uInt8Array = new Uint8Array(data);
	            var str = decoder.decode(uInt8Array.subarray(_MessageFormatterService.USER_MSG_BYTE_OFFSET, uInt8Array.byteLength));
	            _this5.onMessage(senderId, str);
	          }
	          return {
	            v: void 0
	          };
	        }();

	        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	      } else {
	        var msg = {};
	        var uInt8Array = new Uint8Array(data);
	        var str = decoder.decode(uInt8Array.subarray(1, uInt8Array.byteLength));
	        msg = JSON.parse(str);
	        var jp = void 0;
	        switch (code) {
	          // case USER_DATA:
	          //   this.webChannel.onMessage(msg.id, msg.data)
	          //   break
	          case LEAVE:
	            this.onLeaving(msg.id);
	            var _iteratorNormalCompletion2 = true;
	            var _didIteratorError2 = false;
	            var _iteratorError2 = undefined;

	            try {
	              for (var _iterator2 = this.channels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                var c = _step2.value;

	                if (c.peerId === msg.id) {
	                  this.channels.delete(c);
	                }
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

	            break;
	          case SERVICE_DATA:
	            if (this.myId === msg.recepient) {
	              (0, _serviceProvider2.default)(msg.serviceName, this.settings).onMessage(this, channel, msg.data);
	            } else {
	              this.sendSrvMsg(msg.serviceName, msg.recepient, msg.data);
	            }
	            break;
	          case JOIN_INIT:
	            this.topology = msg.manager;
	            this.myId = msg.id;
	            channel.peerId = msg.intermediaryId;
	            jp = new _JoiningPeer2.default(this.myId, channel.peerId);
	            jp.intermediaryChannel = channel;
	            this.addJoiningPeer(jp);
	            break;
	          case JOIN_NEW_MEMBER:
	            this.addJoiningPeer(new _JoiningPeer2.default(msg.id, msg.intermediaryId));
	            break;
	          case REMOVE_NEW_MEMBER:
	            this.removeJoiningPeer(msg.id);
	            break;
	          case JOIN_FINILIZE:
	            this.joinSuccess(this.myId);
	            this.manager.broadcast(this, formatter.msg(JOIN_SUCCESS, { id: this.myId }));
	            this.onJoin();
	            break;
	          case JOIN_SUCCESS:
	            this.joinSuccess(msg.id);
	            this.onJoining(msg.id);
	            break;
	          case INIT_CHANNEL_PONG:
	            channel.onPong();
	            delete channel.onPong;
	            break;
	        }
	      }
	    }
	  }, {
	    key: 'onChannelError',
	    value: function onChannelError(evt) {
	      console.log('DATA_CHANNEL ERROR: ', evt);
	    }
	  }, {
	    key: 'onChannelClose',
	    value: function onChannelClose(evt) {
	      console.log('DATA_CHANNEL CLOSE: ', evt);
	    }
	  }, {
	    key: 'initChannel',
	    value: function initChannel(ch, isInitiator) {
	      var _this6 = this;

	      var id = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

	      return new Promise(function (resolve, reject) {
	        if (id === -1) {
	          id = _this6.generateId();
	        }
	        var channel = new _Channel2.default(ch, _this6, id);
	        // TODO: treat the case when the 'ping' or 'pong' message has not been received
	        if (isInitiator) {
	          channel.config();
	          channel.onPong = function () {
	            return resolve(channel);
	          };
	          ch.send('ping');
	        } else {
	          ch.onmessage = function (msgEvt) {
	            if (msgEvt.data === 'ping') {
	              channel.config();
	              channel.send(formatter.msg(INIT_CHANNEL_PONG));
	              resolve(channel);
	            }
	          };
	        }
	      });
	    }

	    /**
	     * joinSuccess - description
	     *
	     * @private
	     * @param  {type} id description
	     * @return {type}    description
	     */

	  }, {
	    key: 'joinSuccess',
	    value: function joinSuccess(id) {
	      var _this7 = this;

	      var jp = this.getJoiningPeer(id);
	      jp.channelsToAdd.forEach(function (c) {
	        _this7.channels.add(c);
	        _this7.joiningPeers.delete(jp);
	      });
	    }

	    /**
	     * getJoiningPeer - description
	     *
	     * @private
	     * @param  {type} id description
	     * @return {type}    description
	     */

	  }, {
	    key: 'getJoiningPeer',
	    value: function getJoiningPeer(id) {
	      var _iteratorNormalCompletion3 = true;
	      var _didIteratorError3 = false;
	      var _iteratorError3 = undefined;

	      try {
	        for (var _iterator3 = this.joiningPeers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	          var jp = _step3.value;

	          if (jp.id === id) {
	            return jp;
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

	      throw new Error('Joining peer not found!');
	    }

	    /**
	     * addJoiningPeer - description
	     *
	     * @private
	     * @param  {type} jp description
	     * @return {type}    description
	     */

	  }, {
	    key: 'addJoiningPeer',
	    value: function addJoiningPeer(jp) {
	      if (this.hasJoiningPeer(jp.id)) {
	        throw new Error('Joining peer already exists!');
	      }
	      this.joiningPeers.add(jp);
	    }

	    /**
	     * removeJoiningPeer - description
	     *
	     * @private
	     * @param  {type} id description
	     * @return {type}    description
	     */

	  }, {
	    key: 'removeJoiningPeer',
	    value: function removeJoiningPeer(id) {
	      if (this.hasJoiningPeer(id)) {
	        this.joiningPeers.delete(this.getJoiningPeer(id));
	      }
	    }

	    /**
	     * isJoining - description
	     *
	     * @private
	     * @return {type}  description
	     */

	  }, {
	    key: 'isJoining',
	    value: function isJoining() {
	      var _iteratorNormalCompletion4 = true;
	      var _didIteratorError4 = false;
	      var _iteratorError4 = undefined;

	      try {
	        for (var _iterator4 = this.joiningPeers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	          var jp = _step4.value;

	          if (jp.id === this.myId) {
	            return true;
	          }
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

	      return false;
	    }

	    /**
	     * hasJoiningPeer - description
	     *
	     * @private
	     * @param  {type} id description
	     * @return {type}    description
	     */

	  }, {
	    key: 'hasJoiningPeer',
	    value: function hasJoiningPeer(id) {
	      var _iteratorNormalCompletion5 = true;
	      var _didIteratorError5 = false;
	      var _iteratorError5 = undefined;

	      try {
	        for (var _iterator5 = this.joiningPeers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	          var jp = _step5.value;

	          if (jp.id === id) {
	            return true;
	          }
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

	      return false;
	    }

	    /**
	     * generateKey - description
	     *
	     * @private
	     * @return {type}  description
	     */

	  }, {
	    key: 'generateKey',
	    value: function generateKey() {
	      var MIN_LENGTH = 2;
	      var DELTA_LENGTH = 0;
	      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	      var result = '';
	      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

	      for (var i = 0; i < length; i++) {
	        result += MASK[Math.round(Math.random() * (MASK.length - 1))];
	      }
	      return result;
	    }
	  }, {
	    key: 'generateId',
	    value: function generateId() {
	      var MAX = 16777215;
	      var id = void 0;
	      do {
	        id = Math.floor(Math.random() * MAX);
	        var _iteratorNormalCompletion6 = true;
	        var _didIteratorError6 = false;
	        var _iteratorError6 = undefined;

	        try {
	          for (var _iterator6 = this.channels[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
	            var c = _step6.value;

	            if (c.peerId === id) {
	              continue;
	            }
	          }
	        } catch (err) {
	          _didIteratorError6 = true;
	          _iteratorError6 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion6 && _iterator6.return) {
	              _iterator6.return();
	            }
	          } finally {
	            if (_didIteratorError6) {
	              throw _iteratorError6;
	            }
	          }
	        }

	        if (this.myId === id) {
	          continue;
	        }
	        break;
	      } while (true);
	      return id;
	    }
	  }, {
	    key: 'topology',
	    set: function set(name) {
	      this.settings.topology = name;
	      this.manager = (0, _serviceProvider2.default)(this.settings.topology);
	    },
	    get: function get() {
	      return this.settings.topology;
	    }
	  }]);

	  return WebChannel;
	}();

	exports.WebChannel = WebChannel;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MESSAGE_FORMATTER = exports.FULLY_CONNECTED = exports.WEBRTC = undefined;
	exports.default = provide;

	var _FullyConnectedService = __webpack_require__(3);

	var _FullyConnectedService2 = _interopRequireDefault(_FullyConnectedService);

	var _WebRTCService = __webpack_require__(7);

	var _WebRTCService2 = _interopRequireDefault(_WebRTCService);

	var _MessageFormatterService = __webpack_require__(9);

	var _MessageFormatterService2 = _interopRequireDefault(_MessageFormatterService);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * Service Provider module is a helper module for {@link module:service}. It is
	 * responsible to instantiate all services. This module must be used to get
	 * any service instance.
	 * @module serviceProvider
	 */

	/**
	 * Constant used to get an instance of {@link WebRTCService}.
	 * @type {string}
	 */
	var WEBRTC = exports.WEBRTC = 'WebRTCService';

	/**
	 * Constant used to get an instance of {@link FullyConnectedService}.
	 * @type {string}
	 */
	var FULLY_CONNECTED = exports.FULLY_CONNECTED = 'FullyConnectedService';

	var MESSAGE_FORMATTER = exports.MESSAGE_FORMATTER = 'MessageFormatterService';

	var services = new Map();

	/**
	 * Provides the service instance specified by `name`.
	 *
	 * @param  {(module:serviceProvider.CHANNEL_PROXY|
	 *          module:serviceProvider.WEBRTC|
	 *          module:serviceProvider.FULLY_CONNECTED)} name - The service name.
	 * @param  {Object} [options] - Any options that the service accepts.
	 * @return {module:service~Interface} - Service instance.
	 */
	function provide(name) {
	  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	  if (services.has(name)) {
	    return services.get(name);
	  }
	  var service = void 0;
	  switch (name) {
	    case WEBRTC:
	      return new _WebRTCService2.default(options);
	    case FULLY_CONNECTED:
	      service = new _FullyConnectedService2.default();
	      services.set(name, service);
	      return service;
	    case MESSAGE_FORMATTER:
	      service = new _MessageFormatterService2.default();
	      services.set(name, service);
	      return service;
	    default:
	      return null;
	  }
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _webChannelManager = __webpack_require__(4);

	var wcManager = _interopRequireWildcard(_webChannelManager);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Fully connected web channel manager. Implements fully connected topology
	 * network, when each peer is connected to each other.
	 *
	 * @extends module:webChannelManager~Interface
	 */

	var FullyConnectedService = function (_wcManager$Interface) {
	  _inherits(FullyConnectedService, _wcManager$Interface);

	  function FullyConnectedService() {
	    _classCallCheck(this, FullyConnectedService);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(FullyConnectedService).apply(this, arguments));
	  }

	  _createClass(FullyConnectedService, [{
	    key: 'add',
	    value: function add(ch) {
	      var wCh = ch.webChannel;
	      var peers = [wCh.myId];
	      wCh.channels.forEach(function (ch) {
	        peers[peers.length] = ch.peerId;
	      });
	      wCh.joiningPeers.forEach(function (jp) {
	        if (ch.peerId !== jp.id) {
	          peers[peers.length] = jp.id;
	        }
	      });
	      return this.connectWith(wCh, ch.peerId, ch.peerId, peers);
	    }
	  }, {
	    key: 'broadcast',
	    value: function broadcast(webChannel, data) {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = webChannel.channels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var c = _step.value;

	          c.send(data);
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
	    }
	  }, {
	    key: 'sendTo',
	    value: function sendTo(id, webChannel, data) {
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = webChannel.channels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var c = _step2.value;

	          if (c.peerId === id) {
	            c.send(data);
	            return;
	          }
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
	    key: 'leave',
	    value: function leave(webChannel) {}
	  }]);

	  return FullyConnectedService;
	}(wcManager.Interface);

	exports.default = FullyConnectedService;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Interface = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _service = __webpack_require__(5);

	var service = _interopRequireWildcard(_service);

	var _serviceProvider = __webpack_require__(2);

	var _serviceProvider2 = _interopRequireDefault(_serviceProvider);

	var _JoiningPeer = __webpack_require__(6);

	var _JoiningPeer2 = _interopRequireDefault(_JoiningPeer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Web Channel Manager module is a submodule of {@link module:service} and the
	 * main component of any Web Channel. It is responsible to preserve Web Channel
	 * structure intact (i.e. all peers have the same vision of the Web Channel).
	 * Among its duties are:
	 *
	 * - Add a new peer into Web Channel.
	 * - Remove a peer from Web Channel.
	 * - Send a broadcast message.
	 * - Send a message to a particular peer.
	 *
	 * @module webChannelManager
	 * @see FullyConnectedService
	 */

	/**
	 * Connection service of the peer who received a message of this type should
	 * establish connection with one or several peers.
	 */
	var CONNECT_WITH = 1;
	var CONNECT_WITH_FEEDBACK = 2;
	var CONNECT_WITH_TIMEOUT = 5000;
	var ADD_INTERMEDIARY_CHANNEL = 4;
	var THIS_CHANNEL_TO_JOINING_PEER = 5;

	/**
	 * Each Web Channel Manager Service must implement this interface.
	 * @interface
	 * @extends module:service~Interface
	 */

	var Interface = function (_service$Interface) {
	  _inherits(Interface, _service$Interface);

	  function Interface() {
	    _classCallCheck(this, Interface);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(Interface).apply(this, arguments));
	  }

	  _createClass(Interface, [{
	    key: 'onMessage',
	    value: function onMessage(wc, channel, msg) {
	      var _this2 = this;

	      var cBuilder = (0, _serviceProvider2.default)(wc.settings.connector, wc.settings);
	      switch (msg.code) {
	        case CONNECT_WITH:
	          msg.peers = this.reUseIntermediaryChannelIfPossible(wc, msg.jpId, msg.peers);
	          var failed = [];
	          if (msg.peers.length === 0) {
	            wc.sendSrvMsg(this.name, msg.sender, { code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: failed });
	          } else {
	            (function () {
	              var counter = 0;
	              msg.peers.forEach(function (id) {
	                cBuilder.connectMeTo(wc, id).then(function (channel) {
	                  return wc.initChannel(channel, true, id);
	                }).then(function (channel) {
	                  wc.getJoiningPeer(msg.jpId).toAddList(channel);
	                  wc.sendSrvMsg(_this2.name, wc.myId, { code: THIS_CHANNEL_TO_JOINING_PEER, id: msg.jpId, toBeAdded: true }, channel);
	                  counter++;
	                  if (counter === msg.peers.length) {
	                    wc.sendSrvMsg(_this2.name, msg.sender, { code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: failed });
	                  }
	                }).catch(function (reason) {
	                  counter++;
	                  failed.push({ id: id, reason: reason });
	                  if (counter === msg.peers.length) {
	                    wc.sendSrvMsg(_this2.name, msg.sender, { code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: failed });
	                  }
	                });
	              });
	            })();
	          }
	          break;
	        case CONNECT_WITH_FEEDBACK:
	          wc.connectWithRequests.get(msg.id)(true);
	          break;
	        case ADD_INTERMEDIARY_CHANNEL:
	          var jp = wc.getJoiningPeer(msg.jpId);
	          jp.toAddList(jp.intermediaryChannel);
	          break;
	        case THIS_CHANNEL_TO_JOINING_PEER:
	          if (wc.hasJoiningPeer(msg.id)) {
	            jp = wc.getJoiningPeer(msg.id);
	          } else {
	            jp = new _JoiningPeer2.default(msg.id);
	            wc.addJoiningPeer(jp);
	          }
	          if (msg.toBeAdded) {
	            jp.toAddList(this);
	          } else {
	            jp.toRemoveList(this);
	          }
	          break;
	      }
	    }

	    /**
	     * Send a request to a peer asking him to establish a connection with some
	     * peers. This function is used when a new peer is joining Web Channel.
	     * The request can be sent to the peer who is joining as well as other peers
	     * who are already members of Web Channel.
	     *
	     * @param  {WebChannel} wc - The Web Channel.
	     * @param  {string} id - Id of the peer who will receive this request.
	     * @param  {string} jpId - Joining peer id (it is possible that `id`=`jpId`).
	     * @param  {string[]} peers - Ids of peers with whom `id` peer must established
	    *              connections.
	     * @return {Promise} - Is resolved once some of the connections could be established. It is rejected when an error occured.
	     */

	  }, {
	    key: 'connectWith',
	    value: function connectWith(wc, id, jpId, peers) {
	      var _this3 = this;

	      wc.sendSrvMsg(this.name, id, { code: CONNECT_WITH, jpId: jpId, sender: wc.myId, peers: peers });
	      return new Promise(function (resolve, reject) {
	        wc.connectWithRequests.set(id, function (isDone) {
	          if (isDone) {
	            resolve();
	          } else {
	            reject();
	          }
	        });
	        setTimeout(function () {
	          reject('CONNECT_WITH_TIMEOUT');
	        }, _this3.calculateConnectWithTimeout(peers.length));
	      });
	    }
	  }, {
	    key: 'calculateConnectWithTimeout',
	    value: function calculateConnectWithTimeout(nbPeers) {
	      if (nbPeers > 0) {
	        return CONNECT_WITH_TIMEOUT + Math.log10(nbPeers);
	      } else {
	        return CONNECT_WITH_TIMEOUT;
	      }
	    }
	  }, {
	    key: 'reUseIntermediaryChannelIfPossible',
	    value: function reUseIntermediaryChannelIfPossible(webChannel, jpId, ids) {
	      var idToRemove = null;
	      var jp = void 0;
	      if (webChannel.isJoining()) {
	        jp = webChannel.getJoiningPeer(jpId);
	        if (ids.indexOf(jp.intermediaryId) !== -1) {
	          idToRemove = jp.intermediaryId;
	        }
	      } else {
	        if (ids.indexOf(jpId) !== -1) {
	          jp = webChannel.getJoiningPeer(jpId);
	          if (jp.intermediaryChannel !== null) {
	            idToRemove = jpId;
	          }
	        }
	      }
	      if (idToRemove !== null) {
	        jp.toAddList(jp.intermediaryChannel);
	        webChannel.sendSrvMsg(this.name, idToRemove, {
	          code: ADD_INTERMEDIARY_CHANNEL, jpId: jpId
	        });
	        ids.splice(ids.indexOf(idToRemove), 1);
	      }
	      return ids;
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

	  return Interface;
	}(service.Interface);

	exports.
	/** @see module:webChannelManager~Interface */
	Interface = Interface;

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Service module includes {@link module:channelBuilder},
	 * {@link module:webChannelManager} and {@link module:channelProxy} modules.
	 * Services are substitutable stateless objects. Each service is identified by
	 * its class name and can receive messages via `WebChannel` sent by another
	 * service.
	 *
	 * @module service
	 * @see module:channelBuilder
	 * @see module:webChannelManager
	 * @see module:channelProxy
	 */

	/**
	 * Each service must implement this interface.
	 *
	 * @interface
	 */

	var Interface = function () {
	  function Interface() {
	    _classCallCheck(this, Interface);
	  }

	  _createClass(Interface, [{
	    key: "name",


	    /**
	     * Service name which corresponds to its class name.
	     *
	     * @return {string} - name
	     */
	    get: function get() {
	      return this.constructor.name;
	    }
	  }]);

	  return Interface;
	}();

	exports.
	/** @see module:service~Interface */
	Interface = Interface;

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * This class represents a temporary state of a peer, while he is about to join
	 * the web channel. During the joining process every peer in the web channel
	 * and the joining peer have an instance of this class with the same `id` and
	 * `intermediaryId` attribute values. After the joining process has been finished
	 * regardless of success, these instances will be deleted.
	 */

	var JoiningPeer = function () {
	  function JoiningPeer(id, intermediaryId) {
	    _classCallCheck(this, JoiningPeer);

	    /**
	     * The joining peer id.
	     *
	     * @type {string}
	     */
	    this.id = id;

	    /**
	     * The id of the peer who invited the joining peer to the web channel. It is
	     * a member of the web channel and called an intermediary peer between the
	     * joining peer and the web channel. The same value for all instances.
	     *
	     * @type {string}
	     */
	    this.intermediaryId = intermediaryId;

	    /**
	     * The channel between the joining peer and intermediary peer. It is null
	     * for every peer, but the joining and intermediary peers.
	     *
	     * @type {Channel}
	     */
	    this.intermediaryChannel = null;

	    /**
	     * This attribute is proper to each peer. Array of channels which will be
	     * added to the current peer once the joining peer become the member of the
	     * web channel.
	     *
	     * @type {Array[Channel]}
	     */
	    this.channelsToAdd = [];

	    /**
	     * This attribute is proper to each peer. Array of channels which will be
	     * closed with the current peer once the joining peer become the member of the
	     * web channel.
	     *
	     * @type {Array[Channel]}
	     */
	    this.channelsToRemove = [];
	  }

	  /**
	   * Add channel to `channelsToAdd` array.
	   *
	   * @param  {Channel} channel - Channel to add.
	   */


	  _createClass(JoiningPeer, [{
	    key: "toAddList",
	    value: function toAddList(channel) {
	      this.channelsToAdd[this.channelsToAdd.length] = channel;
	    }

	    /**
	     * Add channel to `channelsToRemove` array
	     *
	     * @param  {Channel} channel - Channel to add.
	     */

	  }, {
	    key: "toRemoveList",
	    value: function toRemoveList(channel) {
	      this.channelsToAdd[this.channelsToAdd.length] = channel;
	    }
	  }]);

	  return JoiningPeer;
	}();

	exports.default = JoiningPeer;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @external RTCPeerConnection
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCPeerConnection}
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */
	/**
	 * @external RTCSessionDescription
	 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCSessionDescription}
	 */
	/**
	 * @external RTCDataChannel
	 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCDataChannel}
	 */
	/**
	 * @external RTCIceCandidate
	 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCIceCandidate}
	 */
	/**
	 * @external RTCPeerConnectionIceEvent
	 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCPeerConnectionIceEvent}
	 */

	var _channelBuilder = __webpack_require__(8);

	var channelBuilder = _interopRequireWildcard(_channelBuilder);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Ice candidate event handler.
	 *
	 * @callback WebRTCService~onCandidate
	 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
	 */

	/**
	 * Session description event handler.
	 *
	 * @callback WebRTCService~onSDP
	 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
	 */

	/**
	 * Data channel event handler.
	 *
	 * @callback WebRTCService~onChannel
	 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
	 */

	/**
	 * The goal of this class is to prevent the error when adding an ice candidate
	 * before the remote description has been set.
	 */

	var RTCPendingConnections = function () {
	  function RTCPendingConnections() {
	    _classCallCheck(this, RTCPendingConnections);

	    this.connections = new Map();
	  }

	  /**
	   * Prepares pending connection for the specified peer only if it has not been added already.
	   *
	   * @param  {string} id - Peer id
	   */


	  _createClass(RTCPendingConnections, [{
	    key: 'add',
	    value: function add(id) {
	      var _this = this;

	      if (!this.connections.has(id)) {
	        (function () {
	          var pc = null;
	          var obj = { promise: null };
	          obj.promise = new Promise(function (resolve, reject) {
	            Object.defineProperty(obj, 'pc', {
	              get: function get() {
	                return pc;
	              },
	              set: function set(value) {
	                pc = value;
	                resolve();
	              }
	            });
	            setTimeout(reject, CONNECT_TIMEOUT, 'timeout');
	          });
	          _this.connections.set(id, obj);
	        })();
	      }
	    }

	    /**
	     * Remove a pending connection from the Map. Usually when the connection has already
	     * been established and there is now interest to hold this reference.
	     *
	     * @param  {string} id - Peer id.
	     */

	  }, {
	    key: 'remove',
	    value: function remove(id) {
	      this.connections.delete(id);
	    }

	    /**
	     * Returns RTCPeerConnection object for the provided peer id.
	     *
	     * @param  {string} id - Peer id.
	     * @return {external:RTCPeerConnection} - Peer connection.
	     */

	  }, {
	    key: 'getPC',
	    value: function getPC(id) {
	      return this.connections.get(id).pc;
	    }

	    /**
	     * Updates RTCPeerConnection reference for the provided peer id.
	     *
	     * @param  {string} id - Peer id.
	     * @param  {external:RTCPeerConnection} pc - Peer connection.
	     */

	  }, {
	    key: 'setPC',
	    value: function setPC(id, pc) {
	      this.connections.get(id).pc = pc;
	    }

	    /**
	     * When the remote description is set, it will add the ice candidate to the
	     * peer connection of specified peer.
	     *
	     * @param  {string} id - Peer id.
	     * @param  {external:RTCIceCandidate} candidate - Ice candidate.
	     * @return {Promise} - Resolved once the ice candidate has been succesfully added.
	     */

	  }, {
	    key: 'addIceCandidate',
	    value: function addIceCandidate(id, candidate) {
	      var obj = this.connections.get(id);
	      return obj.promise.then(function () {
	        return obj.pc.addIceCandidate(candidate);
	      });
	    }
	  }]);

	  return RTCPendingConnections;
	}();

	var CONNECT_TIMEOUT = 2000;
	var connectionsByWC = new Map();

	/**
	 * Service class responsible to establish connections between peers via
	 * `RTCDataChannel`.
	 *
	 * @see {@link external:RTCPeerConnection}
	 * @extends module:channelBuilder~Interface
	 */

	var WebRTCService = function (_channelBuilder$Inter) {
	  _inherits(WebRTCService, _channelBuilder$Inter);

	  /**
	   * WebRTCService constructor.
	   *
	   * @param  {Object} [options] - This service options.
	   * @param  {Object} [options.signaling='wws://sigver-coastteam.rhcloud.com:8000'] -
	   * Signaling server URL.
	   * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
	   * and TURN servers to be used.
	   */

	  function WebRTCService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebRTCService);

	    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(WebRTCService).call(this));

	    _this2.defaults = {
	      signaling: 'wws://sigver-coastteam.rhcloud.com:8000',
	      iceServers: [{ urls: 'stun:23.21.150.121' }, { urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com' }]
	    };
	    _this2.settings = Object.assign({}, _this2.defaults, options);
	    return _this2;
	  }

	  _createClass(WebRTCService, [{
	    key: 'open',
	    value: function open(key, onChannel) {
	      var _this3 = this;

	      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	      var settings = Object.assign({}, this.settings, options);
	      return new Promise(function (resolve, reject) {
	        var connections = new RTCPendingConnections();
	        var socket = void 0;
	        try {
	          socket = new window.WebSocket(settings.signaling);
	        } catch (err) {
	          reject(err.message);
	        }
	        // Send a message to signaling server: ready to receive offer
	        socket.onopen = function () {
	          try {
	            socket.send(JSON.stringify({ key: key }));
	          } catch (err) {
	            reject(err.message);
	          }
	          // TODO: find a better solution than setTimeout. This is for the case when the key already exists and thus the server will close the socket, but it will close it after this function resolves the Promise.
	          setTimeout(resolve, 100, { key: key, url: settings.signaling, socket: socket });
	        };
	        socket.onmessage = function (evt) {
	          var msg = JSON.parse(evt.data);
	          if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
	            console.log('Unknown message from the signaling server: ' + evt.data);
	            socket.close();
	            return;
	          }
	          connections.add(msg.id);
	          if (Reflect.has(msg.data, 'offer')) {
	            _this3.createPeerConnectionAndAnswer(function (candidate) {
	              return socket.send(JSON.stringify({ id: msg.id, data: { candidate: candidate } }));
	            }, function (answer) {
	              return socket.send(JSON.stringify({ id: msg.id, data: { answer: answer } }));
	            }, onChannel, msg.data.offer).then(function (pc) {
	              return connections.setPC(msg.id, pc);
	            }).catch(function (reason) {
	              console.error('Answer generation failed: ' + reason);
	            });
	          } else if (Reflect.has(msg.data, 'candidate')) {
	            connections.addIceCandidate(msg.id, _this3.createIceCandidate(msg.data.candidate)).catch(function (reason) {
	              console.error('Adding ice candidate failed: ' + reason);
	            });
	          }
	        };
	        socket.onclose = function (closeEvt) {
	          if (closeEvt.code !== 1000) {
	            console.error('Socket with signaling server ' + settings.signaling + ' has been closed with code ' + closeEvt.code + ': ' + closeEvt.reason);
	            reject(closeEvt.reason);
	          }
	        };
	      });
	    }
	  }, {
	    key: 'join',
	    value: function join(key) {
	      var _this4 = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);
	      return new Promise(function (resolve, reject) {
	        var pc = void 0;
	        // Connect to the signaling server
	        var socket = new WebSocket(settings.signaling);
	        socket.onopen = function () {
	          // Prepare and send offer
	          _this4.createPeerConnectionAndOffer(function (candidate) {
	            return socket.send(JSON.stringify({ data: { candidate: candidate } }));
	          }, function (offer) {
	            return socket.send(JSON.stringify({ join: key, data: { offer: offer } }));
	          }, resolve).then(function (peerConnection) {
	            pc = peerConnection;
	          }).catch(reject);
	        };
	        socket.onmessage = function (evt) {
	          try {
	            var msg = JSON.parse(evt.data);
	            // Check message format
	            if (!Reflect.has(msg, 'data')) {
	              reject('Unknown message from the signaling server: ' + evt.data);
	            }

	            if (Reflect.has(msg.data, 'answer')) {
	              pc.setRemoteDescription(_this4.createSessionDescription(msg.data.answer)).catch(reject);
	            } else if (Reflect.has(msg.data, 'candidate')) {
	              pc.addIceCandidate(_this4.createIceCandidate(msg.data.candidate)).catch(function (evt) {
	                // This exception does not reject the current Promise, because
	                // still the connection may be established even without one or
	                // several candidates
	                console.error('Adding candidate failed: ', evt);
	              });
	            } else {
	              reject('Unknown message from the signaling server: ' + evt.data);
	            }
	          } catch (err) {
	            reject(err.message);
	          }
	        };
	        socket.onerror = function (evt) {
	          reject('WebSocket with signaling server error');
	        };
	        socket.onclose = function (closeEvt) {
	          if (closeEvt.code !== 1000) {
	            reject('Socket with signaling server ' + settings.signaling + ' has been closed with code ' + closeEvt.code + ': ' + closeEvt.reason);
	          }
	        };
	      });
	    }
	  }, {
	    key: 'connectMeTo',
	    value: function connectMeTo(wc, id) {
	      var _this5 = this;

	      return new Promise(function (resolve, reject) {
	        var sender = wc.myId;
	        var connections = _this5.getPendingConnections(wc);
	        connections.add(id);
	        _this5.createPeerConnectionAndOffer(function (candidate) {
	          return wc.sendSrvMsg(_this5.name, id, { sender: sender, candidate: candidate });
	        }, function (offer) {
	          return wc.sendSrvMsg(_this5.name, id, { sender: sender, offer: offer });
	        }, function (channel) {
	          connections.remove(id);
	          resolve(channel);
	        }).then(function (pc) {
	          return connections.setPC(id, pc);
	        });
	        setTimeout(reject, CONNECT_TIMEOUT, 'Timeout');
	      });
	    }
	  }, {
	    key: 'onMessage',
	    value: function onMessage(wc, channel, msg) {
	      var _this6 = this;

	      var connections = this.getPendingConnections(wc);
	      connections.add(msg.sender);
	      if (Reflect.has(msg, 'offer')) {
	        this.createPeerConnectionAndAnswer(function (candidate) {
	          return wc.sendSrvMsg(_this6.name, msg.sender, { sender: wc.myId, candidate: candidate });
	        }, function (answer) {
	          return wc.sendSrvMsg(_this6.name, msg.sender, { sender: wc.myId, answer: answer });
	        }, function (channel) {
	          wc.initChannel(channel, false, msg.sender);
	          connections.remove(channel.peerId);
	        }, msg.offer).then(function (pc) {
	          connections.setPC(msg.sender, pc);
	        });
	      }if (Reflect.has(msg, 'answer')) {
	        connections.getPC(msg.sender).setRemoteDescription(this.createSessionDescription(msg.answer)).catch(function (reason) {
	          console.error('Setting answer error: ' + reason);
	        });
	      } else if (Reflect.has(msg, 'candidate')) {
	        connections.addIceCandidate(msg.sender, this.createIceCandidate(msg.candidate)).catch(function (reason) {
	          console.error('Setting candidate error: ' + reason);
	        });
	      }
	    }

	    /**
	     * Creates a peer connection and generates an SDP offer.
	     *
	     * @param  {WebRTCService~onCandidate} onCandidate - Ice candidate event handler.
	     * @param  {WebRTCService~onSDP} sendOffer - Session description event handler.
	     * @param  {WebRTCService~onChannel} onChannel - Handler event when the data channel is ready.
	     * @return {Promise} - Resolved when the offer has been succesfully created,
	     * set as local description and sent to the peer.
	     */

	  }, {
	    key: 'createPeerConnectionAndOffer',
	    value: function createPeerConnectionAndOffer(onCandidate, sendOffer, onChannel) {
	      var pc = this.createPeerConnection(onCandidate);
	      var dc = pc.createDataChannel(null);
	      pc.oniceconnectionstatechange = function () {
	        if (pc.iceConnectionState === 'disconnected') {
	          dc.onclose();
	        }
	      };
	      dc.onopen = function (evt) {
	        return onChannel(dc);
	      };
	      return pc.createOffer().then(function (offer) {
	        return pc.setLocalDescription(offer);
	      }).then(function () {
	        sendOffer(pc.localDescription.toJSON());
	        return pc;
	      });
	    }

	    /**
	     * Creates a peer connection and generates an SDP answer.
	     *
	     * @param  {WebRTCService~onCandidate} onCandidate - Ice candidate event handler.
	     * @param  {WebRTCService~onSDP} sendOffer - Session description event handler.
	     * @param  {WebRTCService~onChannel} onChannel - Handler event when the data channel is ready.
	     * @param  {Object} offer - Offer received from a peer.
	     * @return {Promise} - Resolved when the offer has been succesfully created,
	     * set as local description and sent to the peer.
	     */

	  }, {
	    key: 'createPeerConnectionAndAnswer',
	    value: function createPeerConnectionAndAnswer(onCandidate, sendAnswer, onChannel, offer) {
	      var pc = this.createPeerConnection(onCandidate);
	      pc.ondatachannel = function (dcEvt) {
	        var dc = dcEvt.channel;
	        pc.oniceconnectionstatechange = function () {
	          if (pc.iceConnectionState === 'disconnected') {
	            dc.onclose();
	          }
	        };
	        dc.onopen = function (evt) {
	          return onChannel(dc);
	        };
	      };
	      return pc.setRemoteDescription(this.createSessionDescription(offer)).then(function () {
	        return pc.createAnswer();
	      }).then(function (answer) {
	        return pc.setLocalDescription(answer);
	      }).then(function () {
	        sendAnswer(pc.localDescription.toJSON());
	        return pc;
	      });
	    }

	    /**
	     * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
	     *
	     * @private
	     * @param  {WebRTCService~onCandidate} onCandidate - Ice
	     * candidate event handler.
	     * @return {external:RTCPeerConnection} - Peer connection.
	     */

	  }, {
	    key: 'createPeerConnection',
	    value: function createPeerConnection(onCandidate) {
	      var pc = new RTCPeerConnection({ iceServers: this.settings.iceServers });
	      pc.onicecandidate = function (evt) {
	        if (evt.candidate !== null) {
	          var candidate = {
	            candidate: evt.candidate.candidate,
	            sdpMLineIndex: evt.candidate.sdpMLineIndex
	          };
	          onCandidate(candidate);
	        }
	      };
	      return pc;
	    }

	    /**
	     * Creates an instance of `RTCIceCandidate`.
	     *
	     * @private
	     * @param  {Object} candidate - Candidate object created in
	     * {@link WebRTCService#createPeerConnection}.
	     * @param {} candidate.candidate
	     * @param {} candidate.sdpMLineIndex
	     * @return {external:RTCIceCandidate} - Ice candidate.
	     */

	  }, {
	    key: 'createIceCandidate',
	    value: function createIceCandidate(candidate) {
	      return new RTCIceCandidate(candidate);
	    }

	    /**
	     * Creates an instance of `RTCSessionDescription`.
	     *
	     * @private
	     * @param  {Object} sd - An offer or an answer created by WebRTC API.
	     * @param  {} sd.type
	     * @param  {} sd.sdp
	     * @return {external:RTCSessionDescription} - Session description.
	     */

	  }, {
	    key: 'createSessionDescription',
	    value: function createSessionDescription(sd) {
	      return Object.assign(new RTCSessionDescription(), sd);
	    }
	  }, {
	    key: 'getPendingConnections',
	    value: function getPendingConnections(wc) {
	      if (connectionsByWC.has(wc.id)) {
	        return connectionsByWC.get(wc.id);
	      } else {
	        var connections = new RTCPendingConnections();
	        connectionsByWC.set(wc.id, connections);
	        return connections;
	      }
	    }
	  }]);

	  return WebRTCService;
	}(channelBuilder.Interface);

	exports.default = WebRTCService;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Interface = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _service = __webpack_require__(5);

	var service = _interopRequireWildcard(_service);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Channel Builder module is responsible to create a connection between two
	 * peers.
	 * @module channelBuilder
	 * @see Channel
	 */

	/**
	 * On channel callback for {@link module:channelBuilder~Interface#open}
	 * function.
	 *
	 * @callback module:channelBuilder~onChannelCallback
	 * @param {Channel} channel - A new channel.
	 */

	/**
	 * Call back to initialize the channel. It should be executed on both peer
	 * sides during connection establishment to assure that both channels would be
	 * ready to be used in the web channel.
	 *
	 * @callback module:channelBuilder~initChannel
	 * @param {Channel} ch - Channel.
	 * @param {string} id - Unique channel identifier.
	 */

	/**
	 * Interface to be implemented by each connection service.
	 *
	 * @interface
	 * @extends module:service~Interface
	 */

	var Interface = function (_service$Interface) {
	  _inherits(Interface, _service$Interface);

	  function Interface() {
	    _classCallCheck(this, Interface);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(Interface).apply(this, arguments));
	  }

	  _createClass(Interface, [{
	    key: 'open',

	    /**
	     * Enables other clients to establish a connection with you.
	     *
	     * @abstract
	     * @param {string} key - The unique identifier which has to be passed to the
	     * peers who need to connect to you.
	     * @param {module:channelBuilder~Interface~onChannelCallback} onChannel - Callback
	     * function to execute once the connection has been established.
	     * @param {Object} [options] - Any other options which depend on the service implementation.
	     * @return {Promise} - Once resolved, provide an Object with `key` and `url`
	     * attributes to be passed to {@link module:channelBuilder~Interface#join} function.
	     * It is rejected if an error occured.
	     */
	    value: function open(key, onChannel, options) {
	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * Connects you with the peer who provided the `key`.
	     *
	     * @abstract
	     * @param  {string} key - A key obtained from the peer who executed
	     * {@link module:channelBuilder~Interface#open} function.
	     * @param  {Object} [options] Any other options which depend on the implementation.
	     * @return {Promise} It is resolved when the connection is established, otherwise it is rejected.
	     */

	  }, {
	    key: 'join',
	    value: function join(key, options) {
	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * Establish a connection between you and another peer (including joining peer) via web channel.
	     *
	     * @abstract
	     * @param  {WebChannel} wc - Web Channel through which the connection will be established.
	     * @param  {string} id - Peer id with whom you will be connected.
	     * @return {Promise} - Resolved once the connection has been established, rejected otherwise.
	     */

	  }, {
	    key: 'connectMeTo',
	    value: function connectMeTo(wc, id) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }]);

	  return Interface;
	}(service.Interface);

	exports.
	/** @see module:channelBuilder~Interface */
	Interface = Interface;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ARRAYBUFFER_TYPE = exports.UINT8ARRAY_TYPE = exports.STRING_TYPE = exports.USER_MSG_BYTE_OFFSET = exports.MAX_CHANNEL_MSG_BYTE_SIZE = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _service = __webpack_require__(5);

	var service = _interopRequireWildcard(_service);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	// Max message size sent on Channel: 16kb
	var MAX_CHANNEL_MSG_BYTE_SIZE = exports.MAX_CHANNEL_MSG_BYTE_SIZE = 16384;

	var USER_MSG_BYTE_OFFSET = exports.USER_MSG_BYTE_OFFSET = 18;

	var STRING_TYPE = exports.STRING_TYPE = 100;

	var UINT8ARRAY_TYPE = exports.UINT8ARRAY_TYPE = 101;

	var ARRAYBUFFER_TYPE = exports.ARRAYBUFFER_TYPE = 102;

	var MessageFormatter = function (_service$Interface) {
	  _inherits(MessageFormatter, _service$Interface);

	  function MessageFormatter() {
	    _classCallCheck(this, MessageFormatter);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(MessageFormatter).apply(this, arguments));
	  }

	  _createClass(MessageFormatter, [{
	    key: 'splitUserMessage',
	    value: function splitUserMessage(data, code, senderId, recipientId, action) {
	      var dataType = this.getDataType(data);
	      var uInt8Array = void 0;
	      switch (dataType) {
	        case STRING_TYPE:
	          uInt8Array = new TextEncoder().encode(data);
	          break;
	        case UINT8ARRAY_TYPE:
	          uInt8Array = data;
	          break;
	        case ARRAYBUFFER_TYPE:
	          uInt8Array = new Uint8Array(data);
	          break;
	        default:
	          return;
	      }

	      var maxUserDataLength = this.getMaxMsgByteLength();
	      var msgId = this.generateMsgId();
	      var totalChunksNb = Math.ceil(uInt8Array.byteLength / maxUserDataLength);
	      for (var chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
	        var chunkMsgByteLength = Math.min(maxUserDataLength, uInt8Array.byteLength - maxUserDataLength * chunkNb);
	        var index = maxUserDataLength * chunkNb;
	        var totalChunkByteLength = USER_MSG_BYTE_OFFSET + chunkMsgByteLength;
	        var dataView = new DataView(new ArrayBuffer(totalChunkByteLength));
	        dataView.setUint8(0, code);
	        dataView.setUint8(1, dataType);
	        dataView.setUint32(2, senderId);
	        dataView.setUint32(6, recipientId);
	        dataView.setUint16(10, msgId);
	        dataView.setUint32(12, uInt8Array.byteLength);
	        dataView.setUint16(16, chunkNb);
	        var resultUint8Array = new Uint8Array(dataView.buffer);
	        var j = USER_MSG_BYTE_OFFSET;
	        for (var i = index; i < index + chunkMsgByteLength; i++) {
	          resultUint8Array[j++] = uInt8Array[i];
	        }
	        action(resultUint8Array);
	      }
	    }
	  }, {
	    key: 'msg',
	    value: function msg(code) {
	      var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var msgEncoded = new TextEncoder().encode(JSON.stringify(data));
	      var i8array = new Uint8Array(1 + msgEncoded.length);
	      i8array[0] = code;
	      var index = 1;
	      for (var i in msgEncoded) {
	        i8array[index++] = msgEncoded[i];
	      }
	      return i8array;
	    }
	  }, {
	    key: 'getMaxMsgByteLength',
	    value: function getMaxMsgByteLength() {
	      return MAX_CHANNEL_MSG_BYTE_SIZE - USER_MSG_BYTE_OFFSET;
	    }
	  }, {
	    key: 'generateMsgId',
	    value: function generateMsgId() {
	      var MAX = 16777215;
	      return Math.round(Math.random() * MAX);
	    }
	  }, {
	    key: 'getDataType',
	    value: function getDataType(data) {
	      if (typeof data === 'string' || data instanceof String) {
	        return STRING_TYPE;
	      } else if (data instanceof Uint8Array) {
	        return UINT8ARRAY_TYPE;
	      } else if (data instanceof ArrayBuffer) {
	        return ARRAYBUFFER_TYPE;
	      }
	      return 0;
	    }
	  }]);

	  return MessageFormatter;
	}(service.Interface);

	exports.default = MessageFormatter;

/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Channel interface.
	 * [RTCDataChannel]{@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
	 * and
	 * [WebSocket]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket}
	 * implement it implicitly. Any other channel must implement this interface.
	 *
	 * @interface
	 */

	var Channel = function () {
	  function Channel(channel, webChannel, peerId) {
	    _classCallCheck(this, Channel);

	    channel.binaryType = 'arraybuffer';
	    this.channel = channel;
	    this.webChannel = webChannel;
	    this.peerId = peerId;
	  }

	  _createClass(Channel, [{
	    key: 'config',
	    value: function config() {
	      var _this = this;

	      this.channel.onmessage = function (msgEvt) {
	        _this.webChannel.onChannelMessage(_this, msgEvt.data);
	      };
	      this.channel.onerror = function (evt) {
	        _this.webChannel.onChannelError(evt);
	      };
	      this.channel.onclose = function (evt) {
	        _this.webChannel.onChannelClose(evt);
	      };
	    }

	    /**
	     * send - description.
	     *
	     * @abstract
	     * @param {string} msg - Message in stringified JSON format.
	     */

	  }, {
	    key: 'send',
	    value: function send(data) {
	      if (this.channel.readyState !== 'closed') {
	        this.channel.send(data);
	      }
	    }

	    /**
	     * Close channel.
	     *
	     * @abstract
	     */

	  }, {
	    key: 'close',
	    value: function close() {
	      this.channel.close();
	    }
	  }]);

	  return Channel;
	}();

	exports.default = Channel;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _serviceProvider = __webpack_require__(2);

	var _serviceProvider2 = _interopRequireDefault(_serviceProvider);

	var _MessageFormatterService = __webpack_require__(9);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var formatter = (0, _serviceProvider2.default)(_serviceProvider.MESSAGE_FORMATTER);

	var Buffer = function () {
	  function Buffer(totalByteLength, action) {
	    _classCallCheck(this, Buffer);

	    this.totalByteLength = totalByteLength;
	    this.currentByteLength = 0;
	    this.i8array = new Uint8Array(this.totalByteLength);
	    this.action = action;
	  }

	  _createClass(Buffer, [{
	    key: 'add',
	    value: function add(data, chunkNb) {
	      var maxSize = formatter.getMaxMsgByteLength();
	      var intU8Array = new Uint8Array(data);
	      this.currentByteLength += data.byteLength - _MessageFormatterService.USER_MSG_BYTE_OFFSET;
	      var index = chunkNb * maxSize;
	      for (var i = _MessageFormatterService.USER_MSG_BYTE_OFFSET; i < data.byteLength; i++) {
	        this.i8array[index++] = intU8Array[i];
	      }
	      if (this.currentByteLength === this.totalByteLength) {
	        this.action(this.i8array);
	      }
	    }
	  }]);

	  return Buffer;
	}();

	exports.default = Buffer;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var require;var require;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

	},{}],2:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */

	'use strict';

	// Shimming starts here.
	(function() {
	  // Utils.
	  var logging = require('./utils').log;
	  var browserDetails = require('./utils').browserDetails;
	  // Export to the adapter global object visible in the browser.
	  module.exports.browserDetails = browserDetails;
	  module.exports.extractVersion = require('./utils').extractVersion;
	  module.exports.disableLog = require('./utils').disableLog;

	  // Comment out the line below if you want logging to occur, including logging
	  // for the switch statement below. Can also be turned on in the browser via
	  // adapter.disableLog(false), but then logging from the switch statement below
	  // will not appear.
	  require('./utils').disableLog(true);

	  // Browser shims.
	  var chromeShim = require('./chrome/chrome_shim') || null;
	  var edgeShim = require('./edge/edge_shim') || null;
	  var firefoxShim = require('./firefox/firefox_shim') || null;
	  var safariShim = require('./safari/safari_shim') || null;

	  // Shim browser if found.
	  switch (browserDetails.browser) {
	    case 'opera': // fallthrough as it uses chrome shims
	    case 'chrome':
	      if (!chromeShim || !chromeShim.shimPeerConnection) {
	        logging('Chrome shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming chrome.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = chromeShim;

	      chromeShim.shimGetUserMedia();
	      chromeShim.shimSourceObject();
	      chromeShim.shimPeerConnection();
	      chromeShim.shimOnTrack();
	      break;
	    case 'firefox':
	      if (!firefoxShim || !firefoxShim.shimPeerConnection) {
	        logging('Firefox shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming firefox.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = firefoxShim;

	      firefoxShim.shimGetUserMedia();
	      firefoxShim.shimSourceObject();
	      firefoxShim.shimPeerConnection();
	      firefoxShim.shimOnTrack();
	      break;
	    case 'edge':
	      if (!edgeShim || !edgeShim.shimPeerConnection) {
	        logging('MS edge shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming edge.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = edgeShim;

	      edgeShim.shimPeerConnection();
	      break;
	    case 'safari':
	      if (!safariShim) {
	        logging('Safari shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming safari.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = safariShim;

	      safariShim.shimGetUserMedia();
	      break;
	    default:
	      logging('Unsupported browser!');
	  }
	})();

	},{"./chrome/chrome_shim":3,"./edge/edge_shim":1,"./firefox/firefox_shim":5,"./safari/safari_shim":7,"./utils":8}],3:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';
	var logging = require('../utils.js').log;
	var browserDetails = require('../utils.js').browserDetails;

	var chromeShim = {
	  shimOnTrack: function() {
	    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
	        window.RTCPeerConnection.prototype)) {
	      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
	        get: function() {
	          return this._ontrack;
	        },
	        set: function(f) {
	          var self = this;
	          if (this._ontrack) {
	            this.removeEventListener('track', this._ontrack);
	            this.removeEventListener('addstream', this._ontrackpoly);
	          }
	          this.addEventListener('track', this._ontrack = f);
	          this.addEventListener('addstream', this._ontrackpoly = function(e) {
	            // onaddstream does not fire when a track is added to an existing
	            // stream. But stream.onaddtrack is implemented so we use that.
	            e.stream.addEventListener('addtrack', function(te) {
	              var event = new Event('track');
	              event.track = te.track;
	              event.receiver = {track: te.track};
	              event.streams = [e.stream];
	              self.dispatchEvent(event);
	            });
	            e.stream.getTracks().forEach(function(track) {
	              var event = new Event('track');
	              event.track = track;
	              event.receiver = {track: track};
	              event.streams = [e.stream];
	              this.dispatchEvent(event);
	            }.bind(this));
	          }.bind(this));
	        }
	      });
	    }
	  },

	  shimSourceObject: function() {
	    if (typeof window === 'object') {
	      if (window.HTMLMediaElement &&
	        !('srcObject' in window.HTMLMediaElement.prototype)) {
	        // Shim the srcObject property, once, when HTMLMediaElement is found.
	        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
	          get: function() {
	            return this._srcObject;
	          },
	          set: function(stream) {
	            var self = this;
	            // Use _srcObject as a private property for this shim
	            this._srcObject = stream;
	            if (this.src) {
	              URL.revokeObjectURL(this.src);
	            }

	            if (!stream) {
	              this.src = '';
	              return;
	            }
	            this.src = URL.createObjectURL(stream);
	            // We need to recreate the blob url when a track is added or
	            // removed. Doing it manually since we want to avoid a recursion.
	            stream.addEventListener('addtrack', function() {
	              if (self.src) {
	                URL.revokeObjectURL(self.src);
	              }
	              self.src = URL.createObjectURL(stream);
	            });
	            stream.addEventListener('removetrack', function() {
	              if (self.src) {
	                URL.revokeObjectURL(self.src);
	              }
	              self.src = URL.createObjectURL(stream);
	            });
	          }
	        });
	      }
	    }
	  },

	  shimPeerConnection: function() {
	    // The RTCPeerConnection object.
	    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
	      // Translate iceTransportPolicy to iceTransports,
	      // see https://code.google.com/p/webrtc/issues/detail?id=4869
	      logging('PeerConnection');
	      if (pcConfig && pcConfig.iceTransportPolicy) {
	        pcConfig.iceTransports = pcConfig.iceTransportPolicy;
	      }

	      var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints);
	      var origGetStats = pc.getStats.bind(pc);
	      pc.getStats = function(selector, successCallback, errorCallback) {
	        var self = this;
	        var args = arguments;

	        // If selector is a function then we are in the old style stats so just
	        // pass back the original getStats format to avoid breaking old users.
	        if (arguments.length > 0 && typeof selector === 'function') {
	          return origGetStats(selector, successCallback);
	        }

	        var fixChromeStats_ = function(response) {
	          var standardReport = {};
	          var reports = response.result();
	          reports.forEach(function(report) {
	            var standardStats = {
	              id: report.id,
	              timestamp: report.timestamp,
	              type: report.type
	            };
	            report.names().forEach(function(name) {
	              standardStats[name] = report.stat(name);
	            });
	            standardReport[standardStats.id] = standardStats;
	          });

	          return standardReport;
	        };

	        if (arguments.length >= 2) {
	          var successCallbackWrapper_ = function(response) {
	            args[1](fixChromeStats_(response));
	          };

	          return origGetStats.apply(this, [successCallbackWrapper_,
	              arguments[0]]);
	        }

	        // promise-support
	        return new Promise(function(resolve, reject) {
	          if (args.length === 1 && typeof selector === 'object') {
	            origGetStats.apply(self,
	                [function(response) {
	                  resolve.apply(null, [fixChromeStats_(response)]);
	                }, reject]);
	          } else {
	            origGetStats.apply(self, [resolve, reject]);
	          }
	        });
	      };

	      return pc;
	    };
	    window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype;

	    // wrap static methods. Currently just generateCertificate.
	    if (webkitRTCPeerConnection.generateCertificate) {
	      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
	        get: function() {
	          return webkitRTCPeerConnection.generateCertificate;
	        }
	      });
	    }

	    // add promise support
	    ['createOffer', 'createAnswer'].forEach(function(method) {
	      var nativeMethod = webkitRTCPeerConnection.prototype[method];
	      webkitRTCPeerConnection.prototype[method] = function() {
	        var self = this;
	        if (arguments.length < 1 || (arguments.length === 1 &&
	            typeof(arguments[0]) === 'object')) {
	          var opts = arguments.length === 1 ? arguments[0] : undefined;
	          return new Promise(function(resolve, reject) {
	            nativeMethod.apply(self, [resolve, reject, opts]);
	          });
	        }
	        return nativeMethod.apply(this, arguments);
	      };
	    });

	    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
	        .forEach(function(method) {
	          var nativeMethod = webkitRTCPeerConnection.prototype[method];
	          webkitRTCPeerConnection.prototype[method] = function() {
	            var args = arguments;
	            var self = this;
	            args[0] = new ((method === 'addIceCandidate')?
	                RTCIceCandidate : RTCSessionDescription)(args[0]);
	            return new Promise(function(resolve, reject) {
	              nativeMethod.apply(self, [args[0],
	                  function() {
	                    resolve();
	                    if (args.length >= 2) {
	                      args[1].apply(null, []);
	                    }
	                  },
	                  function(err) {
	                    reject(err);
	                    if (args.length >= 3) {
	                      args[2].apply(null, [err]);
	                    }
	                  }]
	                );
	            });
	          };
	        });
	  },

	  // Attach a media stream to an element.
	  attachMediaStream: function(element, stream) {
	    logging('DEPRECATED, attachMediaStream will soon be removed.');
	    if (browserDetails.version >= 43) {
	      element.srcObject = stream;
	    } else if (typeof element.src !== 'undefined') {
	      element.src = URL.createObjectURL(stream);
	    } else {
	      logging('Error attaching stream to element.');
	    }
	  },

	  reattachMediaStream: function(to, from) {
	    logging('DEPRECATED, reattachMediaStream will soon be removed.');
	    if (browserDetails.version >= 43) {
	      to.srcObject = from.srcObject;
	    } else {
	      to.src = from.src;
	    }
	  }
	};


	// Expose public methods.
	module.exports = {
	  shimOnTrack: chromeShim.shimOnTrack,
	  shimSourceObject: chromeShim.shimSourceObject,
	  shimPeerConnection: chromeShim.shimPeerConnection,
	  shimGetUserMedia: require('./getusermedia'),
	  attachMediaStream: chromeShim.attachMediaStream,
	  reattachMediaStream: chromeShim.reattachMediaStream
	};

	},{"../utils.js":8,"./getusermedia":4}],4:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';
	var logging = require('../utils.js').log;

	// Expose public methods.
	module.exports = function() {
	  var constraintsToChrome_ = function(c) {
	    if (typeof c !== 'object' || c.mandatory || c.optional) {
	      return c;
	    }
	    var cc = {};
	    Object.keys(c).forEach(function(key) {
	      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
	        return;
	      }
	      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
	      if (r.exact !== undefined && typeof r.exact === 'number') {
	        r.min = r.max = r.exact;
	      }
	      var oldname_ = function(prefix, name) {
	        if (prefix) {
	          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
	        }
	        return (name === 'deviceId') ? 'sourceId' : name;
	      };
	      if (r.ideal !== undefined) {
	        cc.optional = cc.optional || [];
	        var oc = {};
	        if (typeof r.ideal === 'number') {
	          oc[oldname_('min', key)] = r.ideal;
	          cc.optional.push(oc);
	          oc = {};
	          oc[oldname_('max', key)] = r.ideal;
	          cc.optional.push(oc);
	        } else {
	          oc[oldname_('', key)] = r.ideal;
	          cc.optional.push(oc);
	        }
	      }
	      if (r.exact !== undefined && typeof r.exact !== 'number') {
	        cc.mandatory = cc.mandatory || {};
	        cc.mandatory[oldname_('', key)] = r.exact;
	      } else {
	        ['min', 'max'].forEach(function(mix) {
	          if (r[mix] !== undefined) {
	            cc.mandatory = cc.mandatory || {};
	            cc.mandatory[oldname_(mix, key)] = r[mix];
	          }
	        });
	      }
	    });
	    if (c.advanced) {
	      cc.optional = (cc.optional || []).concat(c.advanced);
	    }
	    return cc;
	  };

	  var getUserMedia_ = function(constraints, onSuccess, onError) {
	    constraints = JSON.parse(JSON.stringify(constraints));
	    if (constraints.audio) {
	      constraints.audio = constraintsToChrome_(constraints.audio);
	    }
	    if (constraints.video) {
	      constraints.video = constraintsToChrome_(constraints.video);
	    }
	    logging('chrome: ' + JSON.stringify(constraints));
	    return navigator.webkitGetUserMedia(constraints, onSuccess, onError);
	  };
	  navigator.getUserMedia = getUserMedia_;

	  // Returns the result of getUserMedia as a Promise.
	  var getUserMediaPromise_ = function(constraints) {
	    return new Promise(function(resolve, reject) {
	      navigator.getUserMedia(constraints, resolve, reject);
	    });
	  };

	  if (!navigator.mediaDevices) {
	    navigator.mediaDevices = {
	      getUserMedia: getUserMediaPromise_,
	      enumerateDevices: function() {
	        return new Promise(function(resolve) {
	          var kinds = {audio: 'audioinput', video: 'videoinput'};
	          return MediaStreamTrack.getSources(function(devices) {
	            resolve(devices.map(function(device) {
	              return {label: device.label,
	                      kind: kinds[device.kind],
	                      deviceId: device.id,
	                      groupId: ''};
	            }));
	          });
	        });
	      }
	    };
	  }

	  // A shim for getUserMedia method on the mediaDevices object.
	  // TODO(KaptenJansson) remove once implemented in Chrome stable.
	  if (!navigator.mediaDevices.getUserMedia) {
	    navigator.mediaDevices.getUserMedia = function(constraints) {
	      return getUserMediaPromise_(constraints);
	    };
	  } else {
	    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
	    // function which returns a Promise, it does not accept spec-style
	    // constraints.
	    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
	        bind(navigator.mediaDevices);
	    navigator.mediaDevices.getUserMedia = function(c) {
	      if (c) {
	        logging('spec:   ' + JSON.stringify(c)); // whitespace for alignment
	        c.audio = constraintsToChrome_(c.audio);
	        c.video = constraintsToChrome_(c.video);
	        logging('chrome: ' + JSON.stringify(c));
	      }
	      return origGetUserMedia(c);
	    }.bind(this);
	  }

	  // Dummy devicechange event methods.
	  // TODO(KaptenJansson) remove once implemented in Chrome stable.
	  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
	    navigator.mediaDevices.addEventListener = function() {
	      logging('Dummy mediaDevices.addEventListener called.');
	    };
	  }
	  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
	    navigator.mediaDevices.removeEventListener = function() {
	      logging('Dummy mediaDevices.removeEventListener called.');
	    };
	  }
	};

	},{"../utils.js":8}],5:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var logging = require('../utils').log;
	var browserDetails = require('../utils').browserDetails;

	var firefoxShim = {
	  shimOnTrack: function() {
	    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
	        window.RTCPeerConnection.prototype)) {
	      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
	        get: function() {
	          return this._ontrack;
	        },
	        set: function(f) {
	          if (this._ontrack) {
	            this.removeEventListener('track', this._ontrack);
	            this.removeEventListener('addstream', this._ontrackpoly);
	          }
	          this.addEventListener('track', this._ontrack = f);
	          this.addEventListener('addstream', this._ontrackpoly = function(e) {
	            e.stream.getTracks().forEach(function(track) {
	              var event = new Event('track');
	              event.track = track;
	              event.receiver = {track: track};
	              event.streams = [e.stream];
	              this.dispatchEvent(event);
	            }.bind(this));
	          }.bind(this));
	        }
	      });
	    }
	  },

	  shimSourceObject: function() {
	    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
	    if (typeof window === 'object') {
	      if (window.HTMLMediaElement &&
	        !('srcObject' in window.HTMLMediaElement.prototype)) {
	        // Shim the srcObject property, once, when HTMLMediaElement is found.
	        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
	          get: function() {
	            return this.mozSrcObject;
	          },
	          set: function(stream) {
	            this.mozSrcObject = stream;
	          }
	        });
	      }
	    }
	  },

	  shimPeerConnection: function() {
	    // The RTCPeerConnection object.
	    if (!window.RTCPeerConnection) {
	      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
	        if (browserDetails.version < 38) {
	          // .urls is not supported in FF < 38.
	          // create RTCIceServers with a single url.
	          if (pcConfig && pcConfig.iceServers) {
	            var newIceServers = [];
	            for (var i = 0; i < pcConfig.iceServers.length; i++) {
	              var server = pcConfig.iceServers[i];
	              if (server.hasOwnProperty('urls')) {
	                for (var j = 0; j < server.urls.length; j++) {
	                  var newServer = {
	                    url: server.urls[j]
	                  };
	                  if (server.urls[j].indexOf('turn') === 0) {
	                    newServer.username = server.username;
	                    newServer.credential = server.credential;
	                  }
	                  newIceServers.push(newServer);
	                }
	              } else {
	                newIceServers.push(pcConfig.iceServers[i]);
	              }
	            }
	            pcConfig.iceServers = newIceServers;
	          }
	        }
	        return new mozRTCPeerConnection(pcConfig, pcConstraints);
	      };
	      window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype;

	      // wrap static methods. Currently just generateCertificate.
	      if (mozRTCPeerConnection.generateCertificate) {
	        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
	          get: function() {
	            return mozRTCPeerConnection.generateCertificate;
	          }
	        });
	      }

	      window.RTCSessionDescription = mozRTCSessionDescription;
	      window.RTCIceCandidate = mozRTCIceCandidate;
	    }

	    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
	    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
	        .forEach(function(method) {
	          var nativeMethod = RTCPeerConnection.prototype[method];
	          RTCPeerConnection.prototype[method] = function() {
	            arguments[0] = new ((method === 'addIceCandidate')?
	                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
	            return nativeMethod.apply(this, arguments);
	          };
	        });
	  },

	  shimGetUserMedia: function() {
	    // getUserMedia constraints shim.
	    var getUserMedia_ = function(constraints, onSuccess, onError) {
	      var constraintsToFF37_ = function(c) {
	        if (typeof c !== 'object' || c.require) {
	          return c;
	        }
	        var require = [];
	        Object.keys(c).forEach(function(key) {
	          if (key === 'require' || key === 'advanced' ||
	              key === 'mediaSource') {
	            return;
	          }
	          var r = c[key] = (typeof c[key] === 'object') ?
	              c[key] : {ideal: c[key]};
	          if (r.min !== undefined ||
	              r.max !== undefined || r.exact !== undefined) {
	            require.push(key);
	          }
	          if (r.exact !== undefined) {
	            if (typeof r.exact === 'number') {
	              r. min = r.max = r.exact;
	            } else {
	              c[key] = r.exact;
	            }
	            delete r.exact;
	          }
	          if (r.ideal !== undefined) {
	            c.advanced = c.advanced || [];
	            var oc = {};
	            if (typeof r.ideal === 'number') {
	              oc[key] = {min: r.ideal, max: r.ideal};
	            } else {
	              oc[key] = r.ideal;
	            }
	            c.advanced.push(oc);
	            delete r.ideal;
	            if (!Object.keys(r).length) {
	              delete c[key];
	            }
	          }
	        });
	        if (require.length) {
	          c.require = require;
	        }
	        return c;
	      };
	      constraints = JSON.parse(JSON.stringify(constraints));
	      if (browserDetails.version < 38) {
	        logging('spec: ' + JSON.stringify(constraints));
	        if (constraints.audio) {
	          constraints.audio = constraintsToFF37_(constraints.audio);
	        }
	        if (constraints.video) {
	          constraints.video = constraintsToFF37_(constraints.video);
	        }
	        logging('ff37: ' + JSON.stringify(constraints));
	      }
	      return navigator.mozGetUserMedia(constraints, onSuccess, onError);
	    };

	    navigator.getUserMedia = getUserMedia_;

	    // Returns the result of getUserMedia as a Promise.
	    var getUserMediaPromise_ = function(constraints) {
	      return new Promise(function(resolve, reject) {
	        navigator.getUserMedia(constraints, resolve, reject);
	      });
	    };

	    // Shim for mediaDevices on older versions.
	    if (!navigator.mediaDevices) {
	      navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
	        addEventListener: function() { },
	        removeEventListener: function() { }
	      };
	    }
	    navigator.mediaDevices.enumerateDevices =
	        navigator.mediaDevices.enumerateDevices || function() {
	          return new Promise(function(resolve) {
	            var infos = [
	              {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
	              {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
	            ];
	            resolve(infos);
	          });
	        };

	    if (browserDetails.version < 41) {
	      // Work around http://bugzil.la/1169665
	      var orgEnumerateDevices =
	          navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
	      navigator.mediaDevices.enumerateDevices = function() {
	        return orgEnumerateDevices().then(undefined, function(e) {
	          if (e.name === 'NotFoundError') {
	            return [];
	          }
	          throw e;
	        });
	      };
	    }
	  },

	  // Attach a media stream to an element.
	  attachMediaStream: function(element, stream) {
	    logging('DEPRECATED, attachMediaStream will soon be removed.');
	    element.srcObject = stream;
	  },

	  reattachMediaStream: function(to, from) {
	    logging('DEPRECATED, reattachMediaStream will soon be removed.');
	    to.srcObject = from.srcObject;
	  }
	};

	// Expose public methods.
	module.exports = {
	  shimOnTrack: firefoxShim.shimOnTrack,
	  shimSourceObject: firefoxShim.shimSourceObject,
	  shimPeerConnection: firefoxShim.shimPeerConnection,
	  shimGetUserMedia: require('./getusermedia'),
	  attachMediaStream: firefoxShim.attachMediaStream,
	  reattachMediaStream: firefoxShim.reattachMediaStream
	};

	},{"../utils":8,"./getusermedia":6}],6:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var logging = require('../utils').log;
	var browserDetails = require('../utils').browserDetails;

	// Expose public methods.
	module.exports = function() {
	  // getUserMedia constraints shim.
	  var getUserMedia_ = function(constraints, onSuccess, onError) {
	    var constraintsToFF37_ = function(c) {
	      if (typeof c !== 'object' || c.require) {
	        return c;
	      }
	      var require = [];
	      Object.keys(c).forEach(function(key) {
	        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
	          return;
	        }
	        var r = c[key] = (typeof c[key] === 'object') ?
	            c[key] : {ideal: c[key]};
	        if (r.min !== undefined ||
	            r.max !== undefined || r.exact !== undefined) {
	          require.push(key);
	        }
	        if (r.exact !== undefined) {
	          if (typeof r.exact === 'number') {
	            r. min = r.max = r.exact;
	          } else {
	            c[key] = r.exact;
	          }
	          delete r.exact;
	        }
	        if (r.ideal !== undefined) {
	          c.advanced = c.advanced || [];
	          var oc = {};
	          if (typeof r.ideal === 'number') {
	            oc[key] = {min: r.ideal, max: r.ideal};
	          } else {
	            oc[key] = r.ideal;
	          }
	          c.advanced.push(oc);
	          delete r.ideal;
	          if (!Object.keys(r).length) {
	            delete c[key];
	          }
	        }
	      });
	      if (require.length) {
	        c.require = require;
	      }
	      return c;
	    };
	    constraints = JSON.parse(JSON.stringify(constraints));
	    if (browserDetails.version < 38) {
	      logging('spec: ' + JSON.stringify(constraints));
	      if (constraints.audio) {
	        constraints.audio = constraintsToFF37_(constraints.audio);
	      }
	      if (constraints.video) {
	        constraints.video = constraintsToFF37_(constraints.video);
	      }
	      logging('ff37: ' + JSON.stringify(constraints));
	    }
	    return navigator.mozGetUserMedia(constraints, onSuccess, onError);
	  };

	  navigator.getUserMedia = getUserMedia_;

	  // Returns the result of getUserMedia as a Promise.
	  var getUserMediaPromise_ = function(constraints) {
	    return new Promise(function(resolve, reject) {
	      navigator.getUserMedia(constraints, resolve, reject);
	    });
	  };

	  // Shim for mediaDevices on older versions.
	  if (!navigator.mediaDevices) {
	    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
	      addEventListener: function() { },
	      removeEventListener: function() { }
	    };
	  }
	  navigator.mediaDevices.enumerateDevices =
	      navigator.mediaDevices.enumerateDevices || function() {
	        return new Promise(function(resolve) {
	          var infos = [
	            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
	            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
	          ];
	          resolve(infos);
	        });
	      };

	  if (browserDetails.version < 41) {
	    // Work around http://bugzil.la/1169665
	    var orgEnumerateDevices =
	        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
	    navigator.mediaDevices.enumerateDevices = function() {
	      return orgEnumerateDevices().then(undefined, function(e) {
	        if (e.name === 'NotFoundError') {
	          return [];
	        }
	        throw e;
	      });
	    };
	  }
	};

	},{"../utils":8}],7:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	'use strict';
	var safariShim = {
	  // TODO: DrAlex, should be here, double check against LayoutTests
	  // shimOnTrack: function() { },

	  // TODO: DrAlex
	  // attachMediaStream: function(element, stream) { },
	  // reattachMediaStream: function(to, from) { },

	  // TODO: once the back-end for the mac port is done, add.
	  // TODO: check for webkitGTK+
	  // shimPeerConnection: function() { },

	  shimGetUserMedia: function() {
	    navigator.getUserMedia = navigator.webkitGetUserMedia;
	  }
	};

	// Expose public methods.
	module.exports = {
	  shimGetUserMedia: safariShim.shimGetUserMedia
	  // TODO
	  // shimOnTrack: safariShim.shimOnTrack,
	  // shimPeerConnection: safariShim.shimPeerConnection,
	  // attachMediaStream: safariShim.attachMediaStream,
	  // reattachMediaStream: safariShim.reattachMediaStream
	};

	},{}],8:[function(require,module,exports){
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var logDisabled_ = false;

	// Utility methods.
	var utils = {
	  disableLog: function(bool) {
	    if (typeof bool !== 'boolean') {
	      return new Error('Argument type: ' + typeof bool +
	          '. Please use a boolean.');
	    }
	    logDisabled_ = bool;
	    return (bool) ? 'adapter.js logging disabled' :
	        'adapter.js logging enabled';
	  },

	  log: function() {
	    if (typeof window === 'object') {
	      if (logDisabled_) {
	        return;
	      }
	      if (typeof console !== 'undefined' && typeof console.log === 'function') {
	        console.log.apply(console, arguments);
	      }
	    }
	  },

	  /**
	   * Extract browser version out of the provided user agent string.
	   *
	   * @param {!string} uastring userAgent string.
	   * @param {!string} expr Regular expression used as match criteria.
	   * @param {!number} pos position in the version string to be returned.
	   * @return {!number} browser version.
	   */
	  extractVersion: function(uastring, expr, pos) {
	    var match = uastring.match(expr);
	    return match && match.length >= pos && parseInt(match[pos], 10);
	  },

	  /**
	   * Browser detector.
	   *
	   * @return {object} result containing browser, version and minVersion
	   *     properties.
	   */
	  detectBrowser: function() {
	    // Returned result object.
	    var result = {};
	    result.browser = null;
	    result.version = null;
	    result.minVersion = null;

	    // Fail early if it's not a browser
	    if (typeof window === 'undefined' || !window.navigator) {
	      result.browser = 'Not a browser.';
	      return result;
	    }

	    // Firefox.
	    if (navigator.mozGetUserMedia) {
	      result.browser = 'firefox';
	      result.version = this.extractVersion(navigator.userAgent,
	          /Firefox\/([0-9]+)\./, 1);
	      result.minVersion = 31;

	    // all webkit-based browsers
	    } else if (navigator.webkitGetUserMedia) {
	      // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
	      if (window.webkitRTCPeerConnection) {
	        result.browser = 'chrome';
	        result.version = this.extractVersion(navigator.userAgent,
	          /Chrom(e|ium)\/([0-9]+)\./, 2);
	        result.minVersion = 38;

	      // Safari or unknown webkit-based
	      // for the time being Safari has support for MediaStreams but not webRTC
	      } else {
	        // Safari UA substrings of interest for reference:
	        // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
	        // - safari UI version:        Version/9.0.3 (unique to Safari)
	        // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
	        //
	        // if the webkit version and safari UI webkit versions are equals,
	        // ... this is a stable version.
	        //
	        // only the internal webkit version is important today to know if
	        // media streams are supported
	        //
	        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
	          result.browser = 'safari';
	          result.version = this.extractVersion(navigator.userAgent,
	            /AppleWebKit\/([0-9]+)\./, 1);
	          result.minVersion = 602;

	        // unknown webkit-based browser
	        } else {
	          result.browser = 'Unsupported webkit-based browser ' +
	              'with GUM support but no WebRTC support.';
	          return result;
	        }
	      }

	    // Edge.
	    } else if (navigator.mediaDevices &&
	        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
	      result.browser = 'edge';
	      result.version = this.extractVersion(navigator.userAgent,
	          /Edge\/(\d+).(\d+)$/, 2);
	      result.minVersion = 10547;

	    // Default fallthrough: not supported.
	    } else {
	      result.browser = 'Not a supported browser.';
	      return result;
	    }

	    // Warn if version is less than minVersion.
	    if (result.version < result.minVersion) {
	      utils.log('Browser: ' + result.browser + ' Version: ' + result.version +
	          ' < minimum supported version: ' + result.minVersion +
	          '\n some things might not work!');
	    }

	    return result;
	  }
	};

	// Export.
	module.exports = {
	  log: utils.log,
	  disableLog: utils.disableLog,
	  browserDetails: utils.detectBrowser(),
	  extractVersion: utils.extractVersion
	};

	},{}]},{},[2]);


/***/ }
/******/ ])
});
;