/**
 * Default timeout for any pending request.
 * @type {number}
 */
const DEFAULT_REQUEST_TIMEOUT = 60000;

/**
 * Item storage which is separate for each service. The `Map` key is the service `id`.
 */
const itemsStorage = new Map();

/**
 * Pending request map. Pending request is when a service uses a Promise
 * which will be fulfilled or rejected somewhere else in code. For exemple when
 * a peer is waiting for a feedback from another peer before Promise has completed.
 * @type {Map}
 */
const requestsStorage = new Map();

/**
 * Abstract class which each service should inherit. Each service is independent
 * and can store data temporarly in order to accomplish its task(s).
 */
class Service {

  /**
   * It should be invoked only by calling `super` from the children constructor.
   *
   * @param {number} id The service unique identifier
   */
  constructor (id) {
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
  setPendingRequest (obj, id, data, timeout = DEFAULT_REQUEST_TIMEOUT) {
    this.setTo(requestsStorage, obj, id, data);
    setTimeout(() => { data.reject('Pending request timeout'); }, timeout);
  }

  /**
   * Get pending request identified by `obj` and `id`.
   *
   * @param  {Object} obj
   * @param  {number} id
   * @returns {{resolve: Promise.resolve, reject:Promise.reject}}
   */
  getPendingRequest (obj, id) {
    return this.getFrom(requestsStorage, obj, id)
  }

  /**
   * Add item with `obj` and `ìd` as identifier.
   * @param {Object} obj
   * @param {number} id
   * @param {Object} data
   */
  setItem (obj, id, data) {
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
  getItem (obj, id) {
    return this.getFrom(itemsStorage, obj, id)
  }

  /**
   * Get all items belonging to `obj`.
   *
   * @param {Object} obj
   * @returns {Map}
   */
  getItems (obj) {
    const items = itemsStorage.get(this.id).get(obj);
    if (items) return items
    else return new Map()
  }

  /**
   * Remove item identified by `obj` and `id`.
   *
   * @param {Object} obj
   * @param {number} id
   */
  removeItem (obj, id) {
    const currentServiceTemp = itemsStorage.get(this.id);
    const idMap = currentServiceTemp.get(obj);
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
  getFrom (storage, obj, id) {
    const idMap = storage.get(this.id).get(obj);
    if (idMap !== undefined) {
      const item = idMap.get(id);
      if (item !== undefined) return item
    }
    return null
  }

  /**
   * @private
   * @param {Map} storage
   * @param {WebChannel} obj
   * @param {number} id
   * @param {Object} data
   *
   */
  setTo (storage, obj, id, data) {
    const currentServiceTemp = storage.get(this.id);
    let idMap;
    if (currentServiceTemp.has(obj)) {
      idMap = currentServiceTemp.get(obj);
    } else {
      idMap = new Map();
      currentServiceTemp.set(obj, idMap);
    }
    if (!idMap.has(id)) idMap.set(id, data);
  }
}

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
class TopologyInterface extends Service {

  connectTo (wc, peerIds) {
    const failed = [];
    if (peerIds.length === 0) return Promise.resolve(failed)
    else {
      return new Promise((resolve, reject) => {
        let counter = 0;
        const cBuilder = ServiceFactory.get(CHANNEL_BUILDER);
        peerIds.forEach(id => {
          cBuilder.connectTo(wc, id)
            .then(channel => this.onChannel(channel))
            .then(() => { if (++counter === peerIds.length) resolve(failed); })
            .catch(reason => {
              failed.push({id, reason});
              if (++counter === peerIds.length) resolve(failed);
            });
        });
      })
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
  add (ch) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Send a message to all peers in Web Channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel where the message will be propagated.
   * @param  {string} data - Data in stringified JSON format to be send.
   */
  broadcast (wc, data) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Send a message to a particular peer in Web Channel.
   *
   * @abstract
   * @param  {string} id - Peer id.
   * @param  {WebChannel} wc - Web Channel where the message will be propagated.
   * @param  {string} data - Data in stringified JSON format to be send.
   */
  sendTo (id, wc, data) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Leave Web Channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel to leave.
   */
  leave (wc) {
    throw new Error('Must be implemented by subclass!')
  }
}

/**
 * One of the internal message type. The message is intended for the `WebChannel`
 * members to notify them about the joining peer.
 * @type {number}
 */
const SHOULD_ADD_NEW_JOINING_PEER = 1;
/**
 * Connection service of the peer who received a message of this type should
 * establish connection with one or several peers.
 */
const SHOULD_CONNECT_TO = 2;
/**
 * One of the internal message type. The message sent by the joining peer to
 * notify all `WebChannel` members about his arrivel.
 * @type {number}
 */
const PEER_JOINED = 3;

const TICK = 4;
const TOCK = 5;

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */
class FullyConnectedService extends TopologyInterface {

  /**
   * Add a peer to the `WebChannel`.
   *
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {Promise<number, string>}
   */
  add (channel) {
    const wc = channel.webChannel;
    const peers = wc.members.slice();
    for (let jpId of super.getItems(wc).keys()) peers[peers.length] = jpId;
    this.setJP(wc, channel.peerId, channel);
    wc.sendInner(this.id, {code: SHOULD_ADD_NEW_JOINING_PEER, jpId: channel.peerId});
    wc.sendInnerTo(channel, this.id, {code: SHOULD_CONNECT_TO, peers});
    return new Promise((resolve, reject) => {
      super.setPendingRequest(wc, channel.peerId, {resolve, reject});
    })
  }

  /**
   * Send message to all `WebChannel` members.
   *
   * @param {WebChannel} webChannel
   * @param {ArrayBuffer} data
   */
  broadcast (webChannel, data) {
    for (let c of webChannel.channels) c.send(data);
  }

  sendTo (id, webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.peerId === id) {
        c.send(data);
        return
      }
    }
  }

  sendInnerTo (recepient, wc, data) {
    // If the peer sent a message to himself
    if (recepient === wc.myId) wc.onChannelMessage(null, data);
    else {
      let jp = super.getItem(wc, wc.myId);
      if (jp === null) jp = super.getItem(wc, recepient);

      if (jp !== null) { // If me or recepient is joining the WebChannel
        jp.channel.send(data);
      } else if (wc.members.includes(recepient)) { // If recepient is a WebChannel member
        this.sendTo(recepient, wc, data);
      } else this.sendTo(wc.members[0], wc, data);
    }
  }

  sendInner (wc, data) {
    const jp = super.getItem(wc, wc.myId);
    if (jp === null) this.broadcast(wc, data);
    else jp.channel.send(data);
  }

  leave (wc) {
    for (let c of wc.channels) {
      c.clearHandlers();
      c.close();
    }
    wc.channels.clear();
  }

  onChannel (channel) {
    return new Promise((resolve, reject) => {
      super.setPendingRequest(channel.webChannel, channel.peerId, {resolve, reject});
      channel.webChannel.sendInnerTo(channel, this.id, {code: TICK});
    })
  }

  /**
   * Close event handler for each `Channel` in the `WebChannel`.
   *
   * @param {CloseEvent} closeEvt
   * @param {Channel} channel
   *
   * @returns {boolean}
   */
  onChannelClose (closeEvt, channel) {
    // TODO: need to check if this is a peer leaving and thus he closed channels
    // with all WebChannel members or this is abnormal channel closing
    const wc = channel.webChannel;
    for (let c of wc.channels) {
      if (c.peerId === channel.peerId) return wc.channels.delete(c)
    }
    const jps = super.getItems(wc);
    jps.forEach(jp => jp.channels.delete(channel));
    return false
  }

  /**
   * Error event handler for each `Channel` in the `WebChannel`.
   *
   * @param {Event} evt
   * @param {Channel} channel
   */
  onChannelError (evt, channel) {
    console.error(`Channel error with id: ${channel.peerId}: `, evt);
  }

  onMessage (channel, senderId, recepientId, msg) {
    const wc = channel.webChannel;
    let jpMe;
    switch (msg.code) {
      case SHOULD_CONNECT_TO:
        jpMe = this.setJP(wc, wc.myId, channel);
        jpMe.channels.add(channel);
        super.connectTo(wc, msg.peers)
          .then(failed => {
            const msg = {code: PEER_JOINED};
            jpMe.channels.forEach(ch => {
              wc.sendInnerTo(ch, this.id, msg);
              wc.channels.add(ch);
              wc.onPeerJoin$(ch.peerId);
            });
            super.removeItem(wc, wc.myId);
            super.getItems(wc).forEach(jp => wc.sendInnerTo(jp.channel, this.id, msg));
            wc.onJoin();
          });
        break
      case PEER_JOINED:
        jpMe = super.getItem(wc, wc.myId);
        super.removeItem(wc, senderId);
        if (jpMe !== null) jpMe.channels.add(channel);
        else {
          wc.channels.add(channel);
          wc.onPeerJoin$(senderId);
          const request = super.getPendingRequest(wc, senderId);
          if (request !== null) request.resolve(senderId);
        }
        break
      case TICK: {
        this.setJP(wc, senderId, channel);
        const isJoining = super.getItem(wc, wc.myId) !== null;
        wc.sendInnerTo(channel, this.id, {code: TOCK, isJoining});
        break
      }
      case TOCK:
        if (msg.isJoining) this.setJP(wc, senderId, channel);
        else super.getItem(wc, wc.myId).channels.add(channel);
        super.getPendingRequest(wc, senderId).resolve();
        break
      case SHOULD_ADD_NEW_JOINING_PEER:
        this.setJP(wc, msg.jpId, channel);
        break
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
  setJP (wc, jpId, channel) {
    let jp = super.getItem(wc, jpId);
    if (!jp) {
      jp = new JoiningPeer(channel);
      super.setItem(wc, jpId, jp);
    } else jp.channel = channel;
    return jp
  }
}

/**
 * This class represents a temporary state of a peer, while he is about to join
 * the web channel. During the joining process every peer in the web channel
 * and the joining peer have an instance of this class with the same `id` and
 * `intermediaryId` attribute values. After the joining process has been finished
 * regardless of success, these instances will be deleted.
 */
class JoiningPeer {
  constructor (channel, onJoin) {
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
  }
}

!function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r);}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){},{}],2:[function(require,module,exports){"use strict";!function(){var logging=require("./utils").log,browserDetails=require("./utils").browserDetails;module.exports.browserDetails=browserDetails,module.exports.extractVersion=require("./utils").extractVersion,module.exports.disableLog=require("./utils").disableLog;var chromeShim=require("./chrome/chrome_shim")||null,edgeShim=require("./edge/edge_shim")||null,firefoxShim=require("./firefox/firefox_shim")||null,safariShim=require("./safari/safari_shim")||null;switch(browserDetails.browser){case"opera":case"chrome":if(!chromeShim||!chromeShim.shimPeerConnection)return void logging("Chrome shim is not included in this adapter release.");logging("adapter.js shimming chrome."),module.exports.browserShim=chromeShim,chromeShim.shimGetUserMedia(),chromeShim.shimMediaStream(),chromeShim.shimSourceObject(),chromeShim.shimPeerConnection(),chromeShim.shimOnTrack();break;case"firefox":if(!firefoxShim||!firefoxShim.shimPeerConnection)return void logging("Firefox shim is not included in this adapter release.");logging("adapter.js shimming firefox."),module.exports.browserShim=firefoxShim,firefoxShim.shimGetUserMedia(),firefoxShim.shimSourceObject(),firefoxShim.shimPeerConnection(),firefoxShim.shimOnTrack();break;case"edge":if(!edgeShim||!edgeShim.shimPeerConnection)return void logging("MS edge shim is not included in this adapter release.");logging("adapter.js shimming edge."),module.exports.browserShim=edgeShim,edgeShim.shimGetUserMedia(),edgeShim.shimPeerConnection();break;case"safari":if(!safariShim)return void logging("Safari shim is not included in this adapter release.");logging("adapter.js shimming safari."),module.exports.browserShim=safariShim,safariShim.shimGetUserMedia();break;default:logging("Unsupported browser!");}}();},{"./chrome/chrome_shim":3,"./edge/edge_shim":1,"./firefox/firefox_shim":5,"./safari/safari_shim":7,"./utils":8}],3:[function(require,module,exports){"use strict";var logging=require("../utils.js").log,browserDetails=require("../utils.js").browserDetails,chromeShim={shimMediaStream:function(){window.MediaStream=window.MediaStream||window.webkitMediaStream;},shimOnTrack:function(){"object"!=typeof window||!window.RTCPeerConnection||"ontrack"in window.RTCPeerConnection.prototype||Object.defineProperty(window.RTCPeerConnection.prototype,"ontrack",{get:function(){return this._ontrack},set:function(f){var self=this;this._ontrack&&(this.removeEventListener("track",this._ontrack),this.removeEventListener("addstream",this._ontrackpoly)),this.addEventListener("track",this._ontrack=f),this.addEventListener("addstream",this._ontrackpoly=function(e){e.stream.addEventListener("addtrack",function(te){var event=new Event("track");event.track=te.track,event.receiver={track:te.track},event.streams=[e.stream],self.dispatchEvent(event);}),e.stream.getTracks().forEach(function(track){var event=new Event("track");event.track=track,event.receiver={track:track},event.streams=[e.stream],this.dispatchEvent(event);}.bind(this));}.bind(this));}});},shimSourceObject:function(){"object"==typeof window&&(!window.HTMLMediaElement||"srcObject"in window.HTMLMediaElement.prototype||Object.defineProperty(window.HTMLMediaElement.prototype,"srcObject",{get:function(){return this._srcObject},set:function(stream){var self=this;return this._srcObject=stream,this.src&&URL.revokeObjectURL(this.src),stream?(this.src=URL.createObjectURL(stream),stream.addEventListener("addtrack",function(){self.src&&URL.revokeObjectURL(self.src),self.src=URL.createObjectURL(stream);}),void stream.addEventListener("removetrack",function(){self.src&&URL.revokeObjectURL(self.src),self.src=URL.createObjectURL(stream);})):void(this.src="")}}));},shimPeerConnection:function(){window.RTCPeerConnection=function(pcConfig,pcConstraints){logging("PeerConnection"),pcConfig&&pcConfig.iceTransportPolicy&&(pcConfig.iceTransports=pcConfig.iceTransportPolicy);var pc=new webkitRTCPeerConnection(pcConfig,pcConstraints),origGetStats=pc.getStats.bind(pc);return pc.getStats=function(selector,successCallback,errorCallback){var self=this,args=arguments;if(arguments.length>0&&"function"==typeof selector)return origGetStats(selector,successCallback);var fixChromeStats_=function(response){var standardReport={},reports=response.result();return reports.forEach(function(report){var standardStats={id:report.id,timestamp:report.timestamp,type:report.type};report.names().forEach(function(name){standardStats[name]=report.stat(name);}),standardReport[standardStats.id]=standardStats;}),standardReport},makeMapStats=function(stats,legacyStats){var map=new Map(Object.keys(stats).map(function(key){return[key,stats[key]]}));return legacyStats=legacyStats||stats,Object.keys(legacyStats).forEach(function(key){map[key]=legacyStats[key];}),map};if(arguments.length>=2){var successCallbackWrapper_=function(response){args[1](makeMapStats(fixChromeStats_(response)));};return origGetStats.apply(this,[successCallbackWrapper_,arguments[0]])}return new Promise(function(resolve,reject){1===args.length&&"object"==typeof selector?origGetStats.apply(self,[function(response){resolve(makeMapStats(fixChromeStats_(response)));},reject]):origGetStats.apply(self,[function(response){resolve(makeMapStats(fixChromeStats_(response),response.result()));},reject]);}).then(successCallback,errorCallback)},pc},window.RTCPeerConnection.prototype=webkitRTCPeerConnection.prototype,webkitRTCPeerConnection.generateCertificate&&Object.defineProperty(window.RTCPeerConnection,"generateCertificate",{get:function(){return webkitRTCPeerConnection.generateCertificate}}),["createOffer","createAnswer"].forEach(function(method){var nativeMethod=webkitRTCPeerConnection.prototype[method];webkitRTCPeerConnection.prototype[method]=function(){var self=this;if(arguments.length<1||1===arguments.length&&"object"==typeof arguments[0]){var opts=1===arguments.length?arguments[0]:void 0;return new Promise(function(resolve,reject){nativeMethod.apply(self,[resolve,reject,opts]);})}return nativeMethod.apply(this,arguments)};}),browserDetails.version<51&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(method){var nativeMethod=webkitRTCPeerConnection.prototype[method];webkitRTCPeerConnection.prototype[method]=function(){var args=arguments,self=this,promise=new Promise(function(resolve,reject){nativeMethod.apply(self,[args[0],resolve,reject]);});return args.length<2?promise:promise.then(function(){args[1].apply(null,[]);},function(err){args.length>=3&&args[2].apply(null,[err]);})};}),["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(method){var nativeMethod=webkitRTCPeerConnection.prototype[method];webkitRTCPeerConnection.prototype[method]=function(){return arguments[0]=new("addIceCandidate"===method?RTCIceCandidate:RTCSessionDescription)(arguments[0]),nativeMethod.apply(this,arguments)};});var nativeAddIceCandidate=RTCPeerConnection.prototype.addIceCandidate;RTCPeerConnection.prototype.addIceCandidate=function(){return arguments[0]?nativeAddIceCandidate.apply(this,arguments):(arguments[1]&&arguments[1].apply(null),Promise.resolve())};}};module.exports={shimMediaStream:chromeShim.shimMediaStream,shimOnTrack:chromeShim.shimOnTrack,shimSourceObject:chromeShim.shimSourceObject,shimPeerConnection:chromeShim.shimPeerConnection,shimGetUserMedia:require("./getusermedia")};},{"../utils.js":8,"./getusermedia":4}],4:[function(require,module,exports){"use strict";var logging=require("../utils.js").log;module.exports=function(){var constraintsToChrome_=function(c){if("object"!=typeof c||c.mandatory||c.optional)return c;var cc={};return Object.keys(c).forEach(function(key){if("require"!==key&&"advanced"!==key&&"mediaSource"!==key){var r="object"==typeof c[key]?c[key]:{ideal:c[key]};void 0!==r.exact&&"number"==typeof r.exact&&(r.min=r.max=r.exact);var oldname_=function(prefix,name){return prefix?prefix+name.charAt(0).toUpperCase()+name.slice(1):"deviceId"===name?"sourceId":name};if(void 0!==r.ideal){cc.optional=cc.optional||[];var oc={};"number"==typeof r.ideal?(oc[oldname_("min",key)]=r.ideal,cc.optional.push(oc),oc={},oc[oldname_("max",key)]=r.ideal,cc.optional.push(oc)):(oc[oldname_("",key)]=r.ideal,cc.optional.push(oc));}void 0!==r.exact&&"number"!=typeof r.exact?(cc.mandatory=cc.mandatory||{},cc.mandatory[oldname_("",key)]=r.exact):["min","max"].forEach(function(mix){void 0!==r[mix]&&(cc.mandatory=cc.mandatory||{},cc.mandatory[oldname_(mix,key)]=r[mix]);});}}),c.advanced&&(cc.optional=(cc.optional||[]).concat(c.advanced)),cc},shimConstraints_=function(constraints,func){if(constraints=JSON.parse(JSON.stringify(constraints)),constraints&&constraints.audio&&(constraints.audio=constraintsToChrome_(constraints.audio)),constraints&&"object"==typeof constraints.video){var face=constraints.video.facingMode;if(face=face&&("object"==typeof face?face:{ideal:face}),face&&("user"===face.exact||"environment"===face.exact||"user"===face.ideal||"environment"===face.ideal)&&(!navigator.mediaDevices.getSupportedConstraints||!navigator.mediaDevices.getSupportedConstraints().facingMode)&&(delete constraints.video.facingMode,"environment"===face.exact||"environment"===face.ideal))return navigator.mediaDevices.enumerateDevices().then(function(devices){devices=devices.filter(function(d){return"videoinput"===d.kind});var back=devices.find(function(d){return d.label.toLowerCase().indexOf("back")!==-1})||devices.length&&devices[devices.length-1];return back&&(constraints.video.deviceId=face.exact?{exact:back.deviceId}:{ideal:back.deviceId}),constraints.video=constraintsToChrome_(constraints.video),logging("chrome: "+JSON.stringify(constraints)),func(constraints)});constraints.video=constraintsToChrome_(constraints.video);}return logging("chrome: "+JSON.stringify(constraints)),func(constraints)},shimError_=function(e){return{name:{PermissionDeniedError:"NotAllowedError",ConstraintNotSatisfiedError:"OverconstrainedError"}[e.name]||e.name,message:e.message,constraint:e.constraintName,toString:function(){return this.name+(this.message&&": ")+this.message}}},getUserMedia_=function(constraints,onSuccess,onError){shimConstraints_(constraints,function(c){navigator.webkitGetUserMedia(c,onSuccess,function(e){onError(shimError_(e));});});};navigator.getUserMedia=getUserMedia_;var getUserMediaPromise_=function(constraints){return new Promise(function(resolve,reject){navigator.getUserMedia(constraints,resolve,reject);})};if(navigator.mediaDevices||(navigator.mediaDevices={getUserMedia:getUserMediaPromise_,enumerateDevices:function(){return new Promise(function(resolve){var kinds={audio:"audioinput",video:"videoinput"};return MediaStreamTrack.getSources(function(devices){resolve(devices.map(function(device){return{label:device.label,kind:kinds[device.kind],deviceId:device.id,groupId:""}}));})})}}),navigator.mediaDevices.getUserMedia){var origGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=function(cs){return shimConstraints_(cs,function(c){return origGetUserMedia(c).then(function(stream){if(c.audio&&!stream.getAudioTracks().length||c.video&&!stream.getVideoTracks().length)throw stream.getTracks().forEach(function(track){track.stop();}),new DOMException("","NotFoundError");return stream},function(e){return Promise.reject(shimError_(e))})})};}else navigator.mediaDevices.getUserMedia=function(constraints){return getUserMediaPromise_(constraints)};"undefined"==typeof navigator.mediaDevices.addEventListener&&(navigator.mediaDevices.addEventListener=function(){logging("Dummy mediaDevices.addEventListener called.");}),"undefined"==typeof navigator.mediaDevices.removeEventListener&&(navigator.mediaDevices.removeEventListener=function(){logging("Dummy mediaDevices.removeEventListener called.");});};},{"../utils.js":8}],5:[function(require,module,exports){"use strict";var browserDetails=require("../utils").browserDetails,firefoxShim={shimOnTrack:function(){"object"!=typeof window||!window.RTCPeerConnection||"ontrack"in window.RTCPeerConnection.prototype||Object.defineProperty(window.RTCPeerConnection.prototype,"ontrack",{get:function(){return this._ontrack},set:function(f){this._ontrack&&(this.removeEventListener("track",this._ontrack),this.removeEventListener("addstream",this._ontrackpoly)),this.addEventListener("track",this._ontrack=f),this.addEventListener("addstream",this._ontrackpoly=function(e){e.stream.getTracks().forEach(function(track){var event=new Event("track");event.track=track,event.receiver={track:track},event.streams=[e.stream],this.dispatchEvent(event);}.bind(this));}.bind(this));}});},shimSourceObject:function(){"object"==typeof window&&(!window.HTMLMediaElement||"srcObject"in window.HTMLMediaElement.prototype||Object.defineProperty(window.HTMLMediaElement.prototype,"srcObject",{get:function(){return this.mozSrcObject},set:function(stream){this.mozSrcObject=stream;}}));},shimPeerConnection:function(){if("object"==typeof window&&(window.RTCPeerConnection||window.mozRTCPeerConnection)){window.RTCPeerConnection||(window.RTCPeerConnection=function(pcConfig,pcConstraints){if(browserDetails.version<38&&pcConfig&&pcConfig.iceServers){for(var newIceServers=[],i=0;i<pcConfig.iceServers.length;i++){var server=pcConfig.iceServers[i];if(server.hasOwnProperty("urls"))for(var j=0;j<server.urls.length;j++){var newServer={url:server.urls[j]};0===server.urls[j].indexOf("turn")&&(newServer.username=server.username,newServer.credential=server.credential),newIceServers.push(newServer);}else newIceServers.push(pcConfig.iceServers[i]);}pcConfig.iceServers=newIceServers;}return new mozRTCPeerConnection(pcConfig,pcConstraints)},window.RTCPeerConnection.prototype=mozRTCPeerConnection.prototype,mozRTCPeerConnection.generateCertificate&&Object.defineProperty(window.RTCPeerConnection,"generateCertificate",{get:function(){return mozRTCPeerConnection.generateCertificate}}),window.RTCSessionDescription=mozRTCSessionDescription,window.RTCIceCandidate=mozRTCIceCandidate),["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(method){var nativeMethod=RTCPeerConnection.prototype[method];RTCPeerConnection.prototype[method]=function(){return arguments[0]=new("addIceCandidate"===method?RTCIceCandidate:RTCSessionDescription)(arguments[0]),nativeMethod.apply(this,arguments)};});var nativeAddIceCandidate=RTCPeerConnection.prototype.addIceCandidate;if(RTCPeerConnection.prototype.addIceCandidate=function(){return arguments[0]?nativeAddIceCandidate.apply(this,arguments):(arguments[1]&&arguments[1].apply(null),Promise.resolve())},browserDetails.version<48){var makeMapStats=function(stats){var map=new Map;return Object.keys(stats).forEach(function(key){map.set(key,stats[key]),map[key]=stats[key];}),map},nativeGetStats=RTCPeerConnection.prototype.getStats;RTCPeerConnection.prototype.getStats=function(selector,onSucc,onErr){return nativeGetStats.apply(this,[selector||null]).then(function(stats){return makeMapStats(stats)}).then(onSucc,onErr)};}}}};module.exports={shimOnTrack:firefoxShim.shimOnTrack,shimSourceObject:firefoxShim.shimSourceObject,shimPeerConnection:firefoxShim.shimPeerConnection,shimGetUserMedia:require("./getusermedia")};},{"../utils":8,"./getusermedia":6}],6:[function(require,module,exports){"use strict";var logging=require("../utils").log,browserDetails=require("../utils").browserDetails;module.exports=function(){var shimError_=function(e){return{name:{SecurityError:"NotAllowedError",PermissionDeniedError:"NotAllowedError"}[e.name]||e.name,message:{"The operation is insecure.":"The request is not allowed by the user agent or the platform in the current context."}[e.message]||e.message,constraint:e.constraint,toString:function(){return this.name+(this.message&&": ")+this.message}}},getUserMedia_=function(constraints,onSuccess,onError){var constraintsToFF37_=function(c){if("object"!=typeof c||c.require)return c;var require=[];return Object.keys(c).forEach(function(key){if("require"!==key&&"advanced"!==key&&"mediaSource"!==key){var r=c[key]="object"==typeof c[key]?c[key]:{ideal:c[key]};if(void 0===r.min&&void 0===r.max&&void 0===r.exact||require.push(key),void 0!==r.exact&&("number"==typeof r.exact?r.min=r.max=r.exact:c[key]=r.exact,delete r.exact),void 0!==r.ideal){c.advanced=c.advanced||[];var oc={};"number"==typeof r.ideal?oc[key]={min:r.ideal,max:r.ideal}:oc[key]=r.ideal,c.advanced.push(oc),delete r.ideal,Object.keys(r).length||delete c[key];}}}),require.length&&(c.require=require),c};return constraints=JSON.parse(JSON.stringify(constraints)),browserDetails.version<38&&(logging("spec: "+JSON.stringify(constraints)),constraints.audio&&(constraints.audio=constraintsToFF37_(constraints.audio)),constraints.video&&(constraints.video=constraintsToFF37_(constraints.video)),logging("ff37: "+JSON.stringify(constraints))),navigator.mozGetUserMedia(constraints,onSuccess,function(e){onError(shimError_(e));})},getUserMediaPromise_=function(constraints){return new Promise(function(resolve,reject){getUserMedia_(constraints,resolve,reject);})};if(navigator.mediaDevices||(navigator.mediaDevices={getUserMedia:getUserMediaPromise_,addEventListener:function(){},removeEventListener:function(){}}),navigator.mediaDevices.enumerateDevices=navigator.mediaDevices.enumerateDevices||function(){return new Promise(function(resolve){var infos=[{kind:"audioinput",deviceId:"default",label:"",groupId:""},{kind:"videoinput",deviceId:"default",label:"",groupId:""}];resolve(infos);})},browserDetails.version<41){var orgEnumerateDevices=navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);navigator.mediaDevices.enumerateDevices=function(){return orgEnumerateDevices().then(void 0,function(e){if("NotFoundError"===e.name)return[];throw e})};}if(browserDetails.version<49){var origGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=function(c){return origGetUserMedia(c).then(function(stream){if(c.audio&&!stream.getAudioTracks().length||c.video&&!stream.getVideoTracks().length)throw stream.getTracks().forEach(function(track){track.stop();}),new DOMException("The object can not be found here.","NotFoundError");return stream},function(e){return Promise.reject(shimError_(e))})};}navigator.getUserMedia=function(constraints,onSuccess,onError){return browserDetails.version<44?getUserMedia_(constraints,onSuccess,onError):(console.warn("navigator.getUserMedia has been replaced by navigator.mediaDevices.getUserMedia"),void navigator.mediaDevices.getUserMedia(constraints).then(onSuccess,onError))};};},{"../utils":8}],7:[function(require,module,exports){"use strict";var safariShim={shimGetUserMedia:function(){navigator.getUserMedia=navigator.webkitGetUserMedia;}};module.exports={shimGetUserMedia:safariShim.shimGetUserMedia};},{}],8:[function(require,module,exports){"use strict";var logDisabled_=!0,utils={disableLog:function(bool){return"boolean"!=typeof bool?new Error("Argument type: "+typeof bool+". Please use a boolean."):(logDisabled_=bool,bool?"adapter.js logging disabled":"adapter.js logging enabled")},log:function(){if("object"==typeof window){if(logDisabled_)return;"undefined"!=typeof console&&"function"==typeof console.log&&console.log.apply(console,arguments);}},extractVersion:function(uastring,expr,pos){var match=uastring.match(expr);return match&&match.length>=pos&&parseInt(match[pos],10)},detectBrowser:function(){var result={};if(result.browser=null,result.version=null,"undefined"==typeof window||!window.navigator)return result.browser="Not a browser.",result;if(navigator.mozGetUserMedia)result.browser="firefox",result.version=this.extractVersion(navigator.userAgent,/Firefox\/([0-9]+)\./,1);else if(navigator.webkitGetUserMedia)if(window.webkitRTCPeerConnection)result.browser="chrome",result.version=this.extractVersion(navigator.userAgent,/Chrom(e|ium)\/([0-9]+)\./,2);else{if(!navigator.userAgent.match(/Version\/(\d+).(\d+)/))return result.browser="Unsupported webkit-based browser with GUM support but no WebRTC support.",result;result.browser="safari",result.version=this.extractVersion(navigator.userAgent,/AppleWebKit\/([0-9]+)\./,1);}else{if(!navigator.mediaDevices||!navigator.userAgent.match(/Edge\/(\d+).(\d+)$/))return result.browser="Not a supported browser.",result;result.browser="edge",result.version=this.extractVersion(navigator.userAgent,/Edge\/(\d+).(\d+)$/,2);}return result}};module.exports={log:utils.log,disableLog:utils.disableLog,browserDetails:utils.detectBrowser(),extractVersion:utils.extractVersion};},{}]},{},[2]);

