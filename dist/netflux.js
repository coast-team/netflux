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

	var _services = __webpack_require__(1);

	var services = _interopRequireWildcard(_services);

	var _WebChannel = __webpack_require__(10);

	var _WebChannel2 = _interopRequireDefault(_WebChannel);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	module.exports.WEBRTC = services.WEBRTC;
	module.exports.FULLY_CONNECTED = services.FULLY_CONNECTED;
	module.exports.WebChannel = _WebChannel2.default;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.FULLY_CONNECTED = exports.WEBRTC = exports.CHANNEL_PROXY = undefined;
	exports.get = get;

	var _FullyConnectedService = __webpack_require__(2);

	var _FullyConnectedService2 = _interopRequireDefault(_FullyConnectedService);

	var _WebRTCService = __webpack_require__(6);

	var _WebRTCService2 = _interopRequireDefault(_WebRTCService);

	var _ChannelProxyService = __webpack_require__(8);

	var _ChannelProxyService2 = _interopRequireDefault(_ChannelProxyService);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// Service names
	var CHANNEL_PROXY = exports.CHANNEL_PROXY = 'ChannelProxyService';
	var WEBRTC = exports.WEBRTC = 'WebRTCService';
	var FULLY_CONNECTED = exports.FULLY_CONNECTED = 'FullyConnectedService';

	var services = new Map();

	function get(code) {
	  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	  if (services.has(code)) {
	    return services.get(code);
	  }
	  var service = void 0;
	  switch (code) {
	    case WEBRTC:
	      return new _WebRTCService2.default(options);
	    case FULLY_CONNECTED:
	      service = new _FullyConnectedService2.default();
	      services.set(code, service);
	      return service;
	    case CHANNEL_PROXY:
	      service = new _ChannelProxyService2.default();
	      services.set(code, service);
	      return service;
	  }
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _webChannelManager = __webpack_require__(3);

	var wcManager = _interopRequireWildcard(_webChannelManager);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Fully connected web channel manager. Implements fully connected topology
	 * network, when each peer is connected to each other.
	 *
	 * @extends webChannelManager~Interface
	 */

	var FullyConnectedService = function (_wcManager$Interface) {
	  _inherits(FullyConnectedService, _wcManager$Interface);

	  function FullyConnectedService() {
	    _classCallCheck(this, FullyConnectedService);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(FullyConnectedService).apply(this, arguments));
	  }

	  _createClass(FullyConnectedService, [{
	    key: 'add',
	    value: function add(channel) {
	      var webChannel = channel.webChannel;
	      var peers = [webChannel.myId];
	      webChannel.channels.forEach(function (c) {
	        peers[peers.length] = c.peerId;
	      });
	      webChannel.joiningPeers.forEach(function (jp) {
	        if (channel.peerId !== jp.id) {
	          peers[peers.length] = jp.id;
	        }
	      });
	      return this.connectWith(webChannel, channel.peerId, channel.peerId, peers);
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
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Interface = exports.ADD_INTERMEDIARY_CHANNEL = exports.CONNECT_WITH_FEEDBACK = exports.CONNECT_WITH = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(4);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceInterface2 = __webpack_require__(5);

	var _ServiceInterface3 = _interopRequireDefault(_ServiceInterface2);

	var _services = __webpack_require__(1);

	var services = _interopRequireWildcard(_services);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Web Channel Manager module - start point for all connection services. Composed of:
	 * - Constants to identify the request type sent by this peer's service to
	 *   the same service of another peer.
	 * - Interface which each web channel manager should extends.
	 * @module webChannelManager
	 */

	/**
	 * Connection service of the peer who received a message of this type should
	 * establish connection with one or several peers.
	 */
	var CONNECT_WITH = exports.CONNECT_WITH = 1;
	var CONNECT_WITH_FEEDBACK = exports.CONNECT_WITH_FEEDBACK = 2;
	var ADD_INTERMEDIARY_CHANNEL = exports.ADD_INTERMEDIARY_CHANNEL = 4;

	/**
	 * Interface for all web channel manager services. Its standalone
	 * instance is useless.
	 * @interface
	 * @extends ServiceInterface
	 */

	var Interface = function (_ServiceInterface) {
	  _inherits(Interface, _ServiceInterface);

	  function Interface() {
	    _classCallCheck(this, Interface);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(Interface).apply(this, arguments));
	  }

	  _createClass(Interface, [{
	    key: 'onMessage',
	    value: function onMessage(webChannel, msg) {
	      var _this2 = this;

	      var cBuilder = services.get(webChannel.settings.connector, webChannel.settings);
	      switch (msg.code) {
	        case CONNECT_WITH:
	          msg.peers = this.reUseIntermediaryChannelIfPossible(webChannel, msg.jpId, msg.peers);
	          cBuilder.connectMeToMany(webChannel, msg.peers).then(function (channels) {
	            channels.forEach(function (c) {
	              webChannel.initChannel(c, c.peerId);
	              webChannel.getJoiningPeer(msg.jpId).toAddList(c);
	              c.send(webChannel.proxy.msg(cs.THIS_CHANNEL_TO_JOINING_PEER, { id: msg.jpId, toBeAdded: true }));
	            });
	            webChannel.sendSrvMsg(_this2.name, msg.sender, { code: CONNECT_WITH_FEEDBACK, id: webChannel.myId, isDone: true });
	          }).catch(function (err) {
	            webChannel.sendSrvMsg(_this2.name, msg.sender, { code: CONNECT_WITH_FEEDBACK, id: webChannel.myId, isDone: false });
	          });
	          break;
	        case CONNECT_WITH_FEEDBACK:
	          webChannel.connectWithRequests.get(msg.id)(msg.isDone);
	          break;
	        case ADD_INTERMEDIARY_CHANNEL:
	          var jp = webChannel.getJoiningPeer(msg.jpId);
	          jp.toAddList(jp.intermediaryChannel);
	          break;
	      }
	    }
	  }, {
	    key: 'connectWith',
	    value: function connectWith(webChannel, id, jpId, peers) {
	      webChannel.sendSrvMsg(this.name, id, { code: CONNECT_WITH, jpId: jpId,
	        sender: webChannel.myId, peers: peers });
	      return new Promise(function (resolve, reject) {
	        webChannel.connectWithRequests.set(id, function (isDone) {
	          if (isDone) {
	            resolve();
	          } else {
	            reject();
	          }
	        });
	      });
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
	  }, {
	    key: 'add',
	    value: function add(webChannel, data) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }, {
	    key: 'broadcast',
	    value: function broadcast(webChannel, data) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }, {
	    key: 'sendTo',
	    value: function sendTo(id, webChannel, data) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }, {
	    key: 'leave',
	    value: function leave(webChannel) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }]);

	  return Interface;
	}(_ServiceInterface3.default);

	exports.Interface = Interface;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _services = __webpack_require__(1);

	Object.keys(_services).forEach(function (key) {
	  if (key === "default") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _services[key];
	    }
	  });
	});

	// API user's message
	var USER_DATA = exports.USER_DATA = 0;

	// Internal message to a specific Service
	var SERVICE_DATA = exports.SERVICE_DATA = 1;

	// Internal messages
	var LEAVE = exports.LEAVE = 8;
	var JOIN_INIT = exports.JOIN_INIT = 3;
	var JOIN_NEW_MEMBER = exports.JOIN_NEW_MEMBER = 6;
	var JOIN_FINILIZE = exports.JOIN_FINILIZE = 5;
	var JOIN_SUCCESS = exports.JOIN_SUCCESS = 4;
	var JOIN_STEP3_FAIL = exports.JOIN_STEP3_FAIL = 2;
	var THIS_CHANNEL_TO_JOINING_PEER = exports.THIS_CHANNEL_TO_JOINING_PEER = 7;

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
	 * Interface for every service.
	 * @interface
	 */

	var ServiceInterface = function () {
	  function ServiceInterface() {
	    _classCallCheck(this, ServiceInterface);
	  }

	  _createClass(ServiceInterface, [{
	    key: 'onMessage',
	    value: function onMessage(webChannel, msg) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }, {
	    key: 'name',
	    get: function get() {
	      return this.constructor.name;
	    }
	  }]);

	  return ServiceInterface;
	}();

	exports.default = ServiceInterface;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _channelBuilder = __webpack_require__(7);

	var cBuilder = _interopRequireWildcard(_channelBuilder);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var CONNECTION_CREATION_TIMEOUT = 2000;

	/**
	 * Service class responsible to establish connections between peers via `RTCDataChannel`.
	 * @extends {@link channelBuilder#Interface}
	 */

	var WebRTCService = function (_cBuilder$Interface) {
	  _inherits(WebRTCService, _cBuilder$Interface);

	  function WebRTCService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebRTCService);

	    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WebRTCService).call(this));

	    _this.defaults = {
	      signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
	      iceServers: [{ urls: 'stun:23.21.150.121' }, { urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com' }]
	    };
	    _this.settings = Object.assign({}, _this.defaults, options);

	    // Declare WebRTCService related global(window) constructors
	    _this.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;

	    _this.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate || window.msRTCIceCandidate;

	    _this.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
	    return _this;
	  }

	  _createClass(WebRTCService, [{
	    key: 'open',
	    value: function open(webChannel, onChannel) {
	      var _this2 = this;

	      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	      var key = webChannel.id;
	      var settings = Object.assign({}, this.settings, options);
	      // Connection array, because several connections may be establishing
	      // at the same time
	      var connections = [];

	      // Connect to the signaling server
	      var socket = new window.WebSocket(settings.signaling);

	      // Send a message to signaling server: ready to receive offer
	      socket.onopen = function () {
	        webChannel.webRTCOpen = socket;
	        socket.send(_this2.toStr({ key: key }));
	      };
	      socket.onmessage = function (e) {
	        var msg = JSON.parse(e.data);
	        if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
	          throw new Error('Incorrect message format from the signaling server.');
	        }

	        // On SDP offer: add connection to the array, prepare answer and send it back
	        if (Reflect.has(msg.data, 'offer')) {
	          connections[connections.length] = _this2.createConnectionAndAnswer(function (candidate) {
	            return socket.send(_this2.toStr({ id: msg.id, data: { candidate: candidate } }));
	          }, function (answer) {
	            return socket.send(_this2.toStr({ id: msg.id, data: { answer: answer } }));
	          }, onChannel, msg.data.offer);
	          // On Ice Candidate
	        } else if (Reflect.has(msg.data, 'candidate')) {
	            connections[msg.id].addIceCandidate(_this2.createCandidate(msg.data.candidate));
	          }
	      };
	      socket.onerror = function (e) {
	        throw new Error('Connection to the signaling server ' + settings.signaling + ' failed: ' + e.message + '.');
	      };
	      socket.onclose = function () {
	        delete webChannel.webRTCOpen;
	      };
	      return { key: key, signaling: settings.signaling };
	    }
	  }, {
	    key: 'join',
	    value: function join(key) {
	      var _this3 = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);
	      return new Promise(function (resolve, reject) {
	        var connection = void 0;

	        // Connect to the signaling server
	        var socket = new window.WebSocket(settings.signaling);
	        socket.onopen = function () {
	          // Prepare and send offer
	          connection = _this3.createConnectionAndOffer(function (candidate) {
	            return socket.send(_this3.toStr({ data: { candidate: candidate } }));
	          }, function (offer) {
	            return socket.send(_this3.toStr({ join: key, data: { offer: offer } }));
	          }, function (channel) {
	            return resolve(channel);
	          }, key);
	        };
	        socket.onmessage = function (e) {
	          var msg = JSON.parse(e.data);

	          // Check message format
	          if (!Reflect.has(msg, 'data')) {
	            reject();
	          }

	          // If received an answer to the previously sent offer
	          if (Reflect.has(msg.data, 'answer')) {
	            var sd = _this3.createSDP(msg.data.answer);
	            connection.setRemoteDescription(sd, function () {}, reject);
	            // If received an Ice candidate
	          } else if (Reflect.has(msg.data, 'candidate')) {
	              connection.addIceCandidate(_this3.createCandidate(msg.data.candidate));
	            } else {
	              reject();
	            }
	        };
	        socket.onerror = reject;
	      });
	    }
	  }, {
	    key: 'connectMeToMany',
	    value: function connectMeToMany(webChannel, ids) {
	      var promises = [];
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = ids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var id = _step.value;

	          promises.push(this.connectMeToOne(webChannel, id));
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

	      return Promise.all(promises);
	    }
	  }, {
	    key: 'connectMeToOne',
	    value: function connectMeToOne(webChannel, id) {
	      var _this4 = this;

	      return new Promise(function (resolve, reject) {
	        var sender = webChannel.myId;
	        var connection = _this4.createConnectionAndOffer(function (candidate) {
	          return webChannel.sendSrvMsg(_this4.name, id, { sender: sender, candidate: candidate });
	        }, function (offer) {
	          webChannel.connections.set(id, connection);
	          webChannel.sendSrvMsg(_this4.name, id, { sender: sender, offer: offer });
	        }, function (channel) {
	          channel.peerId = id;
	          resolve(channel);
	        }, id);
	        setTimeout(reject, CONNECTION_CREATION_TIMEOUT, 'Timeout');
	      });
	    }
	  }, {
	    key: 'onMessage',
	    value: function onMessage(webChannel, msg) {
	      var _this5 = this;

	      var connections = webChannel.connections;
	      if (Reflect.has(msg, 'offer')) {
	        // TODO: add try/catch. On exception remove connection from webChannel.connections
	        connections.set(msg.sender, this.createConnectionAndAnswer(function (candidate) {
	          return webChannel.sendSrvMsg(_this5.name, msg.sender, { sender: webChannel.myId, candidate: candidate });
	        }, function (answer) {
	          return webChannel.sendSrvMsg(_this5.name, msg.sender, { sender: webChannel.myId, answer: answer });
	        }, function (channel) {
	          webChannel.initChannel(channel, msg.sender);
	          webChannel.connections.delete(channel.peerId);
	        }, msg.offer));
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
	    value: function createConnectionAndOffer(candidateCB, sdpCB, channelCB, key) {
	      var connection = this.initConnection(candidateCB);
	      var dc = connection.createDataChannel(key);
	      dc.onopen = function () {
	        return channelCB(dc);
	      };
	      connection.createOffer(function (offer) {
	        connection.setLocalDescription(offer, function () {
	          sdpCB(connection.localDescription.toJSON());
	        }, function (err) {
	          throw new Error('Could not set local description: ' + err);
	        });
	      }, function (err) {
	        throw new Error('Could not create offer: ' + err);
	      });
	      return connection;
	    }
	  }, {
	    key: 'createConnectionAndAnswer',
	    value: function createConnectionAndAnswer(candidateCB, sdpCB, channelCB, offer) {
	      var connection = this.initConnection(candidateCB);
	      connection.ondatachannel = function (e) {
	        e.channel.onopen = function () {
	          return channelCB(e.channel);
	        };
	      };
	      connection.setRemoteDescription(this.createSDP(offer), function () {
	        connection.createAnswer(function (answer) {
	          connection.setLocalDescription(answer, function () {
	            sdpCB(connection.localDescription.toJSON());
	          }, function (err) {
	            throw new Error('Could not set local description: ' + err);
	          });
	        }, function (err) {
	          throw new Error('Could not create answer: ' + err);
	        });
	      }, function (err) {
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
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Interface = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _ServiceInterface2 = __webpack_require__(5);

	var _ServiceInterface3 = _interopRequireDefault(_ServiceInterface2);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Channel Builder module - start point for all connection services. Composed of
	 * an Interface which each channel builder service should extend.
	 * @module channelBuilder
	 */

	/**
	 * Interface for all channel builder services. Its standalone instance is useless.
	 * @interface
	 * @extends ServiceInterface
	 */

	var Interface = function (_ServiceInterface) {
	  _inherits(Interface, _ServiceInterface);

	  function Interface() {
	    _classCallCheck(this, Interface);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(Interface).apply(this, arguments));
	  }

	  _createClass(Interface, [{
	    key: 'connectMeToMany',

	    /**
	     * Sends a message to `peerExecutor.id` asking him to establish a connection
	     * with `peers`. This function is used to add a new peer to the `webChannel`.
	     *
	     * For exemple: A, B, C constitute the `webChannel`. N1 and N2 are not the
	     * `webChannel` members and they are about to join it. N1 is connected to A.
	     * Thus A is the intermediary peer for communicate with N1. N2 is connected
	     * to C thereby C is the intermediary peer for N2.
	     *
	     * N1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A<br />
	     * +------->+<br />
	     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
	     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
	     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-----------+<------+<br />
	     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;N2<br />
	     *
	     *  Here are possible use cases:
	     *
	     * 1. A asks C to connect with N1
	     * 2. A asks B to connect with N1
	     * 3. B asks A to connect with N1
	     * 4. B asks C to connect with N1
	     * 5. B asks C to connect with A
	     * 6. A asks N1 to connect with B
	     * 7. A asks N1 to connect with C
	     * 8. B asks N1 to connect with C
	     * 9. A asks N1 to connect with N2
	     * 10. B asks N2 to connect with N1
	     *
	     * @param  {Object} peerExecutor The peer who must establish connection with `peers`.
	     * @param  {string} peerExecutor.id The `peerExecutor`'s id.
	     * @param  {string} [peerExecutor.intermediaryId] The id of the peer in the `webChannel`
	     *            who knows the `peerExecutor` which is not yet a member of the `webChannel`.
	     * @param  {WebChannel} webChannel - `webChannel` which has this function caller as member.
	     * @param  {Object[]} peers An array of peers with whom the `peerExecutor` must
	     *           establish a connection.
	     * @param  {string} peers[].id - The peer's id.
	     * @param  {string} [peers[].intermediaryId] - the id of an intermediary peer
	     *           to communicate with this partner (as for `peerExecutor`).
	     *
	     * @return {Promise} Once `peerExecutor` established all required connections,
	     *           the promise is resolved, otherwise it is rejected.
	     */
	    value: function connectMeToMany(webChannel, ids) {
	      throw new Error('Must be implemented by subclass!');
	    }
	  }, {
	    key: 'connectMeToOne',
	    value: function connectMeToOne(webChannel, id) {
	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * This callback type is `onChannelCallback`.
	     *
	     * @callback onChannelCallback
	     * @param {Channel} channel A new channel.
	     */

	    /**
	     * Enables other clients to establish a connection with you.
	     *
	     * @abstract
	     * @param {onChannelCallback} onChannel Callback function to execute once the
	     *          connection is established.
	     * @param {Object} [options] Any other options which depend on the implementation.
	     * @return {Promise} Once resolved, provide an Object with `key` attribute
	     *           to be passed to {@link connector#join} function. It is rejected
	     *           if an error occured.
	     */

	  }, {
	    key: 'open',
	    value: function open(onChannel) {
	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      throw new Error('Must be implemented by subclass!');
	    }

	    /**
	     * Connects you with the peer who provided the `key`.
	     *
	     * @abstract
	     * @param  {type} key A key obtained from a peer.
	     * @param  {type} options = {} Any other options which depend on the
	     *           implementation.
	     * @return {Promise} It is resolved when the connection is established,
	     *           otherwise it is rejected.
	     */

	  }, {
	    key: 'join',
	    value: function join(key) {
	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      throw new Error('Must be implemented by subclass!');
	    }
	  }]);

	  return Interface;
	}(_ServiceInterface3.default);

	exports.
	/** Interface to be implemented by each connection service. */
	Interface = Interface;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _ServiceInterface2 = __webpack_require__(5);

	var _ServiceInterface3 = _interopRequireDefault(_ServiceInterface2);

	var _constants = __webpack_require__(4);

	var cs = _interopRequireWildcard(_constants);

	var _JoiningPeer = __webpack_require__(9);

	var _JoiningPeer2 = _interopRequireDefault(_JoiningPeer);

	var _services = __webpack_require__(1);

	var services = _interopRequireWildcard(_services);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	/**
	 * Class responsible of sent/received message format via channels.
	 */

	var ChannelProxyService = function (_ServiceInterface) {
	  _inherits(ChannelProxyService, _ServiceInterface);

	  function ChannelProxyService() {
	    _classCallCheck(this, ChannelProxyService);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(ChannelProxyService).apply(this, arguments));
	  }

	  _createClass(ChannelProxyService, [{
	    key: 'onMsg',
	    value: function onMsg(e) {
	      var msg = JSON.parse(e.data);
	      var channel = e.currentTarget;
	      var webChannel = channel.webChannel;
	      var jp = void 0;
	      switch (msg.code) {
	        case cs.USER_DATA:
	          webChannel.onMessage(msg.id, msg.data);
	          break;
	        case cs.LEAVE:
	          webChannel.onLeaving(msg.id);
	          webChannel.channels.delete(webChannel.channels.get(msg.id));
	          break;
	        case cs.SERVICE_DATA:
	          if (webChannel.myId === msg.recepient) {
	            webChannel.proxy.onSrvMsg(webChannel, msg);
	          } else {
	            webChannel.sendSrvMsg(msg.serviceName, msg.recepient, msg.data);
	          }
	          break;
	        case cs.JOIN_INIT:
	          webChannel.topology = msg.manager;
	          webChannel.myId = msg.id;
	          channel.peerId = msg.intermediaryId;
	          jp = new _JoiningPeer2.default(msg.id, msg.intermediaryId);
	          jp.intermediaryChannel = channel;
	          webChannel.addJoiningPeer(jp);
	          break;
	        case cs.JOIN_NEW_MEMBER:
	          webChannel.addJoiningPeer(new _JoiningPeer2.default(msg.id, msg.intermediaryId));
	          break;
	        case cs.JOIN_FINILIZE:
	          webChannel.joinSuccess(webChannel.myId);
	          var nextMsg = webChannel.proxy.msg(cs.JOIN_SUCCESS, { id: webChannel.myId });
	          webChannel.manager.broadcast(webChannel, nextMsg);
	          webChannel.onJoin();
	          break;
	        case cs.JOIN_SUCCESS:
	          webChannel.joinSuccess(msg.id);
	          webChannel.onJoining(msg.id);
	          break;
	        case cs.THIS_CHANNEL_TO_JOINING_PEER:
	          if (webChannel.hasJoiningPeer(msg.id)) {
	            jp = webChannel.getJoiningPeer(msg.id);
	          } else {
	            jp = new _JoiningPeer2.default(msg.id);
	            webChannel.addJoiningPeer(jp);
	          }
	          if (msg.toBeAdded) {
	            jp.toAddList(channel);
	          } else {
	            jp.toRemoveList(channel);
	          }
	          break;
	      }
	    }
	  }, {
	    key: 'onSrvMsg',
	    value: function onSrvMsg(webChannel, msg) {
	      services.get(msg.serviceName, webChannel.settings).onMessage(webChannel, msg.data);
	    }
	  }, {
	    key: 'msg',
	    value: function msg(code) {
	      var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var msg = Object.assign({ code: code }, data);
	      return JSON.stringify(msg);
	    }
	  }]);

	  return ChannelProxyService;
	}(_ServiceInterface3.default);

	exports.default = ChannelProxyService;

/***/ },
/* 9 */
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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(4);

	var cs = _interopRequireWildcard(_constants);

	var _services = __webpack_require__(1);

	var services = _interopRequireWildcard(_services);

	var _JoiningPeer = __webpack_require__(9);

	var _JoiningPeer2 = _interopRequireDefault(_JoiningPeer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * This class is an API starting point. It represents a group of collaborators
	 * also called peers. Each member of the group can send/receive broadcast
	 * as well as personal messages. Every peer in the group can invite another
	 * person to join the group and he is able to add it respecting the current
	 * group structure (network topology).
	 */

	var WebChannel = function () {

	  /**
	   * Creates `WebChannel`.
	   *
	   * @param  {Object} options `WebChannel` configuration.
	   * @param  {string} options.topology = FULLY_CONNECTED Defines the network
	   *            topology.
	   * @param  {string} options.connector = WEBRTC Determines which connection
	   *            service to use to build `WebChannel`.
	   * @return {WebChannel} Empty `WebChannel` without any connection.
	   */

	  function WebChannel() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebChannel);

	    this.defaults = {
	      connector: services.WEBRTC,
	      topology: services.FULLY_CONNECTED
	    };
	    this.settings = Object.assign({}, this.defaults, options);

	    // Public attributes

	    /** Unique identifier of this `WebChannel`. The same for all peers. */
	    this.id = this.generateId();

	    /** Unique peer identifier in this `WebChannel`. */
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
	    this.proxy = services.get(services.CHANNEL_PROXY);
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

	    /** Leave `WebChannel`. No longer can receive and send messages to the group. */

	  }, {
	    key: 'leave',
	    value: function leave() {
	      this.manager.broadcast(this, this.proxy.msg(cs.LEAVE, { id: this.myId }));
	    }

	    /**
	     * Send broadcast message.
	     *
	     * @param  {string} data Message
	     */

	  }, {
	    key: 'send',
	    value: function send(data) {
	      this.manager.broadcast(this, this.proxy.msg(cs.USER_DATA, { id: this.myId, data: data }));
	    }

	    /**
	     * Send message to a particular peer.
	     *
	     * @param  {type} id Peer id of the recipient.
	     * @param  {type} data Message
	     */

	  }, {
	    key: 'sendTo',
	    value: function sendTo(id, data) {
	      this.manager.sendTo(id, this, this.proxy.msg(cs.USER_DATA, { id: this.myId, data: data }));
	    }

	    /**
	     * Enable other peers to join the `WebChannel` with your help as an intermediary
	     * peer.
	     *
	     * @param  {Object} options = {} Any available connection service options.
	     * @return {string} The key required by other peer to join the `WebChannel`.
	     */

	  }, {
	    key: 'openForJoining',
	    value: function openForJoining() {
	      var _this = this;

	      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	      var settings = Object.assign({}, this.settings, options);

	      var cBuilder = services.get(settings.connector, settings);
	      var data = cBuilder.open(this, function (channel) {
	        _this.initChannel(channel);
	        var jp = new _JoiningPeer2.default(channel.peerId, _this.myId);
	        jp.intermediaryChannel = channel;
	        _this.joiningPeers.add(jp);
	        channel.send(_this.proxy.msg(cs.JOIN_INIT, { manager: _this.settings.topology,
	          id: channel.peerId,
	          intermediaryId: _this.myId }));
	        _this.manager.broadcast(_this, _this.proxy.msg(cs.JOIN_NEW_MEMBER, { id: channel.peerId, intermediaryId: _this.myId }));
	        _this.manager.add(channel).then(function () {
	          channel.send(_this.proxy.msg(cs.JOIN_FINILIZE));
	        }).catch(function () {
	          // TODO: implement JOIN_FAIL
	        });
	      });
	      return data.key;
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
	     * @param  {type} options = {} Any available connection service options.
	     * @return {Promise} Is resolve once you became a `WebChannel` member.
	     */

	  }, {
	    key: 'join',
	    value: function join(key) {
	      var _this2 = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);

	      var cBuilder = services.get(settings.connector, settings);
	      return new Promise(function (resolve, reject) {
	        cBuilder.join(key).then(function (channel) {
	          _this2.initChannel(channel);
	          _this2.onJoin = function () {
	            resolve(_this2);
	          };
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
	     * sendSrvMsg - description
	     *
	     * @private
	     * @param  {type} serviceName description
	     * @param  {type} recepient   description
	     * @param  {type} msg = {}    description
	     * @return {type}             description
	     */

	  }, {
	    key: 'sendSrvMsg',
	    value: function sendSrvMsg(serviceName, recepient) {
	      var msg = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	      var completeMsg = { serviceName: serviceName, recepient: recepient, data: Object.assign({}, msg) };
	      var stringifiedMsg = this.proxy.msg(cs.SERVICE_DATA, completeMsg);
	      if (recepient === this.myId) {
	        this.proxy.onSrvMsg(this, completeMsg);
	      } else {
	        // If this function caller is a peer who is joining
	        if (this.isJoining()) {
	          this.getJoiningPeer(this.myId).intermediaryChannel.send(stringifiedMsg);
	        } else {
	          // If the recepient is a joining peer
	          if (this.hasJoiningPeer(recepient)) {
	            var jp = this.getJoiningPeer(recepient);
	            // If I am an intermediary peer for recepient
	            if (jp.intermediaryId === this.myId) {
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

	    /**
	     * set - description
	     *
	     * @private
	     * @param  {type} name description
	     * @return {type}      description
	     */

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
	      var id = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

	      channel.webChannel = this;
	      channel.onmessage = this.proxy.onMsg;
	      if (id !== '') {
	        channel.peerId = id;
	      } else {
	        channel.peerId = this.generateId();
	      }
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
	      var _this3 = this;

	      var jp = this.getJoiningPeer(id);
	      jp.channelsToAdd.forEach(function (c) {
	        _this3.channels.add(c);
	        _this3.joiningPeers.delete(jp);
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
	      this.manager = services.get(this.settings.topology);
	    }

	    /**
	     * get - description
	     *
	     * @private
	     * @return {type}  description
	     */
	    ,
	    get: function get() {
	      return this.settings.topology;
	    }
	  }]);

	  return WebChannel;
	}();

	exports.default = WebChannel;

/***/ }
/******/ ])
});
;