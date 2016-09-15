(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.netflux = global.netflux || {})));
}(this, (function (exports) { 'use strict';

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

  // Uncomment the line below if you want logging to occur, including logging
  // for the switch statement below. Can also be turned on in the browser via
  // adapter.disableLog(false), but then logging from the switch statement below
  // will not appear.
  // require('./utils').disableLog(false);

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
      chromeShim.shimMediaStream();
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

      edgeShim.shimGetUserMedia();
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
  shimMediaStream: function() {
    window.MediaStream = window.MediaStream || window.webkitMediaStream;
  },

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

        // shim getStats with maplike support
        var makeMapStats = function(stats, legacyStats) {
          var map = new Map(Object.keys(stats).map(function(key) {
            return[key, stats[key]];
          }));
          legacyStats = legacyStats || stats;
          Object.keys(legacyStats).forEach(function(key) {
            map[key] = legacyStats[key];
          });
          return map;
        };

        if (arguments.length >= 2) {
          var successCallbackWrapper_ = function(response) {
            args[1](makeMapStats(fixChromeStats_(response)));
          };

          return origGetStats.apply(this, [successCallbackWrapper_,
              arguments[0]]);
        }

        // promise-support
        return new Promise(function(resolve, reject) {
          if (args.length === 1 && typeof selector === 'object') {
            origGetStats.apply(self, [
              function(response) {
                resolve(makeMapStats(fixChromeStats_(response)));
              }, reject]);
          } else {
            // Preserve legacy chrome stats only on legacy access of stats obj
            origGetStats.apply(self, [
              function(response) {
                resolve(makeMapStats(fixChromeStats_(response),
                    response.result()));
              }, reject]);
          }
        }).then(successCallback, errorCallback);
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

    ['createOffer', 'createAnswer'].forEach(function(method) {
      var nativeMethod = webkitRTCPeerConnection.prototype[method];
      webkitRTCPeerConnection.prototype[method] = function() {
        var self = this;
        if (arguments.length < 1 || (arguments.length === 1 &&
            typeof arguments[0] === 'object')) {
          var opts = arguments.length === 1 ? arguments[0] : undefined;
          return new Promise(function(resolve, reject) {
            nativeMethod.apply(self, [resolve, reject, opts]);
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });

    // add promise support -- natively available in Chrome 51
    if (browserDetails.version < 51) {
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = webkitRTCPeerConnection.prototype[method];
            webkitRTCPeerConnection.prototype[method] = function() {
              var args = arguments;
              var self = this;
              var promise = new Promise(function(resolve, reject) {
                nativeMethod.apply(self, [args[0], resolve, reject]);
              });
              if (args.length < 2) {
                return promise;
              }
              return promise.then(function() {
                args[1].apply(null, []);
              },
              function(err) {
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              });
            };
          });
    }

    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = webkitRTCPeerConnection.prototype[method];
          webkitRTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      return arguments[0] === null ? Promise.resolve()
          : nativeAddIceCandidate.apply(this, arguments);
    };
  }
};


// Expose public methods.
module.exports = {
  shimMediaStream: chromeShim.shimMediaStream,
  shimOnTrack: chromeShim.shimOnTrack,
  shimSourceObject: chromeShim.shimSourceObject,
  shimPeerConnection: chromeShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
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

  var shimConstraints_ = function(constraints, func) {
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && constraints.audio) {
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile, where it defaults to "user".
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode)) {
        delete constraints.video.facingMode;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          // Look for "back" in label, or use last cam (typically back cam).
          return navigator.mediaDevices.enumerateDevices()
          .then(function(devices) {
            devices = devices.filter(function(d) {
              return d.kind === 'videoinput';
            });
            var back = devices.find(function(d) {
              return d.label.toLowerCase().indexOf('back') !== -1;
            }) || (devices.length && devices[devices.length - 1]);
            if (back) {
              constraints.video.deviceId = face.exact ? {exact: back.deviceId} :
                                                        {ideal: back.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function(e) {
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        ConstraintNotSatisfiedError: 'OverconstrainedError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraintName,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function(c) {
      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
        onError(shimError_(e));
      });
    });
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
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, function(c) {
        return origGetUserMedia(c).catch(function(e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
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
    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
        window.mozRTCPeerConnection)) {
      return; // probably media.peerconnection.enabled=false in about:config
    }
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
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      return arguments[0] === null ? Promise.resolve()
          : nativeAddIceCandidate.apply(this, arguments);
    };

    // shim getStats with maplike support
    var makeMapStats = function(stats) {
      var map = new Map();
      Object.keys(stats).forEach(function(key) {
        map.set(key, stats[key]);
        map[key] = stats[key];
      });
      return map;
    };

    var nativeGetStats = RTCPeerConnection.prototype.getStats;
    RTCPeerConnection.prototype.getStats = function(selector, onSucc, onErr) {
      return nativeGetStats.apply(this, [selector || null])
        .then(function(stats) {
          return makeMapStats(stats);
        })
        .then(onSucc, onErr);
    };
  }
};

// Expose public methods.
module.exports = {
  shimOnTrack: firefoxShim.shimOnTrack,
  shimSourceObject: firefoxShim.shimSourceObject,
  shimPeerConnection: firefoxShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
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
  var shimError_ = function(e) {
    return {
      name: {
        SecurityError: 'NotAllowedError',
        PermissionDeniedError: 'NotAllowedError'
      }[e.name] || e.name,
      message: {
        'The operation is insecure.': 'The request is not allowed by the ' +
        'user agent or the platform in the current context.'
      }[e.message] || e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

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
    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
      onError(shimError_(e));
    });
  };

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia_(constraints, resolve, reject);
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
  if (browserDetails.version < 49) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).catch(function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  }
  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    if (browserDetails.version < 44) {
      return getUserMedia_(constraints, onSuccess, onError);
    }
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    console.warn('navigator.getUserMedia has been replaced by ' +
                 'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
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
  // shimPeerConnection: safariShim.shimPeerConnection
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

var logDisabled_ = true;

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
   * @return {object} result containing browser and version
   *     properties.
   */
  detectBrowser: function() {
    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;

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

    // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia) {
      // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
      if (window.webkitRTCPeerConnection) {
        result.browser = 'chrome';
        result.version = this.extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/([0-9]+)\./, 2);

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

    // Default fallthrough: not supported.
    } else {
      result.browser = 'Not a supported browser.';
      return result;
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

/**
 * Service module includes {@link module:channelBuilder},
 * {@link module:webChannelManager} and {@link module:messageBuilder}.
 * Services are substitutable stateless objects. Each service is identified by
 * the id provided during construction and some of them can receive messages via `WebChannel` sent
 * by another service.
 *
 * @module service
 * @see module:channelBuilder
 * @see module:webChannelManager
 * @see module:messageBuilder
 */

/**
 * Default timeout for any pending request.
 * @type {number}
 */
const DEFAULT_REQUEST_TIMEOUT = 27000

/**
 * Pending request map. Pending request is when a service uses a Promise
 * which will be fulfilled or rejected somewhere else in code. For exemple when
 * a peer is waiting for a feedback from another peer before Promise has completed.
 * @type {external:Map}
 */
const itemsStorage = new Map()
const requestsStorage = new Map()

/**
 * Each service must implement this interface.
 * @interface
 */
class ServiceInterface {

  /**
   * Timeout event handler
   * @callback ServiceInterface~onTimeout
   */

  constructor (id) {
    this.id = id
    if (!itemsStorage.has(this.id)) itemsStorage.set(this.id, new WeakMap())
    if (!requestsStorage.has(this.id)) requestsStorage.set(this.id, new WeakMap())
  }

  /**
   * Add new pending request.
   * @param {WebChannel} wc - Web channel to which this request corresponds
   * @param {number} id - Identifer to which this request corresponds
   * @param {Object} data - Data to be available when getPendingRequest is called
   * @param {number} [timeout=DEFAULT_REQUEST_TIMEOUT] - Timeout in milliseconds
   * @param {ServiceInterface~onTimeout} [onTimeout=() => {}] - Timeout event handler
   */
  setPendingRequest (wc, id, data, timeout = DEFAULT_REQUEST_TIMEOUT) {
    this.setTo(requestsStorage, wc, id, data)
    setTimeout(() => { data.reject('Pending request timeout') }, timeout)
  }

  /**
   * Get pending request corresponding to the specific WebChannel and identifier.
   * @param  {WebChannel} wc - Web channel
   * @param  {number} id - Identifier
   * @return {Object} - Javascript object corresponding to the one provided in
   * setPendingRequest function
   */
  getPendingRequest (wc, id) {
    return this.getFrom(requestsStorage, wc, id)
  }

  setItem (wc, id, data) {
    this.setTo(itemsStorage, wc, id, data)
  }

  getItem (wc, id) {
    return this.getFrom(itemsStorage, wc, id)
  }

  getItems (wc) {
    let items = itemsStorage.get(this.id).get(wc)
    if (items) return items
    else return new Map()
  }

  removeItem (wc, id) {
    let currentServiceTemp = itemsStorage.get(this.id)
    let idMap = currentServiceTemp.get(wc)
    currentServiceTemp.get(wc).delete(id)
    if (idMap.size === 0) currentServiceTemp.delete(wc)
  }

  setTo (storage, wc, id, data) {
    let currentServiceTemp = storage.get(this.id)
    let idMap
    if (currentServiceTemp.has(wc)) {
      idMap = currentServiceTemp.get(wc)
    } else {
      idMap = new Map()
      currentServiceTemp.set(wc, idMap)
    }
    if (!idMap.has(id)) idMap.set(id, data)
  }

  getFrom (storage, wc, id) {
    let idMap = storage.get(this.id).get(wc)
    if (idMap !== undefined) {
      let item = idMap.get(id)
      if (item !== undefined) return item
    }
    return null
  }
}

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
 * Each Web Channel Manager Service must implement this interface.
 * @interface
 * @extends module:service~ServiceInterface
 */
class ManagerInterface extends ServiceInterface {

  connectTo (wc, peerIds) {
    let failed = []
    if (peerIds.length === 0) return Promise.resolve(failed)
    else {
      return new Promise((resolve, reject) => {
        let counter = 0
        let cBuilder = provide(CHANNEL_BUILDER)
        peerIds.forEach(id => {
          cBuilder.connectTo(wc, id)
            .then(channel => this.onChannel(channel))
            .then(() => { if (++counter === peerIds.length) resolve(failed) })
            .catch(reason => {
              failed.push({id, reason})
              if (++counter === peerIds.length) resolve(failed)
            })
        })
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
 * One of the internal message type. The message is intended for the *WebChannel*
 * members to notify them about the joining peer.
 * @type {number}
 */
const SHOULD_ADD_NEW_JOINING_PEER = 1
/**
 * Connection service of the peer who received a message of this type should
 * establish connection with one or several peers.
 */
const SHOULD_CONNECT_TO = 2
/**
 * One of the internal message type. The message sent by the joining peer to
 * notify all *WebChannel* members about his arrivel.
 * @type {number}
 */
const PEER_JOINED = 3

const TICK = 4
const TOCK = 5

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelManagerInterface
 */
class FullyConnectedService extends ManagerInterface {

  add (channel) {
    let wc = channel.webChannel
    let peers = wc.members.slice()
    for (let jpId of super.getItems(wc).keys()) peers[peers.length] = jpId
    this.setJP(wc, channel.peerId, channel)
    wc.sendInner(this.id, {code: SHOULD_ADD_NEW_JOINING_PEER, jpId: channel.peerId})
    wc.sendInnerTo(channel, this.id, {code: SHOULD_CONNECT_TO, peers})
    return new Promise((resolve, reject) => {
      super.setPendingRequest(wc, channel.peerId, {resolve, reject})
    })
  }

  broadcast (webChannel, data) {
    for (let c of webChannel.channels) c.send(data)
  }

  sendTo (id, webChannel, data) {
    for (let c of webChannel.channels) {
      if (c.peerId === id) {
        c.send(data)
        return
      }
    }
  }

  sendInnerTo (recepient, wc, data) {
    // If the peer sent a message to himself
    if (recepient === wc.myId) wc.onChannelMessage(null, data)
    else {
      let jp = super.getItem(wc, wc.myId)
      if (jp === null) jp = super.getItem(wc, recepient)

      if (jp !== null) { // If me or recepient is joining the WebChannel
        jp.channel.send(data)
      } else if (wc.members.includes(recepient)) { // If recepient is a WebChannel member
        this.sendTo(recepient, wc, data)
      } else this.sendTo(wc.members[0], wc, data)
    }
  }

  leave (wc) {
    for (let c of wc.channels) {
      c.clearHandlers()
      c.close()
    }
    wc.channels.clear()
  }

  onChannel (channel) {
    return new Promise((resolve, reject) => {
      super.setPendingRequest(channel.webChannel, channel.peerId, {resolve, reject})
      channel.webChannel.sendInnerTo(channel, this.id, {code: TICK})
    })
  }

  /**
   * Close event handler for each *Channel* in the *WebChannel*.
   * @private
   * @param {external:CloseEvent} closeEvt - Close event
   */
  onChannelClose (evt, channel) {
    // TODO: need to check if this is a peer leaving and thus he closed channels
    // with all WebChannel members or this is abnormal channel closing
    let wc = channel.webChannel
    for (let c of wc.channels) {
      if (c.peerId === channel.peerId) return wc.channels.delete(c)
    }
    let jps = super.getItems(wc)
    jps.forEach(jp => jp.channels.delete(channel))
    return false
  }

  /**
   * Error event handler for each *Channel* in the *WebChannel*.
   * @private
   * @param {external:Event} evt - Event
   */
  onChannelError (evt, channel) {
    console.error(`Channel error with id: ${channel.peerId}`)
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    switch (msg.code) {
      case SHOULD_CONNECT_TO:
        this.setJP(wc, wc.myId, channel).channels.add(channel)
        super.connectTo(wc, msg.peers)
          .then(failed => {
            let msg = {code: PEER_JOINED}
            for (let c of super.getItem(wc, wc.myId).channels) {
              wc.channels.add(c)
              wc.onJoining$(c.peerId)
            }
            super.removeItem(wc, wc.myId)
            wc.sendInner(this.id, msg)
            super.getItems(wc).forEach(jp => wc.sendInnerTo(jp.channel, this.id, msg))
            wc.onJoin()
          })
        break
      case PEER_JOINED:
        let jpMe = super.getItem(wc, wc.myId)
        super.removeItem(wc, senderId)
        if (jpMe !== null) jpMe.channels.add(channel)
        else {
          wc.channels.add(channel)
          wc.onJoining$(senderId)
          let request = super.getPendingRequest(wc, senderId)
          if (request !== null) request.resolve(senderId)
        }
        break
      case TICK:
        this.setJP(wc, senderId, channel)
        let isJoining = super.getItem(wc, wc.myId) !== null
        wc.sendInnerTo(channel, this.id, {code: TOCK, isJoining})
        break
      case TOCK:
        if (msg.isJoining) this.setJP(wc, senderId, channel)
        else super.getItem(wc, wc.myId).channels.add(channel)
        super.getPendingRequest(wc, senderId).resolve()
        break
      case SHOULD_ADD_NEW_JOINING_PEER:
        this.setJP(wc, msg.jpId, channel)
        break
    }
  }

  setJP (wc, jpId, channel) {
    let jp = super.getItem(wc, jpId)
    if (!jp) {
      jp = new JoiningPeer(channel)
      super.setItem(wc, jpId, jp)
    } else jp.channel = channel
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
  constructor (channel) {
    /**
     * The channel between the joining peer and intermediary peer. It is null
     * for every peer, but the joining and intermediary peers.
     *
     * @type {Channel}
     */
    this.channel = channel

    /**
     * This attribute is proper to each peer. Array of channels which will be
     * added to the current peer once it becomes the member of the web channel.
     * @type {Channel[]}
     */
    this.channels = new Set()
  }
}

const message = new WeakMap()

class NodeCloseEvent {
  constructor (msg) {
    message.set(this, msg)
  }

  get message () {
    return message.get(this)
  }
}

function isBrowser () {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
    return false
  }
  return true
}

function isSocket (channel) {
  return channel.constructor.name === 'WebSocket'
}

const CONNECT_TIMEOUT = 30000
const REMOVE_ITEM_TIMEOUT = 5000
let src
let webRTCAvailable = true
if (isBrowser()) src = window
else {
  try {
    src = require('wrtc')
    if (!src) {
      webRTCAvailable = false
      src = {}
    }
    src.CloseEvent = NodeCloseEvent
  } catch (err) {
    webRTCAvailable = false
  }
}
const RTCPeerConnection$1 = src.RTCPeerConnection
const RTCIceCandidate$1 = src.RTCIceCandidate
const CloseEvent = src.CloseEvent

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
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 * @see {@link external:RTCPeerConnection}
 * @extends module:channelBuilder~ChannelBuilderInterface
 */
class WebRTCService extends ServiceInterface {

  /**
   * WebRTCService constructor.
   *
   * @param  {Object} [options] - This service options.
   * @param  {Object} [options.signaling='ws://sigver-coastteam.rhcloud.com:8000'] -
   * Signaling server URL.
   * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
   * and TURN servers to be used.
   */
  constructor (id, options = {}) {
    super(id)
    this.defaults = {
      signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'}
      ]
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    let item = super.getItem(wc, senderId)
    if (!item) {
      item = new CandidatesBuffer()
      super.setItem(wc, senderId, item)
    }
    if ('offer' in msg) {
      item.pc = this.createPeerConnection(candidate => {
        wc.sendInnerTo(senderId, this.id, {candidate})
      })
      Promise.all([
        this.createDataChannel(item.pc, false)
          .then(channel => {
            let channelBuilderService = provide(CHANNEL_BUILDER)
            channelBuilderService.onChannel(wc, channel, true, senderId)
            this.removeItem(wc, senderId)
          }),
        this.createAnswer(item.pc, msg.offer, item.candidates)
          .then(answer => wc.sendInnerTo(senderId, this.id, {answer}))
      ]).catch(err => console.error(`Establish data channel (webChannel): ${err.message}`))
    } if ('answer' in msg) {
      item.pc.setRemoteDescription(msg.answer)
        .then(() => item.pc.addReceivedCandidates(item.candidates))
        .catch(err => console.error(`Set answer (webChannel): ${err.message}`))
    } else if ('candidate' in msg) {
      this.addIceCandidate(item, msg.candidate)
    }
  }

  connectOverWebChannel (wc, id) {
    let item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      wc.sendInnerTo(id, this.id, {candidate})
    }))
    super.setItem(wc, id, item)
    return new Promise((resolve, reject) => {
      setTimeout(reject, CONNECT_TIMEOUT, 'WebRTC connect timeout')
      this.createDataChannel(item.pc, true)
        .then(channel => {
          this.removeItem(wc, id)
          resolve(channel)
        })
        .catch(reject)
      this.createOffer(item.pc)
        .then(offer => wc.sendInnerTo(id, this.id, {offer}))
        .catch(reject)
    })
  }

  // Equivalent à open
  listenFromSignaling (ws, onChannel) {
    ws.onmessage = evt => {
      let msg = JSON.parse(evt.data)
      if ('id' in msg && 'data' in msg) {
        let item = super.getItem(ws, msg.id)
        if (!item) {
          item = new CandidatesBuffer(this.createPeerConnection(candidate => {
            if (ws.readyState === 1) ws.send(JSON.stringify({id: msg.id, data: {candidate}}))
          }))
          super.setItem(ws, msg.id, item)
        }
        if ('offer' in msg.data) {
          Promise.all([
            this.createDataChannel(item.pc, false).then(channel => {
              super.removeItem(ws, msg.id)
              onChannel(channel)
            }),
            this.createAnswer(item.pc, msg.data.offer, item.candidates)
              .then(answer => {
                ws.send(JSON.stringify({id: msg.id, data: {answer}}))
              })
          ]).catch(err => {
            console.error(`Establish data channel through signaling: ${err.message}`)
          })
        } else if ('candidate' in msg.data) {
          this.addIceCandidate(item, msg.data.candidate)
        }
      }
    }
  }

  connectOverSignaling (ws, key, options = {}) {
    let item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      if (ws.readyState === 1) ws.send(JSON.stringify({data: {candidate}}))
    }))
    super.setItem(ws, key, item)
    return Promise.race([
      new Promise((resolve, reject) => {
        ws.onclose = closeEvt => reject(closeEvt.reason)
        ws.onmessage = evt => {
          let msg
          try {
            msg = JSON.parse(evt.data)
          } catch (err) {
            console.error(`Unsupported message type from the signaling server: ${evt.data}`)
          }

          if ('data' in msg) {
            if ('answer' in msg.data) {
              item.pc.setRemoteDescription(msg.data.answer)
                .then(() => item.pc.addReceivedCandidates(item.candidates))
                .catch(err => {
                  console.error(`Set answer (signaling): ${err.message}`)
                  reject(err)
                })
            } else if ('candidate' in msg.data) {
              this.addIceCandidate(super.getItem(ws, key), msg.data.candidate)
            }
          } else if ('isKeyOk' in msg) {
            if (msg.isKeyOk) {
              this.createOffer(item.pc)
                .then(offer => ws.send(JSON.stringify({data: {offer}})))
                .catch(reject)
            } else reject('Provided key is not available')
          } else reject(`Unknown message from the signaling server: ${evt.data}`)
        }
        ws.send(JSON.stringify({join: key}))
      }),
      this.createDataChannel(item.pc, true)
        .then(channel => {
          setTimeout(() => super.removeItem(ws, key), REMOVE_ITEM_TIMEOUT)
          return channel
        })
    ])
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
  createOffer (pc) {
    return pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => JSON.parse(JSON.stringify(pc.localDescription)))
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
  createAnswer (pc, offer, candidates) {
    return pc.setRemoteDescription(offer)
      .then(() => {
        pc.addReceivedCandidates(candidates)
        return pc.createAnswer()
      })
      .then(answer => pc.setLocalDescription(answer))
      .then(() => JSON.parse(JSON.stringify(pc.localDescription)))
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
   *
   * @private
   * @param  {WebRTCService~onCandidate} onCandidate - Ice
   * candidate event handler.
   * @return {external:RTCPeerConnection} - Peer connection.
   */
  createPeerConnection (onCandidate) {
    let pc = new RTCPeerConnection$1({iceServers: this.settings.iceServers})
    pc.isRemoteDescriptionSet = false
    pc.addReceivedCandidates = candidates => {
      pc.isRemoteDescriptionSet = true
      for (let c of candidates) this.addIceCandidate({pc}, c)
    }
    pc.onicecandidate = evt => {
      if (evt.candidate !== null) {
        let candidate = {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        }
        onCandidate(candidate)
      }
    }
    return pc
  }

  createDataChannel (pc, isInitiator) {
    return new Promise((resolve, reject) => {
      let dc
      if (isInitiator) {
        dc = pc.createDataChannel(null)
        dc.onopen = evt => resolve(dc)
      } else {
        pc.ondatachannel = dcEvt => {
          dc = dcEvt.channel
          dcEvt.channel.onopen = evt => resolve(dc)
        }
      }
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          if (dc.onclose) dc.onclose(new CloseEvent(pc.iceConnectionState))
        }
      }
    })
  }

  addIceCandidate (obj, candidate) {
    if (obj !== null && obj.pc && obj.pc.isRemoteDescriptionSet) {
      obj.pc.addIceCandidate(new RTCIceCandidate$1(candidate))
        .catch(evt => console.error(`Add ICE candidate: ${evt.message}`))
    } else obj.candidates[obj.candidates.length] = candidate
  }
}

class CandidatesBuffer {
  constructor (pc = null, candidates = []) {
    this.pc = pc
    this.candidates = candidates
  }
}

const WebSocket = isBrowser() ? window.WebSocket : require('ws')
const CONNECT_TIMEOUT$1 = 7000
const OPEN = WebSocket.OPEN
let listenOnWebSocket = false
let setListenOnWebSocket = (value) => {
  listenOnWebSocket = value
}

class WebSocketService extends ServiceInterface {

  /**
   * Creates WebSocket with server.
   * @param {string} url - Server url
   * @return {Promise} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        let ws = new WebSocket(url)
        ws.onopen = () => resolve(ws)
        // Timeout for node (otherwise it will loop forever if incorrect address)
        setTimeout(() => {
          if (ws.readyState !== OPEN) {
            reject(`WebSocket connection timeout with ${url}`)
          }
        }, CONNECT_TIMEOUT$1)
      } catch (err) { reject(err.message) }
    })
  }

}

/**
 * Message builder module is responsible to build messages to send them over the
 * *WebChannel* and treat messages received by the *WebChannel*. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 *
 * @module messageBuilder
 */
let src$1 = isBrowser() ? window : require('text-encoding')
const TextEncoder = src$1.TextEncoder
const TextDecoder = src$1.TextDecoder

/**
 * Maximum size of the user message sent over *Channel*. Is meant without metadata.
 * @type {number}
 */
const MAX_USER_MSG_SIZE = 16365

/**
 * User message offset in the array buffer. All data before are metadata.
 * @type {number}
 */
const USER_MSG_OFFSET = 19

/**
 * First index in the array buffer after header (which is the part of metadata).
 * @type {number}
 */
const HEADER_OFFSET = 9

/**
 * Maximum message id number.
 * @type {number}
 */
const MAX_MSG_ID_SIZE = 65535

/**
 * User allowed message type: {@link external:ArrayBuffer}
 * @type {number}
 */
const ARRAY_BUFFER_TYPE = 1

/**
 * User allowed message type: {@link external:Uint8Array}
 * @type {number}
 */
const U_INT_8_ARRAY_TYPE = 2

/**
 * User allowed message type: {@link external:String}
 * @type {number}
 */
const STRING_TYPE = 3

/**
 * User allowed message type: {@link external:Int8Array}
 * @type {number}
 */
const INT_8_ARRAY_TYPE = 4

/**
 * User allowed message type: {@link external:Uint8ClampedArray}
 * @type {number}
 */
const U_INT_8_CLAMPED_ARRAY_TYPE = 5

/**
 * User allowed message type: {@link external:Int16Array}
 * @type {number}
 */
const INT_16_ARRAY_TYPE = 6

/**
 * User allowed message type: {@link external:Uint16Array}
 * @type {number}
 */
const U_INT_16_ARRAY_TYPE = 7

/**
 * User allowed message type: {@link external:Int32Array}
 * @type {number}
 */
const INT_32_ARRAY_TYPE = 8

/**
 * User allowed message type: {@link external:Uint32Array}
 * @type {number}
 */
const U_INT_32_ARRAY_TYPE = 9

/**
 * User allowed message type: {@link external:Float32Array}
 * @type {number}
 */
const FLOAT_32_ARRAY_TYPE = 10

/**
 * User allowed message type: {@link external:Float64Array}
 * @type {number}
 */
const FLOAT_64_ARRAY_TYPE = 11

const JOIN = 1
const NEW_CHANNEL = 2

/**
 * Buffer for big user messages.
 */
const buffers = new WeakMap()

/**
 * Message builder service class.
 */
class MessageBuilderService extends ServiceInterface {

  /**
   * @callback MessageBuilderService~Send
   * @param {external:ArrayBuffer} dataChunk - If the message is too big this
   * action would be executed for each data chunk until send whole message
   */

  /**
   * @callback MessageBuilderService~Receive
   * @param {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} data - Message.
   * Its type depends on what other
   */

  /**
   * Header of the metadata of the messages sent/received over the *WebChannel*.
   * @typedef {Object} MessageBuilderService~Header
   * @property {number} code - Message type code
   * @property {number} senderId - Id of the sender peer
   * @property {number} recipientId - Id of the recipient peer
   */

  /**
   * Prepare user message to be sent over the *WebChannel*
   * @param {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} data -
   * Message to be sent
   * @param {number} senderId - Id of the peer who sends this message
   * @param {number} recipientId - Id of the recipient peer
   * @param {MessageBuilderService~Send} action - Send callback executed for each
   * data chunk if the message is too big
   * @param {boolean} isBroadcast - Equals to true if this message would be
   * sent to all *WebChannel* members and false if only to one member
   */
  handleUserMessage (data, senderId, recipientId, action, isBroadcast = true) {
    let workingData = this.userDataToType(data)
    let dataUint8Array = workingData.content
    if (dataUint8Array.byteLength <= MAX_USER_MSG_SIZE) {
      let dataView = this.initHeader(1, senderId, recipientId,
        dataUint8Array.byteLength + USER_MSG_OFFSET
      )
      dataView.setUint32(HEADER_OFFSET, dataUint8Array.byteLength)
      dataView.setUint8(13, workingData.type)
      dataView.setUint8(14, isBroadcast ? 1 : 0)
      let resultUint8Array = new Uint8Array(dataView.buffer)
      resultUint8Array.set(dataUint8Array, USER_MSG_OFFSET)
      action(resultUint8Array.buffer)
    } else {
      const msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE)
      const totalChunksNb = Math.ceil(dataUint8Array.byteLength / MAX_USER_MSG_SIZE)
      for (let chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
        let currentChunkMsgByteLength = Math.min(
          MAX_USER_MSG_SIZE,
          dataUint8Array.byteLength - MAX_USER_MSG_SIZE * chunkNb
        )
        let dataView = this.initHeader(
          1,
          senderId,
          recipientId,
          USER_MSG_OFFSET + currentChunkMsgByteLength
        )
        dataView.setUint32(9, dataUint8Array.byteLength)
        dataView.setUint8(13, workingData.type)
        dataView.setUint8(14, isBroadcast ? 1 : 0)
        dataView.setUint16(15, msgId)
        dataView.setUint16(17, chunkNb)
        let resultUint8Array = new Uint8Array(dataView.buffer)
        let j = USER_MSG_OFFSET
        let startIndex = MAX_USER_MSG_SIZE * chunkNb
        let endIndex = startIndex + currentChunkMsgByteLength
        for (let i = startIndex; i < endIndex; i++) {
          resultUint8Array[j++] = dataUint8Array[i]
        }
        action(resultUint8Array.buffer)
      }
    }
  }

  /**
   * Build a message which can be then sent trough the *Channel*.
   * @param {number} code - One of the internal message type code (e.g. {@link
   * USER_DATA})
   * @param {Object} [data={}] - Message. Could be empty if the code is enough
   * @returns {external:ArrayBuffer} - Built message
   */
  msg (code, senderId = null, recepientId = null, data = {}) {
    let msgEncoded = (new TextEncoder()).encode(JSON.stringify(data))
    let msgSize = msgEncoded.byteLength + HEADER_OFFSET
    let dataView = this.initHeader(code, senderId, recepientId, msgSize)
    let fullMsg = new Uint8Array(dataView.buffer)
    fullMsg.set(msgEncoded, HEADER_OFFSET)
    return fullMsg.buffer
  }

  /**
   * Read user message which was prepared by another peer with
   * {@link MessageBuilderService#handleUserMessage} and sent.
   * @param {WebChannel} wc - WebChannel
   * @param {number} senderId - Id of the peer who sent this message
   * @param {external:ArrayBuffer} data - Message
   * @param {MessageBuilderService~Receive} action - Callback when the message is
   * ready
   */
  readUserMessage (wc, senderId, data, action) {
    let dataView = new DataView(data)
    let msgSize = dataView.getUint32(HEADER_OFFSET)
    let dataType = dataView.getUint8(13)
    let isBroadcast = dataView.getUint8(14)
    if (msgSize > MAX_USER_MSG_SIZE) {
      let msgId = dataView.getUint16(15)
      let chunk = dataView.getUint16(17)
      let buffer = this.getBuffer(wc, senderId, msgId)
      if (buffer === undefined) {
        this.setBuffer(wc, senderId, msgId,
          new Buffer(msgSize, data, chunk, (fullData) => {
            action(this.extractUserData(fullData, dataType), isBroadcast)
          })
        )
      } else {
        buffer.add(data, chunk)
      }
    } else {
      let dataArray = new Uint8Array(data)
      let userData = new Uint8Array(data.byteLength - USER_MSG_OFFSET)
      let j = USER_MSG_OFFSET
      for (let i in userData) {
        userData[i] = dataArray[j++]
      }
      action(this.extractUserData(userData.buffer, dataType), isBroadcast)
    }
  }

  /**
   * Read internal Netflux message.
   * @param {external:ArrayBuffer} data - Message
   * @returns {Object}
   */
  readInternalMessage (data) {
    let uInt8Array = new Uint8Array(data)
    return JSON.parse((new TextDecoder())
      .decode(uInt8Array.subarray(HEADER_OFFSET, uInt8Array.byteLength))
    )
  }

  /**
   * Extract header from the message. Each user message has a header which is
   * a part of the message metadata.
   * TODO: add header also to the internal messages.
   * @param {external:ArrayBuffer} data - Whole message
   * @returns {MessageBuilderService~Header}
   */
  readHeader (data) {
    let dataView = new DataView(data)
    return {
      code: dataView.getUint8(0),
      senderId: dataView.getUint32(1),
      recepientId: dataView.getUint32(5)
    }
  }

  /**
   * Create an *ArrayBuffer* and fill in the header.
   * @private
   * @param {number} code - Message type code
   * @param {number} senderId - Sender peer id
   * @param {number} recipientId - Recipient peer id
   * @param {number} dataSize - Message size in bytes
   * @return {external:DataView} - Data view with initialized header
   */
  initHeader (code, senderId, recipientId, dataSize) {
    let dataView = new DataView(new ArrayBuffer(dataSize))
    dataView.setUint8(0, code)
    dataView.setUint32(1, senderId)
    dataView.setUint32(5, recipientId)
    return dataView
  }

  /**
   * Netflux sends data in *ArrayBuffer*, but the user can send data in different
   * types. This function retrieve the inital message sent by the user.
   * @private
   * @param {external:ArrayBuffer} - Message as it was received by the *WebChannel*
   * @param {number} - Message type as it was defined by the user
   * @returns {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} - Initial
   * user message
   */
  extractUserData (buffer, type) {
    switch (type) {
      case ARRAY_BUFFER_TYPE:
        return buffer
      case U_INT_8_ARRAY_TYPE:
        return new Uint8Array(buffer)
      case STRING_TYPE:
        return new TextDecoder().decode(new Uint8Array(buffer))
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
    }
  }

  /**
   * Identify the user message type.
   * @private
   * @param {external:ArrayBuffer|external:Uint8Array|external:String|
   * external:Int8Array|external:Uint8ClampedArray|external:Int16Array|
   * external:Uint16Array|external:Int32Array|external:Uint32Array|
   * external:Float32Array|external:Float64Array|external:DataView} - User message
   * @returns {number} - User message type
   */
  userDataToType (data) {
    let result = {}
    if (data instanceof ArrayBuffer) {
      result.type = ARRAY_BUFFER_TYPE
      result.content = new Uint8Array(data)
    } else if (data instanceof Uint8Array) {
      result.type = U_INT_8_ARRAY_TYPE
      result.content = data
    } else if (typeof data === 'string' || data instanceof String) {
      result.type = STRING_TYPE
      result.content = new TextEncoder().encode(data)
    } else {
      result.content = new Uint8Array(data.buffer)
      if (data instanceof Int8Array) {
        result.type = INT_8_ARRAY_TYPE
      } else if (data instanceof Uint8ClampedArray) {
        result.type = U_INT_8_CLAMPED_ARRAY_TYPE
      } else if (data instanceof Int16Array) {
        result.type = INT_16_ARRAY_TYPE
      } else if (data instanceof Uint16Array) {
        result.type = U_INT_16_ARRAY_TYPE
      } else if (data instanceof Int32Array) {
        result.type = INT_32_ARRAY_TYPE
      } else if (data instanceof Uint32Array) {
        result.type = U_INT_32_ARRAY_TYPE
      } else if (data instanceof Float32Array) {
        result.type = FLOAT_32_ARRAY_TYPE
      } else if (data instanceof Float64Array) {
        result.type = FLOAT_64_ARRAY_TYPE
      } else {
        throw new Error('Unknown data object')
      }
    }
    return result
  }

  /**
   * Get the buffer.
   * @private
   * @param {WebChannel} wc - WebChannel
   * @param {number} peerId - Peer id
   * @param {number} msgId - Message id
   * @returns {Buffer|undefined} - Returns buffer if it was found and undefined
   * if not
   */
  getBuffer (wc, peerId, msgId) {
    let wcBuffer = buffers.get(wc)
    if (wcBuffer !== undefined) {
      let peerBuffer = wcBuffer.get(peerId)
      if (peerBuffer !== undefined) {
        return peerBuffer.get(msgId)
      }
    }
    return undefined
  }

  /**
   * Add a new buffer to the buffer array.
   * @private
   * @param {WebChannel} wc - WebChannel
   * @param {number} peerId - Peer id
   * @param {number} msgId - Message id
   * @param {Buffer} - buffer
   */
  setBuffer (wc, peerId, msgId, buffer) {
    let wcBuffer = buffers.get(wc)
    if (wcBuffer === undefined) {
      wcBuffer = new Map()
      buffers.set(wc, wcBuffer)
    }
    let peerBuffer = wcBuffer.get(peerId)
    if (peerBuffer === undefined) {
      peerBuffer = new Map()
      wcBuffer.set(peerId, peerBuffer)
    }
    peerBuffer.set(msgId, buffer)
  }
}

/**
 * Buffer class used when the user message exceeds the message size limit which
 * may be sent over a *Channel*. Each buffer is identified by *WebChannel* id,
 * peer id (who sends the big message) and message id (in case if the peer sends
 * more then 1 big message at a time).
 */
class Buffer {

  /**
   * @callback Buffer~onFullMessage
   * @param {external:ArrayBuffer} - The full message as it was initially sent
   * by user
   */

  /**
   * @param {number} fullDataSize - The total user message size
   * @param {external:ArrayBuffer} - The first chunk of the user message
   * @param {Buffer~onFullMessage} action - Callback to be executed when all
   * message chunks are received and thus the message is ready
   */
  constructor (fullDataSize, data, chunkNb, action) {
    this.fullData = new Uint8Array(fullDataSize)
    this.currentSize = 0
    this.action = action
    this.add(data, chunkNb)
  }

  /**
   * Add a chunk of message to the buffer.
   * @param {external:ArrayBuffer} data - Message chunk
   * @param {number} chunkNb - Number of the chunk
   */
  add (data, chunkNb) {
    let dataChunk = new Uint8Array(data)
    let dataChunkSize = data.byteLength
    this.currentSize += dataChunkSize - USER_MSG_OFFSET
    let index = chunkNb * MAX_USER_MSG_SIZE
    for (let i = USER_MSG_OFFSET; i < dataChunkSize; i++) {
      this.fullData[index++] = dataChunk[i]
    }
    if (this.currentSize === this.fullData.byteLength) {
      this.action(this.fullData.buffer)
    }
  }
}

class ChannelBuilderService extends ServiceInterface {
  connectTo (wc, id) {
    return new Promise((resolve, reject) => {
      this.setPendingRequest(wc, id, {resolve, reject})
      let connectors = this.availableConnectors(wc)
      wc.sendInnerTo(id, this.id, {
        connectors,
        sender: wc.myId,
        botUrl: wc.settings.bot,
        oneMsg: true
      })
    })
  }

  availableConnectors (wc) {
    let connectors = []
    if (webRTCAvailable) connectors[connectors.length] = WEBRTC
    if (listenOnWebSocket) connectors[connectors.length] = WEBSOCKET
    let forground = wc.settings.connector
    if (connectors.length !== 1 && connectors[0] !== forground) {
      let tmp = connectors[0]
      connectors[0] = connectors[1]
      connectors[1] = tmp
    }
    return connectors
  }

  onChannel (wc, channel, oneMsg, sender) {
    wc.initChannel(channel, sender)
      .then(channel => {
        if (oneMsg) this.getPendingRequest(wc, sender).resolve(channel)
      })
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    if (msg.connectors.includes(WEBSOCKET)) {
      // A Bot server send the message
      // Try to connect in WebSocket
      provide(WEBSOCKET).connect(msg.botUrl)
        .then(channel => {
          let msgBld = provide(MESSAGE_BUILDER)
          channel.send(msgBld.msg(JOIN, wc.myId, null, {
            wcId: this.id,
            oneMsg: msg.oneMsg
          }))
          this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
        })
        .catch(() => {
          provide(WEBRTC).connectOverWebChannel(wc, msg.sender)
            .then(channel => {
              this.onChannel(wc, channel, !msg.oneMsg, msg.sender)
            })
        })
    } else {
      let connectors = this.availableConnectors(wc)
      if (connectors.includes(WEBSOCKET)) {
        // The peer who send the message doesn't listen in WebSocket and i'm bot
        wc.sendInnerTo(msg.sender, this.id, {
          connectors,
          sender: wc.myId,
          botUrl: wc.settings.bot,
          oneMsg: false
        })
      } else {
        // The peer who send the message doesn't listen in WebSocket and doesn't listen too
        provide(WEBRTC).connectOverWebChannel(wc, msg.sender)
          .then(channel => this.onChannel(wc, channel, !msg.oneMsg, msg.sender))
      }
    }
  }
}

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
const WEBRTC = 0

/**
 * Constant used to get an instance of {@link WebSocketService}.
 * @type {string}
 */
const WEBSOCKET = 1

const CHANNEL_BUILDER = 2

/**
 * Constant used to get an instance of {@link FullyConnectedService}.
 * @type {string}
 */
const FULLY_CONNECTED = 3

/**
 * Constant used to get an instance of {@link MessageBuilderService}. It is a
 * singleton service.
 * @type {string}
 */
const MESSAGE_BUILDER = 4

/**
 * Contains services who are singletons.
 * @type {string}
 */
const services = new Map()

/**
 * Provides the service instance specified by `id`.
 *
 * @param  {(module:serviceProvider.MESSAGE_BUILDER|
 *          module:serviceProvider.WEBRTC|
            module:serviceProvider.WEBSOCKET|
 *          module:serviceProvider.FULLY_CONNECTED)} id - The service id.
 * @param  {Object} [options] - Any options that the service accepts.
 * @return {module:service~ServiceInterface} - Service instance.
 * @throws An error if the service id is unknown
 */
let provide = function (id, options = {}) {
  if (services.has(id)) {
    return services.get(id)
  }
  let service
  switch (id) {
    case WEBRTC:
      return new WebRTCService(WEBRTC, options)
    case WEBSOCKET:
      return new WebSocketService(WEBSOCKET)
    case CHANNEL_BUILDER:
      return new ChannelBuilderService(CHANNEL_BUILDER)
    case FULLY_CONNECTED:
      service = new FullyConnectedService(FULLY_CONNECTED)
      services.set(id, service)
      return service
    case MESSAGE_BUILDER:
      service = new MessageBuilderService(MESSAGE_BUILDER)
      services.set(id, service)
      return service
    default:
      throw new Error(`Unknown service id: "${id}"`)
  }
}

/**
 * Wrapper class for {@link external:RTCDataChannel} and
 * {@link external:WebSocket}.
 */
class Channel {
  /**
   * Creates *Channel* instance from existing data channel or web socket, assigns
   * it to the specified *WebChannel* and gives him an identifier.
   * @param {external:WebSocket|external:RTCDataChannel} - Data channel or web
   * socket
   * @param {WebChannel} - The *WebChannel* this channel will be part of
   * @param {number} peerId - Identifier of the peer who is at the other end of
   * this channel
   */
  constructor (channel) {
    /**
     * Data channel or web socket.
     * @private
     * @type {external:WebSocket|external:RTCDataChannel}
     */
    this.channel = channel

    /**
     * The *WebChannel* which this channel belongs to.
     * @type {WebChannel}
     */
    this.webChannel = null

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = -1

    if (isBrowser()) {
      channel.binaryType = 'arraybuffer'
      this.send = this.sendBrowser
    } else if (isSocket(channel)) {
      this.send = this.sendInNodeThroughSocket
    } else {
      channel.binaryType = 'arraybuffer'
      this.send = this.sendInNodeThroughDataChannel
    }
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageBuilderService}
   * @see {@link MessageBuilderService#msg}, {@link MessageBuilderService#handleUserMessage}
   * @param {external:ArrayBuffer} data - Message
   */
  sendBrowser (data) {
    // if (this.channel.readyState !== 'closed' && new Int8Array(data).length !== 0) {
    if (this.isOpen()) {
      try {
        this.channel.send(data)
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  sendInNodeThroughSocket (data) {
    if (this.isOpen()) {
      try {
        this.channel.send(data, {binary: true})
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  sendInNodeThroughDataChannel (data) {
    this.sendBrowser(data.slice(0))
  }

  set onMessage (handler) {
    if (!isBrowser() && isSocket(this.channel)) {
      this.channel.onmessage = msgEvt => {
        let ab = new ArrayBuffer(msgEvt.data.length)
        let view = new Uint8Array(ab)
        for (let i = 0; i < msgEvt.data.length; i++) {
          view[i] = msgEvt.data[i]
        }
        handler(ab)
      }
    } else this.channel.onmessage = msgEvt => handler(msgEvt.data)
  }

  set onClose (handler) {
    this.channel.onclose = closeEvt => {
      if (this.webChannel !== null && handler(closeEvt)) {
        this.webChannel.members.splice(this.webChannel.members.indexOf(this.peerId), 1)
        this.webChannel.onLeaving(this.peerId)
      } else handler(closeEvt)
    }
  }

  set onError (handler) {
    this.channel.onerror = evt => handler(evt)
  }

  clearHandlers () {
    this.onmessage = () => {}
    this.onclose = () => {}
    this.onerror = () => {}
  }

  isOpen () {
    let state = this.channel.readyState
    return state === 1 || state === 'open'
  }

  /**
   * Close the channel.
   */
  close () {
    this.channel.close()
  }
}

/**
 * This class represents a door of the *WebChannel* for this peer. If the door
 * is open, then clients can join the *WebChannel* through this peer, otherwise
 * they cannot.
 */
class WebChannelGate {

  /**
   * When the *WebChannel* is open, any clients should you this data to join
   * the *WebChannel*.
   * @typedef {Object} WebChannelGate~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * @typedef {Object} WebChannelGate~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * @param {WebChannelGate~onClose} onClose - close event handler
   */
  constructor (onClose = () => {}) {
    /**
     * Web socket which holds the connection with the signaling server.
     * @private
     * @type {external:WebSocket}
     */
    this.ws = null

    /**
     * // TODO: add doc
     * @type {WebChannelGate~AccessData}
     */
    this.accessData = {}

    /**
     * Close event handler.
     * @private
     * @type {WebChannelGate~onClose}
     */
    this.onClose = onClose
  }

  /**
   * Open the door.
   * @param {external:WebSocket} socket - Web socket to signalign server
   * @param {WebChannelGate~AccessData} accessData - Access data to join the
   * *WebChannel
   */
  open (onChannel, options) {
    let url = options.signaling

    return new Promise((resolve, reject) => {
      let webRTCService = provide(WEBRTC)
      let webSocketService = provide(WEBSOCKET)
      let key = 'key' in options ? options.key : this.generateKey()
      webSocketService.connect(url)
        .then(ws => {
          ws.onclose = closeEvt => {
            this.onClose(closeEvt)
            reject(closeEvt.reason)
          }
          ws.onerror = err => {
            console.log('ERROR: ', err)
            reject(err.message)
          }
          ws.onmessage = evt => {
            let msg
            try {
              msg = JSON.parse(evt.data)
            } catch (err) {
              reject('Server responce is not a JSON string: ' + err.message)
            }
            if ('isKeyOk' in msg) {
              if (msg.isKeyOk) {
                webRTCService.listenFromSignaling(ws, onChannel)

                resolve(this.accessData)
              } else {
                reject(`The key: ${key} is not suitable`)
              }
            } else {
              reject(`Unknown server message: ${evt.data}`)
            }
          }
          this.ws = ws
          this.accessData.key = key
          this.accessData.url = url
          ws.send(JSON.stringify({key}))
        })
        .catch(reject)
    })
  }

  /**
   * Check if the door is opened or closed.
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.ws !== null && this.ws.readyState === OPEN
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.ws.close()
      this.accessData = {}
      this.ws = null
    }
  }

  /**
   * Generate random key which will be used to join the *WebChannel*.
   * @private
   * @returns {string} - Generated key
   */
  generateKey () {
    const MIN_LENGTH = 5
    const DELTA_LENGTH = 0
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * (MASK.length - 1))]
    }
    return result
  }
}

const msgBld = provide(MESSAGE_BUILDER)

/**
 * Maximum identifier number for {@link WebChannel#generateId} function.
 * @type {number}
 */
const MAX_ID = 4294967295

/**
 * Timout for ping *WebChannel* in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000

const ID_TIMEOUT = 10000

/**
 * One of the internal message type. It's a peer message.
 * @type {number}
 */
const USER_DATA = 1

/**
 * One of the internal message type. This message should be threated by a
 * specific service class.
 * @type {number}
 */
const INNER_DATA = 2

const INITIALIZATION = 3

/**
 * One of the internal message type. Ping message.
 * @type {number}
 */
const PING = 4

/**
 * One of the internal message type. Pong message, response to the ping message.
 * @type {number}
 */
const PONG = 5

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the *WebChannel* can invite another person to join
 * the *WebChannel* and he also possess enough information to be able to add it
 * preserving the current *WebChannel* structure (network topology).
 */
class WebChannel {

  /**
   * When the *WebChannel* is open, any clients should you this data to join
   * the *WebChannel*.
   * @typedef {Object} WebChannel~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * *WebChannel* constructor. *WebChannel* can be parameterized in terms of
   * network topology and connector technology (WebRTC or WebSocket. Currently
   * WebRTC is only available).
   * @param  {Object} [options] *WebChannel* configuration
   * @param  {string} [options.topology=FULLY_CONNECTED] Defines the network
   *            topology
   * @param  {string} [options.connector=WEBRTC] Prioritizes this connection
   *            technology
   * @returns {WebChannel} Empty *WebChannel* without any connection.
   */
  constructor (options = {}) {
    this.defaults = {
      connector: WEBRTC,
      topology: FULLY_CONNECTED,
      signaling: 'wss://sigver-coastteam.rhcloud.com:8443',
      bot: 'ws://localhost:9000'
    }
    this.settings = Object.assign({}, this.defaults, options)

    /**
     * Channels through which this peer is connected with other peers. This
     * attribute depends on the *WebChannel* topology. E. g. in fully connected
     * *WebChannel* you are connected to each other peer in the group, however
     * in the star structure this attribute contains only the connection to
     * the central peer.
     * @private
     * @type {external:Set}
     */
    this.channels = new Set()

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
     // TODO: add type to doc
    this.onJoin

    /**
     * *WebChannel* topology.
     * @private
     * @type {string}
     */
    this.topology = this.settings.topology

    /**
     * An array of all peer ids except this.
     * @private
     * @type {Array}
     */
    this.members = []

    this.generatedIds = new Set()

    /**
     * @private
     * @type {number}
     */
    this.pingTime = 0

    /**
     * The *WebChannel* gate.
     * @private
     * @type {WebChannelGate}
     */
    this.gate = new WebChannelGate(closeEvt => this.onClose(closeEvt))

    /**
     * Unique identifier of this *WebChannel*. The same for all peers.
     * @readonly
     */
    this.id = this.generateId()

    /**
     * Unique peer identifier of you in this *WebChannel*. After each `join` function call
     * this id will change, because it is up to the *WebChannel* to assign it when
     * you join.
     * @readonly
     */
    this.myId = this.generateId()

    /**
     * Is the event handler called when a new peer has  joined the *WebChannel*.
     * @param {number} id - Id of the joined peer
     */
    this.onJoining = id => {}

    /**
     * Is the event handler called when a message is available on the *WebChannel*.
     * @param {number} id - Id of the peer who sent this message
     * @param {string|external:ArrayBufferView} data - Message
     * @param {boolean} isBroadcast - It is true if the message is sent via
     * [send]{@link WebChannel#send} method and false if it is sent via
     * [sendTo]{@link WebChannel#sendTo} method
     */
    this.onMessage = (id, msg, isBroadcast) => {}

    /**
     * Is the event handler called when a peer hes left the *WebChannel*.
     * @param {number} id - Id of the peer who has left
     */
    this.onLeaving = id => {}

    /**
     * Is the event handler called when the *WebChannel* has been closed.
     * @param {external:CloseEvent} id - Close event object
     */
    this.onClose = closeEvt => {}
  }

  /**
   * Enable other peers to join the *WebChannel* with your help as an
   * intermediary peer.
   * @param  {Object} [options] Any available connection service options
   * @returns {Promise} It is resolved once the *WebChannel* is open. The
   * callback function take a parameter of type {@link WebChannel~AccessData}.
   */
  open (options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return this.gate.open(channel => this.addChannel(channel), settings)
  }

  addChannel (channel) {
    return this.initChannel(channel)
      .then(channel => {
        let msg = msgBld.msg(INITIALIZATION, this.myId, channel.peerId, {
          manager: this.manager.id,
          wcId: this.id
        })
        channel.send(msg)
        return this.manager.add(channel)
      })
  }

  /**
    * Add a bot server to the network with his hostname and port
    *
    * @param {string} host - The hotname or the ip of the bot server to be add
    * @param {number} port - The port of the bot server to be add
    * @return {Promise} It resolves once the bot server joined the network
    */
  addBotServer (url) {
    return provide(WEBSOCKET).connect(url)
      .then(socket => {
        /*
          Once the connection open a message is sent to the server in order
          that he can join initiate the channel
        */
        socket.send(msgBld.msg(JOIN, this.myId, null, {wcId: this.id}))
        return this.addChannel(socket)
      })
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  close () {
    this.gate.close()
  }

  /**
   * If the *WebChannel* is open, the clients can join it through you, otherwise
   * it is not possible.
   * @returns {boolean} True if the *WebChannel* is open, false otherwise
   */
  isOpen () {
    return this.gate.isOpen()
  }

  /**
   * Get the data which should be provided to all clients who must join
   * the *WebChannel*. It is the same data which
   * {@link WebChannel#openForJoining} callback function provides.
   * @returns {WebChannel~AccessData|null} - Data to join the *WebChannel*
   * or null is the *WebChannel* is closed
   */
  getAccess () {
    return this.gate.accessData
  }

  /**
   * Join the *WebChannel*.
   * @param  {string} key - The key provided by one of the *WebChannel* members.
   * @param  {type} [options] - Any available connection service options.
   * @returns {Promise} It resolves once you became a *WebChannel* member.
   */
  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    let webSocketService = provide(WEBSOCKET)
    let wsWithSignaling
    let webRTCService = provide(WEBRTC)
    return new Promise((resolve, reject) => {
      this.onJoin = () => resolve(this)
      webSocketService.connect(settings.signaling)
        .then(ws => {
          wsWithSignaling = ws
          return webRTCService.connectOverSignaling(ws, key)
        })
        .then(channel => {
          wsWithSignaling.onclose = null
          wsWithSignaling.close()
          return this.initChannel(channel)
        })
        .catch(reject)
    })
  }

  /**
    * Allow a bot server to join the network by creating a connection
    * with the peer who asked his coming
    *
    * @param {Object} channel - The channel between the server and the pair
    * who requested the add
    * @return {Promise} It resolves once the the server has joined the network
    */
  joinAsBot (channel) {
    return new Promise((resolve, reject) => {
      this.onJoin = resolve
      this.initChannel(channel)
    })
  }

  // joinViaBot (key, url) {
  //   let webSocketService = provide(WEBSOCKET)
  //   let wsWithSignaling
  //   let webRTCService = provide(this.settings.connector)
  //   return new Promise((resolve, reject) => {
  //     this.onJoin = () => resolve(this)
  //     webSocketService.connect(settings.signaling)
  //       .then(ws => {
  //         wsWithSignaling = ws
  //         return webRTCService.connectOverSignaling(ws, key)
  //       })
  //       .then(channel => {
  //         wsWithSignaling.onclose = null
  //         wsWithSignaling.close()
  //         return this.initChannel(channel)
  //       })
  //       .catch(reject)
  //   })
  // }

  /**
   * Leave the *WebChannel*. No longer can receive and send messages to the group.
   */
  leave () {
    if (this.channels.size !== 0) {
      this.topology = this.settings.topology
      this.members = []
      this.pingTime = 0
      // this.gate.close()
      this.manager.leave(this)
    }
  }

  /**
   * Send the message to all *WebChannel* members.
   * @param  {string|external:ArrayBufferView} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      msgBld.handleUserMessage(data, this.myId, null, dataChunk => {
        this.manager.broadcast(this, dataChunk)
      })
    }
  }

  /**
   * Send the message to a particular peer in the *WebChannel*.
   * @param  {number} id - Id of the recipient peer
   * @param  {string|external:ArrayBufferView} data - Message
   */
  sendTo (id, data) {
    if (this.channels.size !== 0) {
      msgBld.handleUserMessage(data, this.myId, id, dataChunk => {
        this.manager.sendTo(id, this, dataChunk)
      }, false)
    }
  }

  /**
   * Get the ping of the *WebChannel*. It is an amount in milliseconds which
   * corresponds to the longest ping to each *WebChannel* member.
   * @returns {Promise}
   */
  ping () {
    if (this.members.length !== 0 && this.pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this.pingTime === 0) {
          this.pingTime = Date.now()
          this.maxTime = 0
          this.pongNb = 0
          this.pingFinish = delay => resolve(delay)
          this.manager.broadcast(this, msgBld.msg(PING, this.myId))
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else return Promise.resolve(0)
  }

  get topology () {
    return this.settings.topology
  }

  set topology (name) {
    this.settings.topology = name
    this.manager = provide(this.settings.topology)
  }

  onJoining$ (peerId) {
    this.members[this.members.length] = peerId
    this.onJoining(peerId)
  }

  onLeaving$ (peerId) {
    this.members.splice(this.members.indexOf(peerId), 1)
    this.onLeaving(peerId)
  }

  /**
   * Send a message to a service of the same peer, joining peer or any peer in
   * the *WebChannel*.
   * @private
   * @param  {string} serviceId - Service id
   * @param  {string} recepient - Identifier of recepient peer id
   * @param  {Object} [msg={}] - Message to send
   */
  sendInnerTo (recepient, serviceId, data, forward = false) {
    if (forward) {
      this.manager.sendInnerTo(recepient, this, data)
    } else {
      if (Number.isInteger(recepient)) {
        let msg = msgBld.msg(INNER_DATA, this.myId, recepient, {serviceId, data})
        this.manager.sendInnerTo(recepient, this, msg)
      } else {
        recepient.send(msgBld.msg(INNER_DATA, this.myId, recepient.peerId, {serviceId, data}))
      }
    }
  }

  sendInner (serviceId, data) {
    this.manager.broadcast(this, msgBld.msg(INNER_DATA, this.myId, null, {serviceId, data}))
  }

  /**
   * Message event handler (*WebChannel* mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} data - Message
   */
  onChannelMessage (channel, data) {
    let header = msgBld.readHeader(data)
    if (header.code === USER_DATA) {
      msgBld.readUserMessage(this, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast)
      })
    } else {
      let msg = msgBld.readInternalMessage(data)
      switch (header.code) {
        case INITIALIZATION:
          this.topology = msg.manager
          this.myId = header.recepientId
          this.id = msg.wcId
          channel.peerId = header.senderId
          break
        case INNER_DATA:
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            provide(msg.serviceId).onMessage(channel, header.senderId, header.recepientId, msg.data)
          } else this.sendInnerTo(header.recepientId, null, data, true)
          break
        case PING:
          this.manager.sendTo(header.senderId, this, msgBld.msg(PONG, this.myId))
          break
        case PONG:
          let now = Date.now()
          this.pongNb++
          this.maxTime = Math.max(this.maxTime, now - this.pingTime)
          if (this.pongNb === this.members.length) {
            this.pingFinish(this.maxTime)
            this.pingTime = 0
          }
          break
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
    if (id === -1) id = this.generateId()
    let channel = new Channel(ch)
    channel.peerId = id
    channel.webChannel = this
    channel.onMessage = data => this.onChannelMessage(channel, data)
    channel.onClose = closeEvt => this.manager.onChannelClose(closeEvt, channel)
    channel.onError = evt => this.manager.onChannelError(evt, channel)
    return Promise.resolve(channel)
  }

  /**
   * Generate random id for a *WebChannel* or a new peer.
   * @private
   * @returns {number} - Generated id
   */
  generateId () {
    do {
      let id = Math.ceil(Math.random() * MAX_ID)
      if (id === this.myId) continue
      if (this.members.includes(id)) continue
      if (this.generatedIds.has(id)) continue
      this.generatedIds.add(id)
      setTimeout(() => this.generatedIds.delete(id), ID_TIMEOUT)
      return id
    } while (true)
  }
}

class Bot {
  constructor (options = {}) {
    if (isBrowser()) throw new Error('Bot can be instanciated only in Node\'s environment')
    this.defaults = {
      host: '127.0.0.1',
      port: 9000,
      log: false
    }
    this.settings = Object.assign({}, this.defaults, options)

    this.server
    this.webChannels = []

    this.onWebChannel = wc => {
      // this.log('connected', 'Connected to the network')
      // this.log('id', wc.myId)
    }
  }

  listen (options = {}) {
    return new Promise((resolve, reject) => {
      this.settings = Object.assign({}, this.settings, options)
      let WebSocketServer = require('ws').Server
      this.server = new WebSocketServer({
        host: this.settings.host,
        port: this.settings.port
      }, () => resolve())

      this.server.on('error', () => {
        reject('WebSocketServerError with ws://' + this.settings.host + ':' + this.settings.port)
      })

      this.server.on('connection', socket => {
        let channel = new Channel(socket)
        let msgBld = provide(MESSAGE_BUILDER)
        channel.onMessage = data => {
          let header = msgBld.readHeader(data)
          let msg = msgBld.readInternalMessage(data)
          let wc = this.findWebChannel(msg.wcId)
          switch (header.code) {
            case JOIN:
              if (wc === null) {
                wc = new WebChannel({connector: WEBSOCKET})
                wc.joinAsBot(channel.channel).then(() => this.onWebChannel(wc))
              } else wc.addChannel(channel.channel)
              break
            case NEW_CHANNEL:
              if (wc !== null) {
                provide(CHANNEL_BUILDER).onChannel(wc, channel.channel, msg.oneMsg, header.senderId)
              }
              break
            default:
              channel.close()
          }
        }
      })
    })
  }

  addWebChannel (wc) {
    this.webChannels[this.webChannels.length] = wc
  }

  stopListen () {
    return this.server.close()
  }

  findWebChannel (id) {
    this.webChannels.forEach((wc, index) => {
      if (id === wc.id) {
        if (wc.members.length === 0) this.webChannels.splice(index, 1)
        else return wc
      }
    })
    return null
  }

  leave (WebChannel) {
    let index = -1
    for (let i = 0; i < this.webChannels.length; i++) {
      if (WebChannel.id === this.webChannels[i].id) {
        index = i
        break
      }
    }
    this.webChannels.splice(index, 1)[0].leave()
  }

  log (label, msg) {
    if (this.settings.log) {
      var d = new Date()
      let datetime = '' + d.toLocaleTimeString() + ' ' + d.toLocaleDateString()
      console.log('[', label.toUpperCase(), '] [', datetime, ']', msg)
    }
  }
}

exports.WebChannel = WebChannel;
exports.Bot = Bot;

Object.defineProperty(exports, '__esModule', { value: true });

})));