const NodeCloseEvent = class CloseEvent {
  constructor (options = {}) {
    this.wasClean = options.wasClean;
    this.code = options.code;
    this.reason = options.reason;
  }
};

/**
 * Utility class contains some helper static methods.
 */
class Util {
  /**
   * Create `CloseEvent`.
   *
   * @param {number} code
   * @param {string} [reason=]
   * @param {boolean} [wasClean=true]
   *
   * @returns {CloseEvent|NodeCloseEvent}
   */
  static createCloseEvent (code, reason = '', wasClean = true) {
    const obj = {wasClean, code, reason};
    if (Util.isBrowser()) {
      return new CloseEvent('netfluxClose', obj)
    } else {
      return new NodeCloseEvent(obj)
    }
  }

  /**
   * Check execution environment.
   *
   * @returns {boolean} Description
   */
  static isBrowser () {
    if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
      return false
    }
    return true
  }

  /**
   * Check whether the channel is a socket.
   *
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {boolean}
   */
  static isSocket (channel) {
    return channel.constructor.name === 'WebSocket'
  }

  /**
   * Check whether the string is a valid URL.
   *
   * @param {string} str
   *
   * @returns {type} Description
   */
  static isURL (str) {
    let regex =
      '^' +
      // protocol identifier
      '(?:(?:wss|ws)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:';

    const tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))?';

    regex +=
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broacast addresses
        // (first & last IP address of each class)
        '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
        '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
        '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
        // host name
        '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
        // domain name
        '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
        tld +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' +
    '$';

    if (!(new RegExp(regex, 'i')).exec(str)) return false
    return true
  }

  static require (module) {
    try {
      return require(module)
    } catch (err) {
      console.error(`${module} could not be found: ${err}`);
      return undefined
    }
  }

  static get WEB_RTC_LIB () { return 1 }
  static get WEB_SOCKET_LIB () { return 2 }
  static get TEXT_ENCODING_LIB () { return 3 }
  static get EVENT_SOURCE_LIB () { return 4 }

  static requireLib (libConst) {
    switch (libConst) {
      case Util.WEB_RTC_LIB:
        return Util.isBrowser() ? window : Util.require('wrtc')
      case Util.WEB_SOCKET_LIB:
        return Util.isBrowser() ? window.WebSocket : Util.require('ws')
      case Util.TEXT_ENCODING_LIB:
        return Util.isBrowser() ? window : Util.require('text-encoding')
      case Util.EVENT_SOURCE_LIB:
        return Util.isBrowser() ? window : Util.require('eventsource')
      default:
        console.error(`${libConst} is unknown lib constant. See Util`);
        return undefined
    }
  }
}

