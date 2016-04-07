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
	exports.WebChannel = exports.FULLY_CONNECTED = exports.WEBRTC = undefined;

	var _WebChannel = __webpack_require__(1);

	var _WebChannel2 = _interopRequireDefault(_WebChannel);

	var _serviceProvider = __webpack_require__(2);

	var service = _interopRequireWildcard(_serviceProvider);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var WEBRTC = service.WEBRTC;
	var FULLY_CONNECTED = service.FULLY_CONNECTED;

	exports.WEBRTC = WEBRTC;
	exports.FULLY_CONNECTED = FULLY_CONNECTED;
	exports.WebChannel = _WebChannel2.default;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _serviceProvider = __webpack_require__(2);

	var serviceProvider = _interopRequireWildcard(_serviceProvider);

	var _channelProxy = __webpack_require__(6);

	var _JoiningPeer = __webpack_require__(7);

	var _JoiningPeer2 = _interopRequireDefault(_JoiningPeer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
	      connector: serviceProvider.WEBRTC,
	      topology: serviceProvider.FULLY_CONNECTED
	    };
	    this.settings = Object.assign({}, this.defaults, options);

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
	    this.connections = new Map();

	    /** @private */
	    this.proxy = serviceProvider.get(serviceProvider.CHANNEL_PROXY);
	    /** @private */
	    this.topology = this.settings.topology;
	  }

	  /**
	   * This event handler is called when a new member has joined the `WebChannel`.
	   *
	   * @param  {string} id - Peer id.
	   */


	  _createClass(WebChannel, [{
	    key: 'onJoining',
	    value: function onJoining(id) {}

	    /**
	     * This event handler is called when a `WebChannel` member has left.
	     *
	     * @param  {string} id - Peer id.
	     */

	  }, {
	    key: 'onLeaving',
	    value: function onLeaving(id) {}

	    /**
	     * On message event handler.
	     *
	     * @param  {string} id  - Peer id the message came from.
	     * @param  {string} msg - Message
	     */

	  }, {
	    key: 'onMessage',
	    value: function onMessage(id, msg) {}

	    /** Leave `WebChannel`. No longer can receive and send messages to the group. */

	  }, {
	    key: 'leave',
	    value: function leave() {
	      this.manager.broadcast(this, this.proxy.msg(_channelProxy.LEAVE, { id: this.myId }));
	    }

	    /**
	     * Send broadcast message.
	     *
	     * @param  {string} data Message
	     */

	  }, {
	    key: 'send',
	    value: function send(data) {
	      this.manager.broadcast(this, this.proxy.msg(_channelProxy.USER_DATA, { id: this.myId, data: data }));
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
	      this.manager.sendTo(id, this, this.proxy.msg(_channelProxy.USER_DATA, { id: this.myId, data: data }));
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
	      var _this = this;

	      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	      var settings = Object.assign({}, this.settings, options);

	      var cBuilder = serviceProvider.get(settings.connector, settings);
	      var key = this.id + this.myId;
	      try {
	        var data = cBuilder.open(this, key, function (channel) {
	          //this.initChannel(channel)
	          var jp = new _JoiningPeer2.default(channel.peerId, _this.myId);
	          jp.intermediaryChannel = channel;
	          _this.joiningPeers.add(jp);
	          console.log('send JOIN_INIT his new id: ' + channel.peerId);
	          console.log('New channel: ' + channel.readyState);
	          channel.send(_this.proxy.msg(_channelProxy.JOIN_INIT, { manager: _this.settings.topology,
	            id: channel.peerId,
	            intermediaryId: _this.myId }));
	          _this.manager.broadcast(_this, _this.proxy.msg(_channelProxy.JOIN_NEW_MEMBER, { id: channel.peerId, intermediaryId: _this.myId }));
	          _this.manager.add(channel).then(function () {
	            channel.send(_this.proxy.msg(_channelProxy.JOIN_FINILIZE));
	          }).catch(function (msg) {
	            console.log('Adding peer ' + channel.peerId + ' failed: ' + msg);
	            _this.manager.broadcast(_this, _this.proxy.msg(_channelProxy.REMOVE_NEW_MEMBER, { id: channel.peerId }));
	            _this.removeJoiningPeer(jp.id);
	          });
	        });
	        this.webRTCOpen = data.socket;
	        return data.key;
	      } catch (e) {
	        console.log('WebChannel open error: ', e);
	      }
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
	      var _this2 = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);

	      var cBuilder = serviceProvider.get(settings.connector, settings);
	      return new Promise(function (resolve, reject) {
	        cBuilder.join(_this2, key).then(function (channel) {
	          //this.initChannel(channel)
	          console.log('JOIN channel established');
	          _this2.onJoin = function () {
	            resolve(_this2);
	          };
	        }).catch(function (reason) {
	          return reject(reason);
	        });
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

	      var completeMsg = { serviceName: serviceName, recepient: recepient, data: Object.assign({}, msg) };
	      var stringifiedMsg = this.proxy.msg(_channelProxy.SERVICE_DATA, completeMsg);
	      if (recepient === this.myId) {
	        this.proxy.onSrvMsg(this, completeMsg);
	      } else {
	        // If this function caller is a peer who is joining
	        if (this.isJoining()) {
	          var ch = this.getJoiningPeer(this.myId).intermediaryChannel;
	          if (ch.readyState !== 'closed') {
	            ch.send(stringifiedMsg);
	          }
	        } else {
	          // If the recepient is a joining peer
	          if (this.hasJoiningPeer(recepient)) {
	            var jp = this.getJoiningPeer(recepient);
	            // If I am an intermediary peer for recepient
	            if (jp.intermediaryId === this.myId && jp.intermediaryChannel.readyState !== 'closed') {
	              jp.intermediaryChannel.send(stringifiedMsg);
	              // If not, then send this message to the recepient's intermediary peer
	            } else {
	                this.manager.sendTo(jp.intermediaryId, this, stringifiedMsg);
	              }
	            // If the recepient is a member of webChannel
	          } else {
	              this.manager.sendTo(recepient, this, stringifiedMsg);
	            }
	        }
	      }
	    }
	  }, {
	    key: 'initChannel',


	    /**
	     * initChannel - description
	     *
	     * @private
	     * @param  {type} channel description
	     * @param  {type} id = '' description
	     * @return {type}         description
	     */
	    value: function initChannel(channel) {
	      var _this3 = this;

	      var id = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

	      channel.webChannel = this;
	      channel.onmessage = this.proxy.onMsg;
	      channel.onerror = this.proxy.onError;
	      channel.onclose = this.proxy.onClose;
	      if (id !== '') {
	        channel.peerId = id;
	      } else {
	        channel.peerId = this.generateId();
	      }
	      channel.connection.oniceconnectionstatechange = function () {
	        console.log('STATE FOR ' + channel.peerId + ' CHANGED TO: ', channel.connection.iceConnectionState);
	        if (channel.connection.iceConnectionState === 'disconnected') {
	          _this3.channels.delete(channel);
	          _this3.onLeaving(channel.peerId);
	        }
	      };
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
	      var _this4 = this;

	      var jp = this.getJoiningPeer(id);
	      jp.channelsToAdd.forEach(function (c) {
	        _this4.channels.add(c);
	        _this4.joiningPeers.delete(jp);
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
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = this.joiningPeers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var jp = _step2.value;

	          if (jp.id === id) {
	            return jp;
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
	      var _iteratorNormalCompletion3 = true;
	      var _didIteratorError3 = false;
	      var _iteratorError3 = undefined;

	      try {
	        for (var _iterator3 = this.joiningPeers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	          var jp = _step3.value;

	          if (jp.id === this.myId) {
	            return true;
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
	      var _iteratorNormalCompletion4 = true;
	      var _didIteratorError4 = false;
	      var _iteratorError4 = undefined;

	      try {
	        for (var _iterator4 = this.joiningPeers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	          var jp = _step4.value;

	          if (jp.id === id) {
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
	     * generateId - description
	     *
	     * @private
	     * @return {type}  description
	     */

	  }, {
	    key: 'generateId',
	    value: function generateId() {
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
	    key: 'topology',
	    set: function set(name) {
	      this.settings.topology = name;
	      this.manager = serviceProvider.get(this.settings.topology);
	    },
	    get: function get() {
	      return this.settings.topology;
	    }
	  }]);

	  return WebChannel;
	}();

	exports.default = WebChannel;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.FULLY_CONNECTED = exports.WEBRTC = exports.CHANNEL_PROXY = undefined;
	exports.get = get;

	var _FullyConnectedService = __webpack_require__(3);

	var _FullyConnectedService2 = _interopRequireDefault(_FullyConnectedService);

	var _WebRTCService = __webpack_require__(8);

	var _WebRTCService2 = _interopRequireDefault(_WebRTCService);

	var _channelProxy = __webpack_require__(6);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * Service Provider module is a helper module for {@link module:service}. It is
	 * responsible to instantiate all services. This module must be used to get
	 * any service instance.
	 * @module serviceProvider
	 */

	/**
	 * Constant used to get an instance of {@link ChannelProxyService}.
	 * @type {string}
	 */
	var CHANNEL_PROXY = exports.CHANNEL_PROXY = 'ChannelProxyService';

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
	function get(name) {
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
	    case CHANNEL_PROXY:
	      service = new _channelProxy.ChannelProxyService();
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

	          if (c.readyState !== 'closed') {
	            c.send(data);
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
	            if (c.readyState !== 'closed') {
	              c.send(data);
	            }
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

	var serviceProvider = _interopRequireWildcard(_serviceProvider);

	var _channelProxy = __webpack_require__(6);

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
	    value: function onMessage(wc, msg) {
	      var _this2 = this;

	      var cBuilder = serviceProvider.get(wc.settings.connector, wc.settings);
	      switch (msg.code) {
	        case CONNECT_WITH:
	          console.log('CONNECT_WITH received: ', msg);
	          msg.peers = this.reUseIntermediaryChannelIfPossible(wc, msg.jpId, msg.peers);
	          cBuilder.connectMeToMany(wc, msg.peers).then(function (result) {
	            console.log('CONNECT_WITH result: ', result);
	            result.channels.forEach(function (c) {
	              wc.initChannel(c, c.peerId);
	              wc.getJoiningPeer(msg.jpId).toAddList(c);
	              c.send(wc.proxy.msg(_channelProxy.THIS_CHANNEL_TO_JOINING_PEER, { id: msg.jpId, toBeAdded: true }));
	            });
	            console.log('CONNECT_WITH send feedback: ', { code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: result.failed });
	            wc.sendSrvMsg(_this2.name, msg.sender, { code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: result.failed });
	          }).catch(function (err) {
	            console.log('connectMeToMany FAILED, ', err);
	          });
	          break;
	        case CONNECT_WITH_FEEDBACK:
	          console.log('CONNECT_WITH_FEEDBACK received: ', msg);
	          wc.connectWithRequests.get(msg.id)(true);
	          break;
	        case ADD_INTERMEDIARY_CHANNEL:
	          var jp = wc.getJoiningPeer(msg.jpId);
	          jp.toAddList(jp.intermediaryChannel);
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

	      console.log('send CONNECT_WITH to: ' + id + ' JoiningPeerID: ' + jpId + ' with peers', peers);
	      wc.sendSrvMsg(this.name, id, { code: CONNECT_WITH, jpId: jpId,
	        sender: wc.myId, peers: peers });
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
	     * @param  {ChannelInterface} ch - Channel to be added (it should has
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

	'use strict';

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
	    key: 'onMessage',


	    /**
	     * On message event handler.
	     *
	     * @abstract
	     * @param  {WebChannel} wc - Web Channel from which the message is arrived.
	     * @param  {string} msg - Message in stringified JSON format.
	     */
	    value: function onMessage(wc, msg) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }, {
	    key: 'name',


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
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ChannelProxyService = exports.THIS_CHANNEL_TO_JOINING_PEER = exports.JOIN_SUCCESS = exports.JOIN_FINILIZE = exports.REMOVE_NEW_MEMBER = exports.JOIN_NEW_MEMBER = exports.JOIN_INIT = exports.LEAVE = exports.SERVICE_DATA = exports.USER_DATA = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _service = __webpack_require__(5);

	var service = _interopRequireWildcard(_service);

	var _serviceProvider = __webpack_require__(2);

	var serviceProvider = _interopRequireWildcard(_serviceProvider);

	var _JoiningPeer = __webpack_require__(7);

	var _JoiningPeer2 = _interopRequireDefault(_JoiningPeer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Proxy module for configure channel event handlers and any message sent via
	 * a channel should be build here in order to be understand by the recepient
	 * peer.
	 * @module channelProxy
	 */

	/**
	 * Constant used to build a message designated to API user.
	 * @type {int}
	 */
	var USER_DATA = exports.USER_DATA = 0;

	/**
	 * Constant used to build a message designated to a specific service.
	 * @type {int}
	 */
	var SERVICE_DATA = exports.SERVICE_DATA = 1;
	/**
	 * Constant used to build a message that a user has left Web Channel.
	 * @type {int}
	 */
	var LEAVE = exports.LEAVE = 8;
	/**
	 * Constant used to build a message to be sent to a newly joining peer.
	 * @type {int}
	 */
	var JOIN_INIT = exports.JOIN_INIT = 3;
	/**
	 * Constant used to build a message to be sent to all peers in Web Channel to
	 * notify them about a new peer who is about to join the Web Channel.
	 * @type {int}
	 */
	var JOIN_NEW_MEMBER = exports.JOIN_NEW_MEMBER = 6;
	/**
	 * Constant used to build a message to be sent to all peers in Web Channel to
	 * notify them that the new peer who should join the Web Channel, refuse to join.
	 * @type {int}
	 */
	var REMOVE_NEW_MEMBER = exports.REMOVE_NEW_MEMBER = 9;
	/**
	 * Constant used to build a message to be sent to a newly joining peer that he
	 * has can now succesfully join Web Channel.
	 * @type {int}
	 */
	var JOIN_FINILIZE = exports.JOIN_FINILIZE = 5;
	/**
	 * Constant used to build a message to be sent by the newly joining peer to all
	 * peers in Web Channel to notify them that he has succesfully joined the Web
	 * Channel.
	 * @type {int}
	 */
	var JOIN_SUCCESS = exports.JOIN_SUCCESS = 4;
	/**
	 * @type {int}
	 */
	var THIS_CHANNEL_TO_JOINING_PEER = exports.THIS_CHANNEL_TO_JOINING_PEER = 7;

	/**
	 * This is a special service class for {@link ChannelInterface}. It mostly
	 * contains event handlers (e.g. *onmessage*, *onclose* etc.) to configure
	 * a newly created channel. Thus be careful to use `this` in handlers, as
	 * it will refer to the instance of `ChannelInterface` and not to the
	 * instance of `ChannelProxyService`.
	 */

	var ChannelProxyService = function (_service$Interface) {
	  _inherits(ChannelProxyService, _service$Interface);

	  function ChannelProxyService() {
	    _classCallCheck(this, ChannelProxyService);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(ChannelProxyService).apply(this, arguments));
	  }

	  _createClass(ChannelProxyService, [{
	    key: 'onMsg',


	    /**
	     * On message event handler.
	     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
	     *
	     * @param  {MessageEvent} msgEvt - Message event
	     */
	    value: function onMsg(msgEvt) {
	      var msg = JSON.parse(msgEvt.data);
	      var ch = msgEvt.currentTarget;
	      var wc = ch.webChannel;
	      var jp = void 0;
	      switch (msg.code) {
	        case USER_DATA:
	          wc.onMessage(msg.id, msg.data);
	          break;
	        case LEAVE:
	          wc.onLeaving(msg.id);
	          var _iteratorNormalCompletion = true;
	          var _didIteratorError = false;
	          var _iteratorError = undefined;

	          try {
	            for (var _iterator = wc.channels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	              var c = _step.value;

	              if (c.peerId === msg.id) {
	                wc.channels.delete(c);
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

	          break;
	        case SERVICE_DATA:
	          if (wc.myId === msg.recepient) {
	            wc.proxy.onSrvMsg(wc, msg);
	          } else {
	            wc.sendSrvMsg(msg.serviceName, msg.recepient, msg.data);
	          }
	          break;
	        case JOIN_INIT:
	          console.log('JOIN_INIT my new id: ' + msg.id);
	          wc.topology = msg.manager;
	          wc.myId = msg.id;
	          ch.peerId = msg.intermediaryId;
	          jp = new _JoiningPeer2.default(msg.id, msg.intermediaryId);
	          jp.intermediaryChannel = ch;
	          wc.addJoiningPeer(jp);
	          break;
	        case JOIN_NEW_MEMBER:
	          wc.addJoiningPeer(new _JoiningPeer2.default(msg.id, msg.intermediaryId));
	          break;
	        case REMOVE_NEW_MEMBER:
	          wc.removeJoiningPeer(msg.id);
	          break;
	        case JOIN_FINILIZE:
	          wc.joinSuccess(wc.myId);
	          var nextMsg = wc.proxy.msg(JOIN_SUCCESS, { id: wc.myId });
	          wc.manager.broadcast(wc, nextMsg);
	          wc.onJoin();
	          break;
	        case JOIN_SUCCESS:
	          wc.joinSuccess(msg.id);
	          wc.onJoining(msg.id);
	          break;
	        case THIS_CHANNEL_TO_JOINING_PEER:
	          if (wc.hasJoiningPeer(msg.id)) {
	            jp = wc.getJoiningPeer(msg.id);
	          } else {
	            jp = new _JoiningPeer2.default(msg.id);
	            wc.addJoiningPeer(jp);
	          }
	          if (msg.toBeAdded) {
	            jp.toAddList(ch);
	          } else {
	            jp.toRemoveList(ch);
	          }
	          break;
	      }
	    }

	    /**
	     * On channel close event handler.
	     * - For `RTCDataChannel` the type of `evt` is `Event`
	     * - For `WebSocket`, the type of `evt` is `CloseEvent`.
	     * @see [Event doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
	     * @see [CloseEvent doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
	     *
	     * @param  {Event} evt - Close event.
	     */

	  }, {
	    key: 'onClose',
	    value: function onClose(evt) {
	      console.log('DATA_CHANNEL CLOSE: ', evt);
	    }

	    /**
	     * On error event handler.
	     * @see [Event doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
	     *
	     * @param  {Event} evt - Error event.
	     */

	  }, {
	    key: 'onError',
	    value: function onError(evt) {
	      console.log('DATA_CHANNEL ERROR: ', evt);
	    }

	    /**
	     * When the message is designated for a service. This is not an event handler
	     * for a channel. The main difference with the `SERVICE_DATA` message arriving
	     * for `onMessage` is that here the message could be sent by the peer to
	     * himself.
	     *
	     * @param  {WebChannel} wc - Web Channel.
	     * @param  {Object} msg - Message.
	     */

	  }, {
	    key: 'onSrvMsg',
	    value: function onSrvMsg(wc, msg) {
	      serviceProvider.get(msg.serviceName, wc.settings).onMessage(wc, msg.data);
	    }

	    /**
	     * Message builder.
	     *
	     * @param  {int} code - One of the constant values in {@link constans}.
	     * @param  {Object} [data={}] - Data to be send.
	     * @return {string} - Data in stringified JSON format.
	     */

	  }, {
	    key: 'msg',
	    value: function msg(code) {
	      var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var msg = Object.assign({ code: code }, data);
	      return JSON.stringify(msg);
	    }
	  }]);

	  return ChannelProxyService;
	}(service.Interface);

	exports.
	/** @see module:channelProxy~ChannelProxyService */
	ChannelProxyService = ChannelProxyService;

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var JoiningPeer = function () {
	  function JoiningPeer(id, intermediaryId) {
	    _classCallCheck(this, JoiningPeer);

	    this.id = id;
	    this.intermediaryId = intermediaryId;
	    this.intermediaryChannel = null;
	    this.channelsToAdd = [];
	    this.channelsToRemove = [];
	  }

	  _createClass(JoiningPeer, [{
	    key: "toAddList",
	    value: function toAddList(channel) {
	      this.channelsToAdd[this.channelsToAdd.length] = channel;
	    }
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _serviceProvider = __webpack_require__(2);

	var serviceProvider = _interopRequireWildcard(_serviceProvider);

	var _channelBuilder = __webpack_require__(9);

	var cBuilder = _interopRequireWildcard(_channelBuilder);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var CONNECTION_CREATION_TIMEOUT = 2000;

	/**
	 * Error which might occur during interaction with signaling server.
	 *
	 * @see [Error]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
	 * @extends Error
	 */

	var SignalingError = function (_Error) {
	  _inherits(SignalingError, _Error);

	  function SignalingError(msg) {
	    var evt = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

	    _classCallCheck(this, SignalingError);

	    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SignalingError).call(this, msg));

	    _this.name = 'SignalingError';
	    _this.evt = evt;
	    return _this;
	  }

	  return SignalingError;
	}(Error);

	/**
	 * Service class responsible to establish connections between peers via
	 * `RTCDataChannel`.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection}
	 * @extends module:channelBuilder~Interface
	 */


	var WebRTCService = function (_cBuilder$Interface) {
	  _inherits(WebRTCService, _cBuilder$Interface);

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

	    // Declare WebRTCService related global(window) constructors
	    _this2.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

	    _this2.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate;

	    _this2.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
	    return _this2;
	  }

	  _createClass(WebRTCService, [{
	    key: 'open',
	    value: function open(webChannel, key, onChannel) {
	      var _this3 = this;

	      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

	      var settings = Object.assign({}, this.settings, options);
	      // Connection array, because several connections may be establishing
	      // at the same time
	      var connections = [];

	      try {
	        var _ret = function () {
	          // Connect to the signaling server
	          var socket = new window.WebSocket(settings.signaling);

	          // Send a message to signaling server: ready to receive offer
	          socket.onopen = function () {
	            socket.send(_this3.toStr({ key: key }));
	          };
	          socket.onmessage = function (evt) {
	            var msg = JSON.parse(evt.data);
	            console.log('NETFLUX: message: ', msg);
	            if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
	              // throw new SignalingError(err.name + ': ' + err.message)
	              throw new Error('Incorrect message format from the signaling server.');
	            }

	            // On SDP offer: add connection to the array, prepare answer and send it back
	            if (Reflect.has(msg.data, 'offer')) {
	              connections[connections.length] = _this3.createConnectionAndAnswer(function (candidate) {
	                return socket.send(_this3.toStr({ id: msg.id, data: { candidate: candidate } }));
	              }, function (answer) {
	                return socket.send(_this3.toStr({ id: msg.id, data: { answer: answer } }));
	              }, onChannel, msg.data.offer, webChannel);
	              // On Ice Candidate
	            } else if (Reflect.has(msg.data, 'candidate')) {
	                console.log('NETFLUX adding candidate');
	                connections[msg.id].addIceCandidate(_this3.createCandidate(msg.data.candidate), function () {}, function (e) {
	                  console.log('NETFLUX adding candidate failed: ', e);
	                });
	              }
	          };
	          socket.onerror = function (evt) {
	            throw new SignalingError('error occured on the socket with signaling server ' + settings.signaling);
	          };
	          socket.onclose = function (closeEvt) {
	            // 1000 corresponds to CLOSE_NORMAL: Normal closure; the connection
	            // successfully completed whatever purpose for which it was created.
	            if (closeEvt.code !== 1000) {
	              throw new SignalingError('connection with signaling server\n            ' + settings.signaling + ' has been closed abnormally.\n            CloseEvent code: ' + closeEvt.code + '. Reason: ' + closeEvt.reason);
	            }
	          };
	          return {
	            v: { key: key, socket: socket, signaling: settings.signaling }
	          };
	        }();

	        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	      } catch (err) {
	        throw new SignalingError(err.name + ': ' + err.message);
	      }
	    }
	  }, {
	    key: 'join',
	    value: function join(webChannel, key) {
	      var _this4 = this;

	      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	      var settings = Object.assign({}, this.settings, options);
	      console.log('NETFLUX: joining: ' + key);
	      return new Promise(function (resolve, reject) {
	        var connection = void 0;

	        // Connect to the signaling server
	        var socket = new window.WebSocket(settings.signaling);
	        socket.onopen = function () {
	          console.log('NETFLUX: connection with Sigver has been established');
	          // Prepare and send offer
	          connection = _this4.createConnectionAndOffer(function (candidate) {
	            return socket.send(_this4.toStr({ data: { candidate: candidate } }));
	          }, function (offer) {
	            return socket.send(_this4.toStr({ join: key, data: { offer: offer } }));
	          }, function (channel) {
	            console.log('NETFLUX: channel created');
	            resolve(channel);
	          }, key, webChannel);
	        };
	        socket.onmessage = function (e) {
	          var msg = JSON.parse(e.data);
	          console.log('NETFLUX: message: ', msg);

	          // Check message format
	          if (!Reflect.has(msg, 'data')) {
	            reject();
	          }

	          // If received an answer to the previously sent offer
	          if (Reflect.has(msg.data, 'answer')) {
	            var sd = _this4.createSDP(msg.data.answer);
	            console.log('NETFLUX adding answer');
	            connection.setRemoteDescription(sd, function () {}, function (e) {
	              console.log('NETFLUX adding answer failed: ', e);
	              reject();
	            });
	            // If received an Ice candidate
	          } else if (Reflect.has(msg.data, 'candidate')) {
	              console.log('NETFLUX adding candidate');
	              connection.addIceCandidate(_this4.createCandidate(msg.data.candidate), function () {}, function (e) {
	                console.log('NETFLUX adding candidate failed: ', e);
	              });
	            } else {
	              reject();
	            }
	        };
	        socket.onerror = function (e) {
	          reject('Signaling server socket error: ' + e.message);
	        };
	        socket.onclose = function (e) {
	          console.log('Closing server: ', e);
	          if (e.code !== 1000) {
	            reject(e.reason);
	          }
	        };
	      });
	    }
	  }, {
	    key: 'connectMeToMany',
	    value: function connectMeToMany(webChannel, ids) {
	      var _this5 = this;

	      return new Promise(function (resolve, reject) {
	        var counter = 0;
	        var result = { channels: [], failed: [] };
	        if (ids.length === 0) {
	          resolve(result);
	        } else {
	          var _iteratorNormalCompletion = true;
	          var _didIteratorError = false;
	          var _iteratorError = undefined;

	          try {
	            var _loop = function _loop() {
	              var id = _step.value;

	              _this5.connectMeToOne(webChannel, id).then(function (channel) {
	                counter++;
	                result.channels.push(channel);
	                if (counter === ids.length) {
	                  resolve(result);
	                }
	              }).catch(function (err) {
	                counter++;
	                result.failed.push({ id: id, err: err });
	                if (counter === ids.length) {
	                  resolve(result);
	                }
	              });
	            };

	            for (var _iterator = ids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	              _loop();
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
	      });
	    }
	  }, {
	    key: 'connectMeToOne',
	    value: function connectMeToOne(webChannel, id) {
	      var _this6 = this;

	      return new Promise(function (resolve, reject) {
	        var sender = webChannel.myId;
	        var connection = _this6.createConnectionAndOffer(function (candidate) {
	          return webChannel.sendSrvMsg(_this6.name, id, { sender: sender, candidate: candidate });
	        }, function (offer) {
	          webChannel.connections.set(id, connection);
	          webChannel.sendSrvMsg(_this6.name, id, { sender: sender, offer: offer });
	        }, function (channel) {
	          return resolve(channel);
	        }, id, webChannel, id);
	        setTimeout(reject, CONNECTION_CREATION_TIMEOUT, 'Timeout');
	      });
	    }
	  }, {
	    key: 'onMessage',
	    value: function onMessage(webChannel, msg) {
	      var _this7 = this;

	      var connections = webChannel.connections;
	      if (Reflect.has(msg, 'offer')) {
	        // TODO: add try/catch. On exception remove connection from webChannel.connections
	        connections.set(msg.sender, this.createConnectionAndAnswer(function (candidate) {
	          return webChannel.sendSrvMsg(_this7.name, msg.sender, { sender: webChannel.myId, candidate: candidate });
	        }, function (answer) {
	          return webChannel.sendSrvMsg(_this7.name, msg.sender, { sender: webChannel.myId, answer: answer });
	        }, function (channel) {
	          webChannel.connections.delete(channel.peerId);
	        }, msg.offer, webChannel, msg.sender));
	        console.log(msg.sender + ' create a NEW CONNECTION');
	      } else if (connections.has(msg.sender)) {
	        var connection = connections.get(msg.sender);
	        if (Reflect.has(msg, 'answer')) {
	          var sd = this.createSDP(msg.answer);
	          connection.setRemoteDescription(sd, function () {}, function () {});
	        } else if (Reflect.has(msg, 'candidate') && connection) {
	          connection.addIceCandidate(this.createCandidate(msg.candidate));
	        }
	      }
	    }
	  }, {
	    key: 'createConnectionAndOffer',
	    value: function createConnectionAndOffer(candidateCB, sdpCB, channelCB, key, webChannel) {
	      var id = arguments.length <= 5 || arguments[5] === undefined ? '' : arguments[5];

	      var connection = this.initConnection(candidateCB);
	      var dc = connection.createDataChannel(key);
	      console.log('NETFLUX: dataChannel created');
	      dc.onopen = function () {
	        console.log('NETFLUX: Channel opened');
	        dc.send('ping');
	        console.log('SEND PING');
	      };
	      window.dc = dc;
	      dc.onmessage = function (msgEvt) {
	        if (msgEvt.data === 'pong') {
	          console.log('PONG Received');
	          dc.connection = connection;
	          webChannel.initChannel(dc, id);
	          channelCB(dc);
	        }
	      };
	      dc.onerror = function (evt) {
	        console.log('NETFLUX: channel error: ', evt);
	      };
	      connection.createOffer(function (offer) {
	        connection.setLocalDescription(offer, function () {
	          sdpCB(connection.localDescription.toJSON());
	        }, function (err) {
	          console.log('NETFLUX: error 1: ', err);
	          throw new Error('Could not set local description: ' + err);
	        });
	      }, function (err) {
	        console.log('NETFLUX: error 2: ', err);
	        throw new Error('Could not create offer: ' + err);
	      });
	      return connection;
	    }
	  }, {
	    key: 'createConnectionAndAnswer',
	    value: function createConnectionAndAnswer(candidateCB, sdpCB, channelCB, offer, webChannel) {
	      var id = arguments.length <= 5 || arguments[5] === undefined ? '' : arguments[5];

	      var connection = this.initConnection(candidateCB);
	      connection.ondatachannel = function (e) {
	        e.channel.onmessage = function (msgEvt) {
	          if (msgEvt.data === 'ping') {
	            console.log('PING Received, send PONG');
	            e.channel.connection = connection;
	            webChannel.initChannel(e.channel, id);
	            e.channel.send('pong');
	            channelCB(e.channel);
	          }
	        };
	        e.channel.onopen = function () {
	          console.log('NETFLUX: Channel opened');
	        };
	      };
	      console.log('NETFLUX adding offer');
	      connection.setRemoteDescription(this.createSDP(offer), function () {
	        connection.createAnswer(function (answer) {
	          connection.setLocalDescription(answer, function () {
	            sdpCB(connection.localDescription.toJSON());
	          }, function (err) {
	            console.log('NETFLUX: error: ', err);
	            throw new Error('Could not set local description: ' + err);
	          });
	        }, function (err) {
	          console.log('NETFLUX: error: ', err);
	          throw new Error('Could not create answer: ' + err);
	        });
	      }, function (err) {
	        console.log('NETFLUX: error: ', err);
	        throw new Error('Could not set remote description: ' + err);
	      });
	      return connection;
	    }
	  }, {
	    key: 'initConnection',
	    value: function initConnection(candidateCB) {
	      var connection = new this.RTCPeerConnection({ iceServers: this.settings.iceServers });

	      connection.onicecandidate = function (e) {
	        if (e.candidate !== null) {
	          var candidate = {
	            candidate: e.candidate.candidate,
	            sdpMLineIndex: e.candidate.sdpMLineIndex
	          };
	          candidateCB(candidate);
	        }
	      };
	      return connection;
	    }
	  }, {
	    key: 'createCandidate',
	    value: function createCandidate(candidate) {
	      return new this.RTCIceCandidate(candidate);
	    }
	  }, {
	    key: 'createSDP',
	    value: function createSDP(sdp) {
	      return Object.assign(new this.RTCSessionDescription(), sdp);
	    }
	  }, {
	    key: 'randomKey',
	    value: function randomKey() {
	      var MIN_LENGTH = 10;
	      var DELTA_LENGTH = 10;
	      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	      var result = '';
	      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

	      for (var i = 0; i < length; i++) {
	        result += MASK[Math.round(Math.random() * (MASK.length - 1))];
	      }
	      return result;
	    }
	  }, {
	    key: 'toStr',
	    value: function toStr(msg) {
	      return JSON.stringify(msg);
	    }
	  }]);

	  return WebRTCService;
	}(cBuilder.Interface);

	exports.default = WebRTCService;

/***/ },
/* 9 */
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
	 * @see ChannelInterface
	 */

	/**
	 * Interface to be implemented by each connection service.
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
	    key: 'connectMeToMany',

	    /**
	     * Callback function for resolved Promise state returned by
	     * {@link module:channelBuilder~Interface#connectMeToMany} function.
	     *
	     * @callback module:channelBuilder~Interface~connectMeToManyCallback
	     * @param {Object} result - Result object
	     * @param {ChannelInterface[]} result.channels - Channels which are
	     * succesfully created.
	     * @param {string[]} result.failed - Identifiers of peers with whom the
	     * connection could not be established.
	     */

	    /**
	     * On channel callback for {@link module:channelBuilder~Interface#open}
	     * function.
	     *
	     * @callback module:channelBuilder~Interface~onChannelCallback
	     * @param {ChannelInterface} channel - A new channel.
	     */

	    /**
	     * Establish a connection between you and several peers. It is also possible
	     * to connect with a peer who is about to join the Web Channel.
	     *
	     * @abstract
	     * @param  {WebChannel} wc - Web Channel through which the connections will be
	     * established.
	     * @param  {string[]} ids Peers identifiers with whom it establishes
	     * connections.
	     * @return {Promise} - Is always resolved. The callback function type is
	     * {@link module:channelBuilder~Interface~connectMeToManyCallback}.
	     */
	    value: function connectMeToMany(wc, ids) {
	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * Establish a connection between you and another peer (including
	     * joining peer).
	     *
	     * @abstract
	     * @param  {WebChannel} wc - Web Channel through which the connection will be
	     * established.
	     * @param  {string} id - Peer id with whom the connection will be established.
	     * @return {Promise} - Resolved once the connection has been established,
	     * rejected otherwise.
	     */

	  }, {
	    key: 'connectMeToOne',
	    value: function connectMeToOne(wc, id) {
	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * Enables other clients to establish a connection with you.
	     *
	     * @abstract
	     * @param {module:channelBuilder~Interface~onChannelCallback} onChannel -
	     * Callback function to execute once the connection is established.
	     * @param {Object} [options] - Any other options which depend on the implementation.
	     * @return {Promise} - Once resolved, provide an Object with `key` attribute
	     *           to be passed to {@link connector#join} function. It is rejected
	     *           if an error occured.
	     */

	  }, {
	    key: 'open',
	    value: function open(onChannel, options) {
	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * Connects you with the peer who provided the `key`.
	     *
	     * @abstract
	     * @param  {string} key - A key obtained from a peer.
	     * @param  {Object} [options] Any other options which depend on the
	     * implementation.
	     * @return {Promise} It is resolved when the connection is established,
	     * otherwise it is rejected.
	     */

	  }, {
	    key: 'join',
	    value: function join(key, options) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }]);

	  return Interface;
	}(service.Interface);

	exports.
	/** @see module:channelBuilder~Interface */
	Interface = Interface;

/***/ }
/******/ ])
});
;