const wrtc = Util.requireLib(Util.WEB_RTC_LIB);

const CONNECT_TIMEOUT = 30000;
const REMOVE_ITEM_TIMEOUT = 5000;

/**
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 */
class WebRTCService extends Service {

  /**
   * @param  {number} id Service identifier
   * @param  {RTCIceServer} iceServers WebRTC configuration object
   */
  constructor (id, iceServers) {
    super(id);
    /**
     * @private
     * @type {RTCIceServer}
     */
    this.iceServers = iceServers;
  }

  /**
   * @param {Channel} channel
   * @param {number} senderId
   * @param {number} recepientId
   * @param {Object} msg
   */
  onMessage (channel, senderId, recepientId, msg) {
    const wc = channel.webChannel;
    let item = super.getItem(wc, senderId);
    if (!item) {
      item = new CandidatesBuffer();
      super.setItem(wc, senderId, item);
    }
    if ('offer' in msg) {
      item.pc = this.createPeerConnection(candidate => {
        wc.sendInnerTo(senderId, this.id, {candidate});
      });
      this.listenOnDataChannel(item.pc, dataCh => {
        setTimeout(() => super.removeItem(wc, senderId), REMOVE_ITEM_TIMEOUT);
        ServiceFactory.get(CHANNEL_BUILDER).onChannel(wc, dataCh, senderId);
      });
      this.createAnswer(item.pc, msg.offer, item.candidates)
        .then(answer => wc.sendInnerTo(senderId, this.id, {answer}))
        .catch(err => console.error(`During Establishing dataChannel connection over webChannel: ${err.message}`));
    } if ('answer' in msg) {
      item.pc.setRemoteDescription(msg.answer)
        .then(() => item.pc.addReceivedCandidates(item.candidates))
        .catch(err => console.error(`Set answer (webChannel): ${err.message}`));
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
  connectOverWebChannel (wc, id) {
    const item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      wc.sendInnerTo(id, this.id, {candidate});
    }));
    super.setItem(wc, id, item);
    return new Promise((resolve, reject) => {
      setTimeout(reject, CONNECT_TIMEOUT, 'WebRTC connect timeout');
      this.createDataChannel(item.pc, dataCh => {
        setTimeout(() => super.removeItem(wc, id), REMOVE_ITEM_TIMEOUT);
        resolve(dataCh);
      });
      this.createOffer(item.pc)
        .then(offer => wc.sendInnerTo(id, this.id, {offer}))
        .catch(reject);
    })
  }

  /**
   *
   * @param {WebSocket} ws
   * @param {function(channel: RTCDataChannel)} onChannel
   *
   */
  listenFromSignaling (ws, onChannel) {
    ws.onmessage = evt => {
      const msg = JSON.parse(evt.data);
      if ('id' in msg && 'data' in msg) {
        let item = super.getItem(ws, msg.id);
        if (!item) {
          item = new CandidatesBuffer(this.createPeerConnection(candidate => {
            if (ws.readyState === 1) ws.send(JSON.stringify({id: msg.id, data: {candidate}}));
          }));
          super.setItem(ws, msg.id, item);
        }
        if ('offer' in msg.data) {
          this.listenOnDataChannel(item.pc, dataCh => {
            setTimeout(() => super.removeItem(ws, msg.id), REMOVE_ITEM_TIMEOUT);
            onChannel(dataCh);
          });
          this.createAnswer(item.pc, msg.data.offer, item.candidates)
            .then(answer => {
              ws.send(JSON.stringify({id: msg.id, data: {answer}}));
            })
            .catch(err => {
              console.error(`During establishing data channel connection through signaling: ${err.message}`);
            });
        } else if ('candidate' in msg.data) {
          this.addIceCandidate(item, msg.data.candidate);
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
  connectOverSignaling (ws, key) {
    const item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      if (ws.readyState === 1) ws.send(JSON.stringify({data: {candidate}}));
    }));
    super.setItem(ws, key, item);
    return new Promise((resolve, reject) => {
      ws.onclose = closeEvt => reject(closeEvt.reason);
      ws.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data);
          if ('data' in msg) {
            if ('answer' in msg.data) {
              item.pc.setRemoteDescription(msg.data.answer)
                .then(() => item.pc.addReceivedCandidates(item.candidates))
                .catch(err => reject(`Set answer (signaling): ${err.message}`));
            } else if ('candidate' in msg.data) {
              this.addIceCandidate(super.getItem(ws, key), msg.data.candidate);
            }
          }
        } catch (err) {
          reject(`Unknown message from the server ${ws.url}: ${evt.data}`);
        }
      };

      this.createDataChannel(item.pc, dataCh => {
        setTimeout(() => super.removeItem(ws, key), REMOVE_ITEM_TIMEOUT);
        resolve(dataCh);
      });
      this.createOffer(item.pc)
        .then(offer => ws.send(JSON.stringify({data: {offer}})))
        .catch(reject);
    })
  }

  /**
   * Creates an SDP offer.
   *
   * @private
   * @param  {RTCPeerConnection} pc
   * @return {Promise<RTCSessionDescription, string>} - Resolved when the offer has been succesfully created,
   * set as local description and sent to the peer.
   */
  createOffer (pc) {
    return pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        return {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        }
      })
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
  createAnswer (pc, offer, candidates) {
    return pc.setRemoteDescription(offer)
      .then(() => {
        pc.addReceivedCandidates(candidates);
        return pc.createAnswer()
      })
      .then(answer => pc.setLocalDescription(answer))
      .then(() => {
        return {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        }
      })
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
   *
   * @private
   * @param  {function(candidate: Object)} onCandidate
   * candidate event handler.
   * @return {RTCPeerConnection}
   */
  createPeerConnection (onCandidate) {
    const pc = new wrtc.RTCPeerConnection({iceServers: this.iceServers});
    pc.isRemoteDescriptionSet = false;
    pc.addReceivedCandidates = candidates => {
      pc.isRemoteDescriptionSet = true;
      for (let c of candidates) this.addIceCandidate({pc}, c);
    };
    pc.onicecandidate = evt => {
      if (evt.candidate !== null) {
        const candidate = {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        };
        onCandidate(candidate);
      }
    };
    return pc
  }

  /**
   *
   * @private
   * @param {RTCPeerConnection} pc
   * @param {function(dc: RTCDataChannel)} onOpen
   *
   */
  createDataChannel (pc, onOpen) {
    const dc = pc.createDataChannel(null);
    dc.onopen = evt => onOpen(dc);
    this.setUpOnDisconnect(pc, dc);
  }

  /**
   *
   * @private
   * @param {RTCPeerConnection} pc
   * @param {function(dc: RTCDataChannel)} onOpen
   *
   */
  listenOnDataChannel (pc, onOpen) {
    pc.ondatachannel = dcEvt => {
      this.setUpOnDisconnect(pc, dcEvt.channel);
      dcEvt.channel.onopen = evt => onOpen(dcEvt.channel);
    };
  }

  /**
   * @private
   * @param {RTCPeerConnection} pc
   * @param {RTCDataChannel} dataCh
   */
  setUpOnDisconnect (pc, dataCh) {
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        if (dataCh.onclose) dataCh.onclose(Util.createCloseEvent(4201, 'disconnected', false));
      }
    };
  }

  /**
   * @private
   * @param {CandidatesBuffer|null} obj
   * @param {string} candidate
   */
  addIceCandidate (obj, candidate) {
    if (obj !== null && obj.pc && obj.pc.isRemoteDescriptionSet) {
      obj.pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate))
        .catch(evt => console.error(`Add ICE candidate: ${evt.message}`));
    } else obj.candidates[obj.candidates.length] = candidate;
  }
}

/**
 * @private
 */
class CandidatesBuffer {
  constructor (pc = null, candidates = []) {
    this.pc = pc;
    this.candidates = candidates;
  }
}

const WebSocket = Util.requireLib(Util.WEB_SOCKET_LIB);

const CONNECT_TIMEOUT$1 = 2000;

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
class WebSocketService extends Service {

  /**
   * Creates WebSocket with server.
   *
   * @param {string} url - Server url
   * @returns {Promise<WebSocket, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url);
        ws.onopen = () => resolve(ws);
        // Timeout for node (otherwise it will loop forever if incorrect address)
        setTimeout(() => {
          if (ws.readyState !== ws.OPEN) {
            reject(`WebSocket connection timeout with ${url} within ${CONNECT_TIMEOUT$1}ms`);
          }
        }, CONNECT_TIMEOUT$1);
      } catch (err) {
        reject(err.message);
      }
    })
  }

}

const EventSource = Util.requireLib(Util.EVENT_SOURCE_LIB);

const CONNECT_TIMEOUT$2 = 2000;
const CLOSE_AFTER_RECONNECT_TIMEOUT = 6000;

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
class EventSourceService extends Service {

  /**
   * Creates EventSource object.
   *
   * @param {string} url - Server url
   * @returns {Promise<EventSource, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        let reconnectTimeout = null;
        const res = new RichEventSource(url);
        res.onerror = err => {
          reconnectTimeout = setTimeout(() => {
            res.close();
          }, CLOSE_AFTER_RECONNECT_TIMEOUT);
          reject(err.message);
        };
        res.onopen = () => {
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
        };
        res.addEventListener('auth', evtMsg => {
          this.auth = evtMsg.data;
          resolve(res);
        });
        // Timeout if "auth" event has not been received.
        setTimeout(() => {
          reject(`Authentication event has not been received from ${url} within ${CONNECT_TIMEOUT$2}ms`);
        }, CONNECT_TIMEOUT$2);
      } catch (err) {
        reject(err.message);
      }
    })
  }
}

class RichEventSource extends EventSource.constructor {

  constructor (url) {
    super(url);
    this.auth = '';
    this.onclose = () => {};
  }

  close () {
    this.onclose();
    super.close();
  }

  send (str) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', super.url, true);

    xhr.onload = function () {
      if (this.status !== 200) {
        this.onerror(new Error(this.statusText));
      }
    };

    xhr.onerror = err => this.onerror(new Error(err.message));
    xhr.send(`${this.auth}@${str}`);
  }
}

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketService` and `WebRTCService`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
class ChannelBuilderService extends Service {

  /**
   * @param {number} id Service identifier
   */
  constructor (id) {
    super(id);
    /**
     * @private
     */
    this.WS = [WEB_SOCKET];
    /**
     * @private
     */
    this.WR = [WEB_RTC];
    /**
     * @private
     */
    this.WS_WR = [WEB_SOCKET, WEB_RTC];
    /**
     * @private
     */
    this.WR_WS = [WEB_RTC, WEB_SOCKET];
  }

  /**
   * Establish a channel with the peer identified by `id`.
   *
   * @param {WebChannel} wc
   * @param {number} id
   *
   * @returns {Promise<Channel, string>}
   */
  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      super.setPendingRequest(wc, id, {resolve, reject});
      wc.sendInnerTo(id, this.id, this.availableConnectors(wc));
    })
  }

  /**
   * @param {WebChannel} wc
   *
   * @returns {{listenOn: string, connectors: number[]}}
   */
  availableConnectors (wc) {
    const res = {};
    const connectors = [];
    if (Util.requireLib(Util.WEB_RTC_LIB) !== undefined) {
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
    return res
  }

  /**
   * @param {WebChannel} wc
   * @param {WebSocket|RTCDataChannel} channel
   * @param {number} senderId
   */
  onChannel (wc, channel, senderId) {
    wc.initChannel(channel, senderId)
      .then(channel => {
        const pendReq = super.getPendingRequest(wc, senderId);
        if (pendReq !== null) pendReq.resolve(channel);
      });
  }

  /**
   * @param {Channel} channel
   * @param {number} senderId
   * @param {number} recepientId
   * @param {Object} msg
   */
  onMessage (channel, senderId, recepientId, msg) {
    const wc = channel.webChannel;
    const myConnectObj = this.availableConnectors(wc);
    const myConnectors = myConnectObj.connectors;

    if ('failedReason' in msg) {
      super.getPendingRequest(wc, senderId).reject(msg.failedReason);
    } else if ('shouldConnect' in msg) {
      if (this.isEqual(msg.shouldConnect, this.WS)) {
        ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
          .then(channel => {
            channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
            this.onChannel(wc, channel, senderId);
          })
          .catch(reason => {
            super.getPendingRequest(wc, senderId).reject(`Failed to establish a socket: ${reason}`);
          });
      } else if (this.isEqual(msg.shouldConnect, this.WS_WR)) {
        ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
          .then(channel => {
            channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
            this.onChannel(wc, channel, senderId);
          })
          .catch(reason => ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId))
          .then(channel => this.onChannel(wc, channel, senderId))
          .catch(reason => {
            if ('feedbackOnFail' in msg && msg.feedbackOnFail === true) {
              wc.sendInnerTo(senderId, this.id, {tryOn: this.WS, listenOn: myConnectObj.listenOn});
            } else {
              super.getPendingRequest(wc, senderId).reject(`Failed to establish a socket and then a data channel: ${reason}`);
            }
          });
      }
    } else if ('tryOn' in msg && this.isEqual(msg.tryOn, this.WS)) {
      ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
        .then(channel => {
          channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
          this.onChannel(wc, channel, senderId);
        })
        .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a socket: ${reason}`}));
    } else if ('connectors' in msg) {
      if (!this.isValid(msg.connectors)) {
        wc.sendInnerTo(senderId, this.id, {failedReason: `Unknown connectors: ${msg.connectors}`});
      } else {
        // []
        if (msg.connectors.length === 0) {
          if (myConnectors.length === 0 || this.isEqual(myConnectors, this.WS)) {
            wc.sendInnerTo(senderId, this.id, {failedReason: 'No common connectors'});
          } else {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn});
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
            wc.sendInnerTo(senderId, this.id, {failedReason: 'No common connectors'});
          } else if (this.isEqual(myConnectors, this.WS)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn});
          } else if (this.isEqual(myConnectors, this.WR)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                wc.sendInnerTo(senderId, this.id, {failedReason: `Failed establish a data channel: ${reason}`});
              });
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn});
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => {
                wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn});
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
            ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
                this.onChannel(wc, channel, senderId);
              })
              .catch(reason => ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId))
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a socket and then a data channel: ${reason}`}));
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
                this.onChannel(wc, channel, senderId);
              });
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, listenOn: myConnectObj.listenOn});
          } else {
            ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn)
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
                this.onChannel(wc, channel, senderId);
              })
              .catch(reason => ServiceFactory.get(WEB_RTC, wc.settings.iceServers).connectOverWebChannel(wc, senderId))
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn}));
          }
        }

        // [wr, ws]
        if (this.isEqual(msg.connectors, this.WR_WS)) {
          if (myConnectors.length === 0) {
            this.ws(wc, senderId, msg.listenOn);
          } else if (this.isEqual(myConnectors, this.WS)) {
            this.wsWs(wc, senderId, msg.listenOn, myConnectObj.listenOn);
          } else if (this.isEqual(myConnectors, this.WR)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers)
              .connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn))
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
                this.onChannel(wc, channel, senderId);
              })
              .catch(reason => wc.sendInnerTo(senderId, this.id, {failedReason: `Failed to establish a data channel and then a socket: ${reason}`}));
          } else if (this.isEqual(myConnectors, this.WS_WR)) {
            wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS_WR, feedbackOnFail: true, listenOn: myConnectObj.listenOn});
          } else if (this.isEqual(myConnectors, this.WR_WS)) {
            ServiceFactory.get(WEB_RTC, wc.settings.iceServers)
              .connectOverWebChannel(wc, senderId)
              .then(channel => this.onChannel(wc, channel, senderId))
              .catch(reason => ServiceFactory.get(WEB_SOCKET).connect(msg.listenOn))
              .then(channel => {
                channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
                this.onChannel(wc, channel, senderId);
              })
              .catch(reason => wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myConnectObj.listenOn}));
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
  wsWs (wc, senderId, peerWsURL, myWsURL) {
    ServiceFactory.get(WEB_SOCKET).connect(peerWsURL)
      .then(channel => {
        channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
        this.onChannel(wc, channel, senderId);
      })
      .catch(reason => {
        wc.sendInnerTo(senderId, this.id, {shouldConnect: this.WS, listenOn: myWsURL});
      });
  }

  /**
   * @private
   * @param {WebChannel} wc
   * @param {number} senderId
   * @param {string} peerWsURL
   */
  ws (wc, senderId, peerWsURL) {
    ServiceFactory.get(WEB_SOCKET).connect(peerWsURL)
      .then(channel => {
        channel.send(JSON.stringify({wcId: wc.id, senderId: wc.myId}));
        this.onChannel(wc, channel, senderId);
      })
      .catch(reason => {
        wc.sendInnerTo(senderId, this.id, {
          failedReason: `Failed to establish a socket: ${reason}`
        });
      });
  }

  /**
   * @private
   * @param {number[]} connectors
   *
   * @returns {boolean}
   */
  isValid (connectors) {
    if (this.isEqual(connectors, this.WS) ||
      this.isEqual(connectors, this.WR) ||
      this.isEqual(connectors, this.WS_WR) ||
      this.isEqual(connectors, this.WR_WS)
    ) return true
    return false
  }

  /**
   * @private
   * @param {number[]} arr1
   * @param {number[]} arr2
   *
   * @returns {type} Description
   */
  isEqual (arr1, arr2) {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }
    return true
  }

}

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
class Channel {
  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   * @param {WebSocket|RTCDataChannel} channel Data channel or web socket
   * @param {WebChannel} webChannel The `WebChannel` this channel will be part of
   * @param {number} peerId Identifier of the peer who is at the other end of
   * this channel
   */
  constructor (channel, webChannel, peerId) {
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
  sendBrowser (data) {
    // if (this.channel.readyState !== 'closed' && new Int8Array(data).length !== 0) {
    if (this.isOpen()) {
      try {
        this.channel.send(data);
      } catch (err) {
        console.error(`Channel send: ${err.message}`);
      }
    }
  }

  /**
   * @private
   * @param {ArrayBuffer} data
   */
  sendInNodeThroughSocket (data) {
    if (this.isOpen()) {
      try {
        this.channel.send(data, {binary: true});
      } catch (err) {
        console.error(`Channel send: ${err.message}`);
      }
    }
  }

  /**
   * @private
   * @param {ArrayBuffer} data
   */
  sendInNodeThroughDataChannel (data) {
    this.sendBrowser(data.slice(0));
  }

  /**
   * @param {function(msg: ArrayBuffer)} handler
   */
  set onMessage (handler) {
    if (!Util.isBrowser() && Util.isSocket(this.channel)) {
      this.channel.onmessage = msgEvt => {
        handler(new Uint8Array(msgEvt.data).buffer);
      };
    } else this.channel.onmessage = msgEvt => handler(msgEvt.data);
  }

  /**
   * @param {function(message: CloseEvent)} handler
   */
  set onClose (handler) {
    this.channel.onclose = closeEvt => {
      if (this.webChannel !== null && handler(closeEvt)) {
        this.webChannel.members.splice(this.webChannel.members.indexOf(this.peerId), 1);
        this.webChannel.onPeerLeave(this.peerId);
      } else handler(closeEvt);
    };
  }

  /**
   * @param {function(message: Event)} handler
   */
  set onError (handler) {
    this.channel.onerror = evt => handler(evt);
  }

  /**
   */
  clearHandlers () {
    this.onMessage = () => {};
    this.onClose = () => {};
    this.onError = () => {};
  }

  /**
   * @returns {boolean}
   */
  isOpen () {
    const state = this.channel.readyState;
    return state === 1 || state === 'open'
  }

  /**
   * Close the channel.
   */
  close () {
    this.channel.close();
  }
}

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
class SignalingGate {

  /**
   * @param {WebChannel} wc
   */
  constructor (wc) {
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
     * Web socket with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket}
     */
    this.ws = null;
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {function(ch: RTCDataChannel)} onChannel
   * @param {string} key
   * @returns {Promise<OpenData, string>}
   */
  open (url, onChannel, key = null) {
    return new Promise((resolve, reject) => {
      if (key === null) key = this.generateKey();
      ServiceFactory.get(WEB_SOCKET).connect(url)
        .then(ws => {
          ws.onclose = closeEvt => {
            this.key = null;
            this.ws = null;
            this.url = null;
            this.webChannel.onClose(closeEvt);
            reject(closeEvt.reason);
          };
          ws.onerror = err => reject(err.message);
          ws.onmessage = evt => {
            try {
              const msg = JSON.parse(evt.data);
              if ('isKeyOk' in msg) {
                if (msg.isKeyOk) {
                  ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
                    .listenFromSignaling(ws, onChannel);
                  this.ws = ws;
                  this.key = key;
                  this.url = url;
                  resolve({url, key});
                } else reject(`${key} key already exists`);
              } else reject(`Unknown message from ${url}: ${evt.data}`);
            } catch (err) {
              reject('Server responce is not a JSON string: ' + err.message);
            }
          };
          ws.send(JSON.stringify({open: key}));
        })
        .catch(reject);
    })
  }

  /**
   * Check if the door is opened or closed.
   *
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.ws !== null && this.ws.readyState === this.ws.OPEN
  }

  /**
   * Get open data.
   *
   * @returns {OpenData|null} Open data if the door is open and null otherwise
   */
  getOpenData () {
    if (this.isOpen()) {
      return {
        url: this.url,
        key: this.key
      }
    }
    return null
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.ws.close();
    }
  }

  /**
   * Generate random key which will be used to join the `WebChannel`.
   *
   * @private
   * @returns {string} - Generated key
   */
  generateKey () {
    const MIN_LENGTH = 5;
    const DELTA_LENGTH = 0;
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * (MASK.length - 1))];
    }
    return result
  }
}

/**
 * Maximum identifier number for {@link WebChannel#generateId} function.
 * @type {number}
 */
const MAX_ID = 2147483647;

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000;

const ID_TIMEOUT = 10000;

/**
 * One of the internal message type. It's a peer message.
 * @ignore
 * @type {number}
 */
const USER_DATA = 1;

/**
 * One of the internal message type. This message should be threated by a
 * specific service class.
 * @type {number}
 */
const INNER_DATA = 2;

const INITIALIZATION = 3;

/**
 * One of the internal message type. Ping message.
 * @type {number}
 */
const PING = 4;

/**
 * One of the internal message type. Pong message, response to the ping message.
 * @type {number}
 */
const PONG = 5;

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */
class WebChannel {

  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  constructor (settings) {
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
    this.onJoin = () => {};

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
    this.pingFinish = () => {};

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
    this.gate = new SignalingGate(this);

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
    this.onPeerJoin = () => {};

    /**
     * Is the event handler called when a peer hes left the `WebChannel`.
     * @type {function(id: number)}
     */
    this.onPeerLeave = () => {};

    /**
     * Is the event handler called when a message is available on the `WebChannel`.
     * @type {function(id: number, msg: UserMessage, isBroadcast: boolean)}
     */
    this.onMessage = () => {};

    /**
     * Is the event handler called when the `WebChannel` has been closed.
     * @type {function(closeEvt: CloseEvent)}
     */
    this.onClose = () => {};
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string|WebSocket} keyOrSocket The key provided by one of the `WebChannel` members or a socket
   * @param  {string} [url=this.settings.signalingURL] Server URL
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */
  join (keyOrSocket, url = this.settings.signalingURL) {
    return new Promise((resolve, reject) => {
      this.onJoin = resolve;
      if (keyOrSocket.constructor.name !== 'WebSocket') {
        if (Util.isURL(url)) {
          ServiceFactory.get(WEB_SOCKET).connect(url)
            .then(ws => {
              ws.onclose = closeEvt => reject(closeEvt.reason);
              ws.onmessage = evt => {
                try {
                  const msg = JSON.parse(evt.data);
                  if ('isKeyOk' in msg) {
                    if (msg.isKeyOk) {
                      if ('useThis' in msg && msg.useThis) {
                        this.initChannel(ws).catch(reject);
                      } else {
                        ServiceFactory.get(WEB_RTC, this.settings.iceServers).connectOverSignaling(ws, keyOrSocket)
                          .then(channel => {
                            ws.onclose = null;
                            ws.close();
                            return this.initChannel(channel)
                          })
                          .catch(reject);
                      }
                    } else reject(`The key "${keyOrSocket}" was not found`);
                  } else reject(`Unknown message from the server ${url}: ${evt.data}`);
                } catch (err) { reject(err.message); }
              };
              ws.send(JSON.stringify({join: keyOrSocket}));
            })
            .catch(reject);
        } else reject(`${url} is not a valid URL`);
      } else {
        this.initChannel(keyOrSocket).catch(reject);
      }
    })
  }

  /**
   * Invite a peer to join the `WebChannel`.
   *
   * @param {string|WebSocket} keyOrSocket
   *
   * @returns {Promise<undefined,string>}
   */
  invite (keyOrSocket) {
    if (typeof keyOrSocket === 'string' || keyOrSocket instanceof String) {
      if (!Util.isURL(keyOrSocket)) {
        return Promise.reject(`${keyOrSocket} is not a valid URL`)
      }
      return ServiceFactory.get(WEB_SOCKET).connect(keyOrSocket)
        .then(ws => {
          ws.send(JSON.stringify({wcId: this.id}));
          return this.addChannel(ws)
        })
    } else if (keyOrSocket.constructor.name === 'WebSocket') {
      return this.addChannel(keyOrSocket)
    } else {
      return Promise.reject(`${keyOrSocket} is not a valid URL`)
    }
  }

  /**
   * Enable other peers to join the `WebChannel` with your help as an
   * intermediary peer.
   * @param  {Object} [options] Any available connection service options
   * @returns {Promise} It is resolved once the `WebChannel` is open. The
   * callback function take a parameter of type {@link SignalingGate~AccessData}.
   */
  open (options) {
    const defaultSettings = {
      url: this.settings.signalingURL,
      key: null
    };
    const settings = Object.assign({}, defaultSettings, options);
    if (Util.isURL(settings.url)) {
      return this.gate.open(settings.url, dataCh => this.addChannel(dataCh), settings.key)
    } else {
      return Promise.reject(`${settings.url} is not a valid URL`)
    }
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  close () {
    this.gate.close();
  }

  /**
   * If the `WebChannel` is open, the clients can join it through you, otherwise
   * it is not possible.
   * @returns {boolean} True if the `WebChannel` is open, false otherwise
   */
  isOpen () {
    return this.gate.isOpen()
  }

  /**
   * Get the data allowing to join the `WebChannel`. It is the same data which
   * {@link WebChannel#open} callback function provides.
   * @returns {OpenData|null} - Data to join the `WebChannel` or null is the `WebChannel` is closed
   */
  getOpenData () {
    return this.gate.getOpenData()
  }

  /**
   * Leave the `WebChannel`. No longer can receive and send messages to the group.
   */
  leave () {
    if (this.channels.size !== 0) {
      this.members = [];
      this.pingTime = 0;
      // this.gate.close()
      this.manager.leave(this);
    }
  }

  /**
   * Send the message to all `WebChannel` members.
   * @param  {UserMessage} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      this.msgBld.handleUserMessage(data, this.myId, null, dataChunk => {
        this.manager.broadcast(this, dataChunk);
      });
    }
  }

  /**
   * Send the message to a particular peer in the `WebChannel`.
   * @param  {number} id - Id of the recipient peer
   * @param  {UserMessage} data - Message
   */
  sendTo (id, data) {
    if (this.channels.size !== 0) {
      this.msgBld.handleUserMessage(data, this.myId, id, dataChunk => {
        this.manager.sendTo(id, this, dataChunk);
      }, false);
    }
  }

  /**
   * Get the ping of the `WebChannel`. It is an amount in milliseconds which
   * corresponds to the longest ping to each `WebChannel` member.
   * @returns {Promise}
   */
  ping () {
    if (this.members.length !== 0 && this.pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this.pingTime === 0) {
          this.pingTime = Date.now();
          this.maxTime = 0;
          this.pongNb = 0;
          this.pingFinish = delay => resolve(delay);
          this.manager.broadcast(this, this.msgBld.msg(PING, this.myId));
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT);
        }
      })
    } else return Promise.resolve(0)
  }

  /**
   * @private
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {Promise<undefined,string>}
   */
  addChannel (channel) {
    return this.initChannel(channel)
      .then(channel => {
        const msg = this.msgBld.msg(INITIALIZATION, this.myId, channel.peerId, {
          manager: this.manager.id,
          wcId: this.id
        });
        channel.send(msg);
        return this.manager.add(channel)
      })
  }

  /**
   * @private
   * @param {number} peerId
   */
  onPeerJoin$ (peerId) {
    this.members[this.members.length] = peerId;
    this.onPeerJoin(peerId);
  }

  /**
   * @private
   * @param {number} peerId
   */
  onPeerLeave$ (peerId) {
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
  sendInnerTo (recepient, serviceId, data, forward = false) {
    if (forward) {
      this.manager.sendInnerTo(recepient, this, data);
    } else {
      if (Number.isInteger(recepient)) {
        const msg = this.msgBld.msg(INNER_DATA, this.myId, recepient, {serviceId, data});
        this.manager.sendInnerTo(recepient, this, msg);
      } else {
        recepient.send(this.msgBld.msg(INNER_DATA, this.myId, recepient.peerId, {serviceId, data}));
      }
    }
  }

  /**
   * @private
   * @param {number} serviceId
   * @param {Object} data
   */
  sendInner (serviceId, data) {
    this.manager.sendInner(this, this.msgBld.msg(INNER_DATA, this.myId, null, {serviceId, data}));
  }

  /**
   * Message event handler (`WebChannel` mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} data - Message
   */
  onChannelMessage (channel, data) {
    const header = this.msgBld.readHeader(data);
    if (header.code === USER_DATA) {
      this.msgBld.readUserMessage(this, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast);
      });
    } else {
      const msg = this.msgBld.readInternalMessage(data);
      switch (header.code) {
        case INITIALIZATION: {
          this.settings.topology = msg.manager;
          this.manager = ServiceFactory.get(this.settings.topology);
          this.myId = header.recepientId;
          this.id = msg.wcId;
          channel.peerId = header.senderId;
          break
        }
        case INNER_DATA: {
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            this.getService(msg.serviceId).onMessage(
              channel,
              header.senderId,
              header.recepientId,
              msg.data
            );
          } else this.sendInnerTo(header.recepientId, null, data, true);
          break
        }
        case PING:
          this.manager.sendTo(header.senderId, this, this.msgBld.msg(PONG, this.myId));
          break
        case PONG: {
          const now = Date.now();
          this.pongNb++;
          this.maxTime = Math.max(this.maxTime, now - this.pingTime);
          if (this.pongNb === this.members.length) {
            this.pingFinish(this.maxTime);
            this.pingTime = 0;
          }
          break
        }
        default:
          throw new Error(`Unknown message type code: "${header.code}"`)
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
  initChannel (ch, id = -1) {
    if (id === -1) id = this.generateId();
    const channel = new Channel(ch);
    channel.peerId = id;
    channel.webChannel = this;
    channel.onMessage = data => this.onChannelMessage(channel, data);
    channel.onClose = closeEvt => this.manager.onChannelClose(closeEvt, channel);
    channel.onError = evt => this.manager.onChannelError(evt, channel);
    return Promise.resolve(channel)
  }

  /**
   * @private
   * @param {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id
   *
   * @returns {Service}
   */
  getService (id) {
    if (id === WEB_RTC) {
      return ServiceFactory.get(WEB_RTC, this.settings.iceServers)
    }
    return ServiceFactory.get(id)
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   * @private
   * @returns {number} - Generated id
   */
  generateId () {
    do {
      const id = Math.ceil(Math.random() * MAX_ID);
      if (id === this.myId) continue
      if (this.members.includes(id)) continue
      if (this.generatedIds.has(id)) continue
      this.generatedIds.add(id);
      setTimeout(() => this.generatedIds.delete(id), ID_TIMEOUT);
      return id
    } while (true)
  }
}

const ted = Util.requireLib(Util.TEXT_ENCODING_LIB);

/**
 * Maximum size of the user message sent over `Channel`. Is meant without metadata.
 * @type {number}
 */
const MAX_USER_MSG_SIZE = 16365;

/**
 * User message offset in the array buffer. All data before are metadata.
 * @type {number}
 */
const USER_MSG_OFFSET = 19;

/**
 * First index in the array buffer after header (which is the part of metadata).
 * @type {number}
 */
const HEADER_OFFSET = 9;

/**
 * Maximum message id number.
 * @type {number}
 */
const MAX_MSG_ID_SIZE = 65535;

/**
 * User allowed message type: {@link ArrayBuffer}
 * @type {number}
 */
const ARRAY_BUFFER_TYPE = 1;

/**
 * User allowed message type: {@link external:Uint8Array}
 * @type {number}
 */
const U_INT_8_ARRAY_TYPE = 2;

/**
 * User allowed message type: {@link external:String}
 * @type {number}
 */
const STRING_TYPE = 3;

/**
 * User allowed message type: {@link external:Int8Array}
 * @type {number}
 */
const INT_8_ARRAY_TYPE = 4;

/**
 * User allowed message type: {@link external:Uint8ClampedArray}
 * @type {number}
 */
const U_INT_8_CLAMPED_ARRAY_TYPE = 5;

/**
 * User allowed message type: {@link external:Int16Array}
 * @type {number}
 */
const INT_16_ARRAY_TYPE = 6;

/**
 * User allowed message type: {@link external:Uint16Array}
 * @type {number}
 */
const U_INT_16_ARRAY_TYPE = 7;

/**
 * User allowed message type: {@link external:Int32Array}
 * @type {number}
 */
const INT_32_ARRAY_TYPE = 8;

/**
 * User allowed message type: {@link external:Uint32Array}
 * @type {number}
 */
const U_INT_32_ARRAY_TYPE = 9;

/**
 * User allowed message type: {@link external:Float32Array}
 * @type {number}
 */
const FLOAT_32_ARRAY_TYPE = 10;

/**
 * User allowed message type: {@link external:Float64Array}
 * @type {number}
 */
const FLOAT_64_ARRAY_TYPE = 11;

/**
 * Buffer for big user messages.
 */
const buffers = new WeakMap();

/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */
class MessageBuilderService extends Service {

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
  handleUserMessage (data, senderId, recipientId, action, isBroadcast = true) {
    const workingData = this.userDataToType(data);
    const dataUint8Array = workingData.content;
    if (dataUint8Array.byteLength <= MAX_USER_MSG_SIZE) {
      const dataView = this.initHeader(1, senderId, recipientId,
        dataUint8Array.byteLength + USER_MSG_OFFSET
      );
      dataView.setUint32(HEADER_OFFSET, dataUint8Array.byteLength);
      dataView.setUint8(13, workingData.type);
      dataView.setUint8(14, isBroadcast ? 1 : 0);
      const resultUint8Array = new Uint8Array(dataView.buffer);
      resultUint8Array.set(dataUint8Array, USER_MSG_OFFSET);
      action(resultUint8Array.buffer);
    } else {
      const msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE);
      const totalChunksNb = Math.ceil(dataUint8Array.byteLength / MAX_USER_MSG_SIZE);
      for (let chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
        const currentChunkMsgByteLength = Math.min(
          MAX_USER_MSG_SIZE,
          dataUint8Array.byteLength - MAX_USER_MSG_SIZE * chunkNb
        );
        const dataView = this.initHeader(
          USER_DATA,
          senderId,
          recipientId,
          USER_MSG_OFFSET + currentChunkMsgByteLength
        );
        dataView.setUint32(9, dataUint8Array.byteLength);
        dataView.setUint8(13, workingData.type);
        dataView.setUint8(14, isBroadcast ? 1 : 0);
        dataView.setUint16(15, msgId);
        dataView.setUint16(17, chunkNb);
        const resultUint8Array = new Uint8Array(dataView.buffer);
        let j = USER_MSG_OFFSET;
        const startIndex = MAX_USER_MSG_SIZE * chunkNb;
        const endIndex = startIndex + currentChunkMsgByteLength;
        for (let i = startIndex; i < endIndex; i++) {
          resultUint8Array[j++] = dataUint8Array[i];
        }
        action(resultUint8Array.buffer);
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
  msg (code, senderId = null, recepientId = null, data = {}) {
    const msgEncoded = (new ted.TextEncoder()).encode(JSON.stringify(data));
    const msgSize = msgEncoded.byteLength + HEADER_OFFSET;
    const dataView = this.initHeader(code, senderId, recepientId, msgSize);
    const fullMsg = new Uint8Array(dataView.buffer);
    fullMsg.set(msgEncoded, HEADER_OFFSET);
    return fullMsg.buffer
  }

  /**
   * Read user message which was prepared by another peer with
   * {@link MessageBuilderService#handleUserMessage} and sent.
   * @param {WebChannel} wc WebChannel
   * @param {number} senderId Id of the peer who sent this message
   * @param {ArrayBuffer} data Message
   * @param {function(msg: UserMessage, isBroadcast: boolean)} action Callback when the message is ready
   */
  readUserMessage (wc, senderId, data, action) {
    const dataView = new DataView(data);
    const msgSize = dataView.getUint32(HEADER_OFFSET);
    const dataType = dataView.getUint8(13);
    const isBroadcast = dataView.getUint8(14);
    if (msgSize > MAX_USER_MSG_SIZE) {
      const msgId = dataView.getUint16(15);
      const chunk = dataView.getUint16(17);
      const buffer = this.getBuffer(wc, senderId, msgId);
      if (buffer === undefined) {
        this.setBuffer(wc, senderId, msgId,
          new Buffer(msgSize, data, chunk, fullData => {
            action(this.extractUserData(fullData, dataType), isBroadcast);
          })
        );
      } else {
        buffer.add(data, chunk);
      }
    } else {
      const dataArray = new Uint8Array(data);
      const userData = new Uint8Array(data.byteLength - USER_MSG_OFFSET);
      let j = USER_MSG_OFFSET;
      for (let i = 0; i < userData.byteLength; i++) {
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
  readInternalMessage (data) {
    const uInt8Array = new Uint8Array(data);
    return JSON.parse((new ted.TextDecoder())
      .decode(uInt8Array.subarray(HEADER_OFFSET, uInt8Array.byteLength))
    )
  }

  /**
   * Extract header from the message. Each user message has a header which is
   * a part of the message metadata.
   * @param {ArrayBuffer} data Whole message
   * @returns {MessageHeader}
   */
  readHeader (data) {
    const dataView = new DataView(data);
    return {
      code: dataView.getUint8(0),
      senderId: dataView.getUint32(1),
      recepientId: dataView.getUint32(5)
    }
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
  initHeader (code, senderId, recipientId, dataSize) {
    const dataView = new DataView(new ArrayBuffer(dataSize));
    dataView.setUint8(0, code);
    dataView.setUint32(1, senderId);
    dataView.setUint32(5, recipientId);
    return dataView
  }

  /**
   * Netflux sends data in `ArrayBuffer`, but the user can send data in different
   * types. This function retrieve the inital message sent by the user.
   * @private
   * @param {ArrayBuffer} buffer Message as it was received by the `WebChannel`
   * @param {MessageTypeEnum} type Message type as it was defined by the user
   * @returns {ArrayBuffer|TypedArray} Initial user message
   */
  extractUserData (buffer, type) {
    switch (type) {
      case ARRAY_BUFFER_TYPE:
        return buffer
      case U_INT_8_ARRAY_TYPE:
        return new Uint8Array(buffer)
      case STRING_TYPE:
        return new ted.TextDecoder().decode(new Uint8Array(buffer))
      case INT_8_ARRAY_TYPE:
        return new Int8Array(buffer)
      case U_INT_8_CLAMPED_ARRAY_TYPE:
        return new Uint8ClampedArray(buffer)
      case INT_16_ARRAY_TYPE:
        return new Int16Array(buffer)
      case U_INT_16_ARRAY_TYPE:
        return new Uint16Array(buffer)
      case INT_32_ARRAY_TYPE:
        return new Int32Array(buffer)
      case U_INT_32_ARRAY_TYPE:
        return new Uint32Array(buffer)
      case FLOAT_32_ARRAY_TYPE:
        return new Float32Array(buffer)
      case FLOAT_64_ARRAY_TYPE:
        return new Float64Array(buffer)
      default:
        throw new Error('Unknown type')
    }
  }

  /**
   * Identify the user message type.
   *
   * @private
   * @param {UserMessage} data User message
   * @returns {MessageTypeEnum} User message type
   */
  userDataToType (data) {
    const result = {};
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
        throw new Error('Unknown data object')
      }
    }
    return result
  }

  /**
   * Get the buffer.
   * @private
   * @param {WebChannel} wc WebChannel
   * @param {number} peerId Peer id
   * @param {number} msgId Message id
   * @returns {Buffer|undefined} Returns buffer if it was found and undefined if not
   */
  getBuffer (wc, peerId, msgId) {
    const wcBuffer = buffers.get(wc);
    if (wcBuffer !== undefined) {
      const peerBuffer = wcBuffer.get(peerId);
      if (peerBuffer !== undefined) {
        return peerBuffer.get(msgId)
      }
    }
    return undefined
  }

  /**
   * Add a new buffer to the buffer array.
   * @private
   * @param {WebChannel} wc WebChannel
   * @param {number} peerId Peer id
   * @param {number} msgId Message id
   * @param {Buffer} buffer
   */
  setBuffer (wc, peerId, msgId, buffer) {
    let wcBuffer = buffers.get(wc);
    if (wcBuffer === undefined) {
      wcBuffer = new Map();
      buffers.set(wc, wcBuffer);
    }
    let peerBuffer = wcBuffer.get(peerId);
    if (peerBuffer === undefined) {
      peerBuffer = new Map();
      wcBuffer.set(peerId, peerBuffer);
    }
    peerBuffer.set(msgId, buffer);
  }
}

/**
 * Buffer class used when the user message exceeds the message size limit which
 * may be sent over a `Channel`. Each buffer is identified by `WebChannel` id,
 * peer id (who sends the big message) and message id (in case if the peer sends
 * more then 1 big message at a time).
 * @private
 */
class Buffer {

  /**
   * @param {number} fullDataSize The total user message size
   * @param {ArrayBuffer} data The first chunk of the user message
   * @param {number} chunkNb Number of the chunk
   * @param {function(buffer: ArrayBuffer)} action Callback to be executed when all
   * message chunks are received and thus the message is ready
   */
  constructor (fullDataSize, data, chunkNb, action) {
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
  add (data, chunkNb) {
    const dataChunk = new Uint8Array(data);
    const dataChunkSize = data.byteLength;
    this.currentSize += dataChunkSize - USER_MSG_OFFSET;
    let index = chunkNb * MAX_USER_MSG_SIZE;
    for (let i = USER_MSG_OFFSET; i < dataChunkSize; i++) {
      this.fullData[index++] = dataChunk[i];
    }
    if (this.currentSize === this.fullData.byteLength) {
      this.action(this.fullData.buffer);
    }
  }
}

/**
 * {@link WebRTCService} identifier.
 * @type {number}
 */
const WEB_RTC = 0;

/**
* {@link WebSocketService} identifier.
* @type {number}
*/
const WEB_SOCKET = 1;

/**
* {@link WebSocketService} identifier.
* @type {number}
*/
const EVENT_SOURCE = 5;

/**
 * {@link ChannelBuilderService} identifier.
 * @ignore
 * @type {number}
 */
const CHANNEL_BUILDER = 2;

/**
 * {@link FullyConnectedService} identifier.
 * @ignore
 * @type {number}
 */
const FULLY_CONNECTED = 3;

/**
 * {@link MessageBuilderService} identifier
 * @ignore
 * @type {number}
 */
const MESSAGE_BUILDER = 4;

/**
 * Contains singletons services.
 * @type {Map}
 */
const services = new Map();

/**
 * It is a factory helper class which is responsible to instantiate any service class.
 */
class ServiceFactory {
  /**
   * Provides the service instance specified by `id`.
   *
   * @throws {Error} If the service `id` is unknown
   * @param  {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id The service identifier
   * @param  {Object} [options] Any options that the service accepts
   * @returns {Service}
   */
  static get (id, options = {}) {
    if (services.has(id)) {
      return services.get(id)
    }
    let service;
    switch (id) {
      case WEB_RTC:
        return new WebRTCService(WEB_RTC, options)
      case WEB_SOCKET:
        return new WebSocketService(WEB_SOCKET)
      case EVENT_SOURCE:
        return new EventSourceService(EVENT_SOURCE)
      case CHANNEL_BUILDER:
        return new ChannelBuilderService(CHANNEL_BUILDER)
      case FULLY_CONNECTED:
        service = new FullyConnectedService(FULLY_CONNECTED);
        services.set(id, service);
        return service
      case MESSAGE_BUILDER:
        service = new MessageBuilderService(MESSAGE_BUILDER);
        services.set(id, service);
        return service
      default:
        throw new Error(`${id} is an Unknown service id`)
    }
  }
}

const MESSAGE_TYPE_ERROR = 4000;
const WEB_CHANNEL_NOT_FOUND = 4001;

/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
class BotServer {

  /**
   * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
   * plus `host` and `port` parameters.
   *
   * @param {Object} options
   * @param {WEB_RTC|WEB_SOCKET} [options.connector=WEB_SOCKET] Which connector is preferable during connection establishment
   * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
   * @param {string} [options.signalingURL='wss://sigver-coastteam.rhcloud.com:8443'] Signaling server url
   * @param {RTCIceServer} [options.iceServers=[{urls:'stun:turn01.uswest.xirsys.com'}]] Set of ice servers for WebRTC
   * @param {string} [options.host='localhost']
   * @param {number} [options.port=9000]
   */
  constructor (options = {}) {
    /**
     * Default settings.
     * @private
     * @type {Object}
     */
    this.defaultSettings = {
      connector: WEB_SOCKET,
      topology: FULLY_CONNECTED,
      signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'}
      ],
      host: 'localhost',
      port: 9000
    };

    /**
     * @private
     * @type {Object}
     */
    this.settings = Object.assign({}, this.defaultSettings, options);
    this.settings.listenOn = `ws://${this.settings.host}:${this.settings.port}`;

    /**
     * @type {WebSocketServer}
     */
    this.server = null;

    /**
     * @type {WebChannel[]}
     */
    this.webChannels = [];

    /**
     * @type {function(wc: WebChannel)}
     */
    this.onWebChannel = () => {};
  }

  /**
   * Starts listen on socket.
   *
   * @returns {Promise<undefined,string>}
   */
  start () {
    return new Promise((resolve, reject) => {
      const WebSocketServer = Util.require('ws').Server;
      this.server = new WebSocketServer({
        host: this.settings.host,
        port: this.settings.port
      }, resolve);

      for (let wc of this.webChannels) {
        wc.settings.listenOn = this.settings.listenOn;
      }

      this.server.on('error', (err) => {
        console.error('Server error: ', err);
        for (let wc of this.webChannels) {
          wc.settings.listenOn = '';
        }
        reject(`Server error: ${err.messsage}`);
      });

      this.server.on('connection', ws => {
        ws.onmessage = msgEvt => {
          try {
            const msg = JSON.parse(msgEvt.data);
            if ('join' in msg) {
              const wc = this.getWebChannel(msg.join);
              if (wc === null) {
                ws.send(JSON.stringify({isKeyOk: false}));
              } else {
                ws.send(JSON.stringify({isKeyOk: true, useThis: true}));
                wc.invite(ws);
              }
            } else if ('wcId' in msg) {
              let wc = this.getWebChannel(msg.wcId);
              if ('senderId' in msg) {
                if (wc !== null) {
                  ServiceFactory.get(CHANNEL_BUILDER).onChannel(wc, ws, msg.senderId);
                } else {
                  ws.close(WEB_CHANNEL_NOT_FOUND, `${msg.wcId} webChannel was not found (message received from ${msg.senderId})`);
                  console.error(`${msg.wcId} webChannel was not found (message received from ${msg.senderId})`);
                }
              } else {
                if (wc === null) {
                  wc = new WebChannel(this.settings);
                  wc.id = msg.wcId;
                  this.addWebChannel(wc);
                  wc.join(ws).then(() => { this.onWebChannel(wc); });
                } else if (wc.members.length === 0) {
                  this.removeWebChannel(wc);
                  wc = new WebChannel(this.settings);
                  wc.id = msg.wcId;
                  this.addWebChannel(wc);
                  wc.join(ws).then(() => { this.onWebChannel(wc); });
                } else {
                  console.error(`Bot refused to join ${msg.wcId} webChannel, because it is already in use`);
                }
              }
            }
          } catch (err) {
            ws.close(MESSAGE_TYPE_ERROR, `Unsupported message type: ${err.message}`);
            console.error(`Unsupported message type: ${err.message}`);
          }
        };
      });
    })
  }

  /**
   * Stops listen on web socket.
   */
  stop () {
    for (let wc of this.webChannels) {
      wc.settings.listenOn = '';
    }
    this.server.close();
  }

  /**
   * Get `WebChannel` identified by its `id`.
   *
   * @param {number} id
   *
   * @returns {WebChannel|null}
   */
  getWebChannel (id) {
    for (let wc of this.webChannels) {
      if (id === wc.id) return wc
    }
    return null
  }

  /**
   * Add `WebChannel`.
   *
   * @param {WebChannel} wc
   */
  addWebChannel (wc) {
    this.webChannels[this.webChannels.length] = wc;
  }

  /**
   * Remove `WebChannel`
   *
   * @param {WebChannel} wc
   */
  removeWebChannel (wc) {
    this.webChannels.splice(this.webChannels.indexOf(wc), 1);
  }
}

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
function create (options) {
  const defaultSettings = {
    connector: WEB_RTC,
    topology: FULLY_CONNECTED,
    signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
    iceServers: [
     {urls: 'stun:turn01.uswest.xirsys.com'}
    ],
    listenOn: ''
  };
  const mySettings = Object.assign({}, defaultSettings, options);
  return new WebChannel(mySettings)
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

export { create, BotServer, WEB_SOCKET, WEB_RTC };
