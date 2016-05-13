(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.nf = global.nf || {})));
}(this, function (exports) { 'use strict';

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
  class Interface$1 {

    /**
     * Service name which corresponds to its class name.
     *
     * @return {string} - name
     */
    get name () {
      return this.constructor.name
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
    constructor (id, intermediaryId) {
      /**
       * The joining peer id.
       *
       * @type {string}
       */
      this.id = id

      /**
       * The id of the peer who invited the joining peer to the web channel. It is
       * a member of the web channel and called an intermediary peer between the
       * joining peer and the web channel. The same value for all instances.
       *
       * @type {string}
       */
      this.intermediaryId = intermediaryId

      /**
       * The channel between the joining peer and intermediary peer. It is null
       * for every peer, but the joining and intermediary peers.
       *
       * @type {Channel}
       */
      this.intermediaryChannel = null

      /**
       * This attribute is proper to each peer. Array of channels which will be
       * added to the current peer once the joining peer become the member of the
       * web channel.
       *
       * @type {Array[Channel]}
       */
      this.channelsToAdd = []

      /**
       * This attribute is proper to each peer. Array of channels which will be
       * closed with the current peer once the joining peer become the member of the
       * web channel.
       *
       * @type {Array[Channel]}
       */
      this.channelsToRemove = []
    }

    /**
     * Add channel to `channelsToAdd` array.
     *
     * @param  {Channel} channel - Channel to add.
     */
    toAddList (channel) {
      this.channelsToAdd[this.channelsToAdd.length] = channel
    }

    /**
     * Add channel to `channelsToRemove` array
     *
     * @param  {Channel} channel - Channel to add.
     */
    toRemoveList (channel) {
      this.channelsToAdd[this.channelsToAdd.length] = channel
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
   * Connection service of the peer who received a message of this type should
   * establish connection with one or several peers.
   */
  const CONNECT_WITH = 1
  const CONNECT_WITH_FEEDBACK = 2
  const CONNECT_WITH_TIMEOUT = 5000
  const ADD_INTERMEDIARY_CHANNEL = 4
  const THIS_CHANNEL_TO_JOINING_PEER = 5

  /**
   * Each Web Channel Manager Service must implement this interface.
   * @interface
   * @extends module:service~Interface
   */
  class Interface extends Interface$1 {

    onMessage (wc, channel, msg) {
      let cBuilder = provide(wc.settings.connector, wc.settings)
      switch (msg.code) {
        case CONNECT_WITH:
          msg.peers = this.reUseIntermediaryChannelIfPossible(wc, msg.jpId, msg.peers)
          let failed = []
          if (msg.peers.length === 0) {
            wc.sendSrvMsg(this.name, msg.sender,
              {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed}
            )
          } else {
            let counter = 0
            msg.peers.forEach((id) => {
              cBuilder.connectMeTo(wc, id)
                .then((channel) => {
                  return wc.initChannel(channel, true, id)
                })
                .then((channel) => {
                  wc.getJoiningPeer(msg.jpId).toAddList(channel)
                  wc.sendSrvMsg(this.name, wc.myId,
                    {code: THIS_CHANNEL_TO_JOINING_PEER, id: msg.jpId, toBeAdded: true},
                    channel
                  )
                  counter++
                  if (counter === msg.peers.length) {
                    wc.sendSrvMsg(this.name, msg.sender,
                      {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed}
                    )
                  }
                })
                .catch((reason) => {
                  counter++
                  failed.push({id, reason})
                  if (counter === msg.peers.length) {
                    wc.sendSrvMsg(this.name, msg.sender,
                      {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed}
                    )
                  }
                })
            })
          }
          break
        case CONNECT_WITH_FEEDBACK:
          wc.connectWithRequests.get(msg.id)(true)
          break
        case ADD_INTERMEDIARY_CHANNEL:
          let jp = wc.getJoiningPeer(msg.jpId)
          jp.toAddList(jp.intermediaryChannel)
          break
        case THIS_CHANNEL_TO_JOINING_PEER:
          if (wc.hasJoiningPeer(msg.id)) {
            jp = wc.getJoiningPeer(msg.id)
          } else {
            jp = new JoiningPeer(msg.id)
            wc.addJoiningPeer(jp)
          }
          if (msg.toBeAdded) {
            jp.toAddList(this)
          } else {
            jp.toRemoveList(this)
          }
          break
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
    connectWith (wc, id, jpId, peers) {
      wc.sendSrvMsg(this.name, id,
        {code: CONNECT_WITH, jpId: jpId, sender: wc.myId, peers}
      )
      return new Promise((resolve, reject) => {
        wc.connectWithRequests.set(id, (isDone) => {
          if (isDone) {
            resolve()
          } else {
            reject()
          }
        })
        setTimeout(() => {
          reject('CONNECT_WITH_TIMEOUT')
        }, this.calculateConnectWithTimeout(peers.length))
      })
    }

    calculateConnectWithTimeout (nbPeers) {
      if (nbPeers > 0) {
        return CONNECT_WITH_TIMEOUT + Math.log10(nbPeers)
      } else {
        return CONNECT_WITH_TIMEOUT
      }
    }

    reUseIntermediaryChannelIfPossible (webChannel, jpId, ids) {
      let idToRemove = null
      let jp
      if (webChannel.isJoining()) {
        jp = webChannel.getJoiningPeer(jpId)
        if (ids.indexOf(jp.intermediaryId) !== -1) {
          idToRemove = jp.intermediaryId
        }
      } else {
        if (ids.indexOf(jpId) !== -1) {
          jp = webChannel.getJoiningPeer(jpId)
          if (jp.intermediaryChannel !== null) {
            idToRemove = jpId
          }
        }
      }
      if (idToRemove !== null) {
        jp.toAddList(jp.intermediaryChannel)
        webChannel.sendSrvMsg(this.name, idToRemove, {
          code: ADD_INTERMEDIARY_CHANNEL, jpId
        })
        ids.splice(ids.indexOf(idToRemove), 1)
      }
      return ids
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
   * Fully connected web channel manager. Implements fully connected topology
   * network, when each peer is connected to each other.
   *
   * @extends module:webChannelManager~Interface
   */
  class FullyConnectedService extends Interface {
    add (ch) {
      let wCh = ch.webChannel
      let peers = [wCh.myId]
      wCh.channels.forEach((ch) => {
        peers[peers.length] = ch.peerId
      })
      wCh.joiningPeers.forEach((jp) => {
        if (ch.peerId !== jp.id) {
          peers[peers.length] = jp.id
        }
      })
      return this.connectWith(wCh, ch.peerId, ch.peerId, peers)
    }

    broadcast (webChannel, data) {
      for (let c of webChannel.channels) {
        c.send(data)
      }
    }

    sendTo (id, webChannel, data) {
      for (let c of webChannel.channels) {
        if (c.peerId === id) {
          c.send(data)
          return
        }
      }
    }

    leave (webChannel) {}
  }

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
  class Interface$2 extends Interface$1 {
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
    open (key, onChannel, options) {
      throw new Error('Must be implemented by subclass!')
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
    join (key, options) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Establish a connection between you and another peer (including joining peer) via web channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel through which the connection will be established.
     * @param  {string} id - Peer id with whom you will be connected.
     * @return {Promise} - Resolved once the connection has been established, rejected otherwise.
     */
    connectMeTo (wc, id) {
      throw new Error('Must be implemented by subclass!')
    }
  }

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
  class RTCPendingConnections {
    constructor () {
      this.connections = new Map()
    }

    /**
     * Prepares pending connection for the specified peer only if it has not been added already.
     *
     * @param  {string} id - Peer id
     */
    add (id) {
      if (!this.connections.has(id)) {
        let pc = null
        let obj = {promise: null}
        obj.promise = new Promise((resolve, reject) => {
          Object.defineProperty(obj, 'pc', {
            get: () => pc,
            set: (value) => {
              pc = value
              resolve()
            }
          })
          setTimeout(reject, CONNECT_TIMEOUT, 'timeout')
        })
        this.connections.set(id, obj)
      }
    }

    /**
     * Remove a pending connection from the Map. Usually when the connection has already
     * been established and there is now interest to hold this reference.
     *
     * @param  {string} id - Peer id.
     */
    remove (id) {
      this.connections.delete(id)
    }

    /**
     * Returns RTCPeerConnection object for the provided peer id.
     *
     * @param  {string} id - Peer id.
     * @return {external:RTCPeerConnection} - Peer connection.
     */
    getPC (id) {
      return this.connections.get(id).pc
    }

    /**
     * Updates RTCPeerConnection reference for the provided peer id.
     *
     * @param  {string} id - Peer id.
     * @param  {external:RTCPeerConnection} pc - Peer connection.
     */
    setPC (id, pc) {
      this.connections.get(id).pc = pc
    }

    /**
     * When the remote description is set, it will add the ice candidate to the
     * peer connection of specified peer.
     *
     * @param  {string} id - Peer id.
     * @param  {external:RTCIceCandidate} candidate - Ice candidate.
     * @return {Promise} - Resolved once the ice candidate has been succesfully added.
     */
    addIceCandidate (id, candidate) {
      let obj = this.connections.get(id)
      return obj.promise.then(() => {
        return obj.pc.addIceCandidate(candidate)
      })
    }
  }


  const CONNECT_TIMEOUT = 2000
  const connectionsByWC = new Map()

  /**
   * Service class responsible to establish connections between peers via
   * `RTCDataChannel`.
   *
   * @see {@link external:RTCPeerConnection}
   * @extends module:channelBuilder~Interface
   */
  class WebRTCService extends Interface$2 {

    /**
     * WebRTCService constructor.
     *
     * @param  {Object} [options] - This service options.
     * @param  {Object} [options.signaling='wws://sigver-coastteam.rhcloud.com:8000'] -
     * Signaling server URL.
     * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
     * and TURN servers to be used.
     */
    constructor (options = {}) {
      super()
      this.defaults = {
        signaling: 'wws://sigver-coastteam.rhcloud.com:8000',
        iceServers: [
          {urls: 'stun:23.21.150.121'},
          {urls: 'stun:stun.l.google.com:19302'},
          {urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}
        ]
      }
      this.settings = Object.assign({}, this.defaults, options)
    }

    open (key, onChannel, options = {}) {
      let settings = Object.assign({}, this.settings, options)
      return new Promise((resolve, reject) => {
        let connections = new RTCPendingConnections()
        let socket
        try {
          socket = new window.WebSocket(settings.signaling)
        } catch (err) {
          reject(err.message)
        }
        // Send a message to signaling server: ready to receive offer
        socket.onopen = () => {
          try {
            socket.send(JSON.stringify({key}))
          } catch (err) {
            reject(err.message)
          }
          // TODO: find a better solution than setTimeout. This is for the case when the key already exists and thus the server will close the socket, but it will close it after this function resolves the Promise.
          setTimeout(resolve, 100, {key, url: settings.signaling, socket})
        }
        socket.onmessage = (evt) => {
          let msg = JSON.parse(evt.data)
          if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
            console.log('Unknown message from the signaling server: ' + evt.data)
            socket.close()
            return
          }
          connections.add(msg.id)
          if (Reflect.has(msg.data, 'offer')) {
            this.createPeerConnectionAndAnswer(
                (candidate) => socket.send(JSON.stringify({id: msg.id, data: {candidate}})),
                (answer) => socket.send(JSON.stringify({id: msg.id, data: {answer}})),
                onChannel,
                msg.data.offer
              ).then((pc) => connections.setPC(msg.id, pc))
              .catch((reason) => {
                console.error(`Answer generation failed: ${reason}`)
              })
          } else if (Reflect.has(msg.data, 'candidate')) {
            connections.addIceCandidate(
                msg.id,
                this.createIceCandidate(msg.data.candidate)
              ).catch((reason) => {
                console.error(`Adding ice candidate failed: ${reason}`)
              })
          }
        }
        socket.onclose = (closeEvt) => {
          if (closeEvt.code !== 1000) {
            console.error(`Socket with signaling server ${settings.signaling} has been closed with code ${closeEvt.code}: ${closeEvt.reason}`)
            reject(closeEvt.reason)
          }
        }
      })
    }

    join (key, options = {}) {
      let settings = Object.assign({}, this.settings, options)
      return new Promise((resolve, reject) => {
        let pc
        // Connect to the signaling server
        let socket = new WebSocket(settings.signaling)
        socket.onopen = () => {
          // Prepare and send offer
          this.createPeerConnectionAndOffer(
              (candidate) => socket.send(JSON.stringify({data: {candidate}})),
              (offer) => socket.send(JSON.stringify({join: key, data: {offer}})),
              resolve
            )
            .then((peerConnection) => { pc = peerConnection })
            .catch(reject)
        }
        socket.onmessage = (evt) => {
          try {
            let msg = JSON.parse(evt.data)
            // Check message format
            if (!Reflect.has(msg, 'data')) {
              reject(`Unknown message from the signaling server: ${evt.data}`)
            }

            if (Reflect.has(msg.data, 'answer')) {
              pc.setRemoteDescription(this.createSessionDescription(msg.data.answer))
                .catch(reject)
            } else if (Reflect.has(msg.data, 'candidate')) {
              pc.addIceCandidate(this.createIceCandidate(msg.data.candidate))
                .catch((evt) => {
                  // This exception does not reject the current Promise, because
                  // still the connection may be established even without one or
                  // several candidates
                  console.error('Adding candidate failed: ', evt)
                })
            } else {
              reject(`Unknown message from the signaling server: ${evt.data}`)
            }
          } catch (err) {
            reject(err.message)
          }
        }
        socket.onerror = (evt) => {
          reject('WebSocket with signaling server error')
        }
        socket.onclose = (closeEvt) => {
          if (closeEvt.code !== 1000) {
            reject(`Socket with signaling server ${settings.signaling} has been closed with code ${closeEvt.code}: ${closeEvt.reason}`)
          }
        }
      })
    }

    connectMeTo (wc, id) {
      return new Promise((resolve, reject) => {
        let sender = wc.myId
        let connections = this.getPendingConnections(wc)
        connections.add(id)
        this.createPeerConnectionAndOffer(
          (candidate) => wc.sendSrvMsg(this.name, id, {sender, candidate}),
          (offer) => wc.sendSrvMsg(this.name, id, {sender, offer}),
          (channel) => {
            connections.remove(id)
            resolve(channel)
          }
        ).then((pc) => connections.setPC(id, pc))
        setTimeout(reject, CONNECT_TIMEOUT, 'Timeout')
      })
    }

    onMessage (wc, channel, msg) {
      let connections = this.getPendingConnections(wc)
      connections.add(msg.sender)
      if (Reflect.has(msg, 'offer')) {
        this.createPeerConnectionAndAnswer(
          (candidate) => wc.sendSrvMsg(this.name, msg.sender,
            {sender: wc.myId, candidate}),
          (answer) => wc.sendSrvMsg(this.name, msg.sender,
            {sender: wc.myId, answer}),
          (channel) => {
            wc.initChannel(channel, false, msg.sender)
            connections.remove(channel.peerId)
          },
          msg.offer
        ).then((pc) => {
          connections.setPC(msg.sender, pc)
        })
      } if (Reflect.has(msg, 'answer')) {
        connections.getPC(msg.sender)
          .setRemoteDescription(this.createSessionDescription(msg.answer))
          .catch((reason) => { console.error('Setting answer error: ' + reason) })
      } else if (Reflect.has(msg, 'candidate')) {
        connections.addIceCandidate(msg.sender, this.createIceCandidate(msg.candidate))
          .catch((reason) => { console.error('Setting candidate error: ' + reason) })
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
    createPeerConnectionAndOffer (onCandidate, sendOffer, onChannel) {
      let pc = this.createPeerConnection(onCandidate)
      let dc = pc.createDataChannel(null)
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          dc.onclose()
        }
      }
      dc.onopen = (evt) => onChannel(dc)
      return pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          sendOffer(pc.localDescription.toJSON())
          return pc
        })
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
    createPeerConnectionAndAnswer (onCandidate, sendAnswer, onChannel, offer) {
      let pc = this.createPeerConnection(onCandidate)
      pc.ondatachannel = (dcEvt) => {
        let dc = dcEvt.channel
        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'disconnected') {
            dc.onclose()
          }
        }
        dc.onopen = (evt) => onChannel(dc)
      }
      return pc.setRemoteDescription(this.createSessionDescription(offer))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          sendAnswer(pc.localDescription.toJSON())
          return pc
        })
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
      let pc = new RTCPeerConnection({iceServers: this.settings.iceServers})
      pc.onicecandidate = (evt) => {
        if (evt.candidate !== null) {
          let candidate = {
            candidate: evt.candidate.candidate,
            sdpMLineIndex: evt.candidate.sdpMLineIndex
          }
          onCandidate(candidate)
        }
      }
      return pc
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
    createIceCandidate (candidate) {
      return new RTCIceCandidate(candidate)
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
    createSessionDescription (sd) {
      return Object.assign(new RTCSessionDescription(), sd)
    }

    getPendingConnections (wc) {
      if (connectionsByWC.has(wc.id)) {
        return connectionsByWC.get(wc.id)
      } else {
        let connections = new RTCPendingConnections()
        connectionsByWC.set(wc.id, connections)
        return connections
      }
    }
  }

  // Max message size sent on Channel: 16kb
  const MAX_CHANNEL_MSG_BYTE_SIZE = 16384

  const USER_MSG_BYTE_OFFSET = 18

  const STRING_TYPE = 100

  const UINT8ARRAY_TYPE = 101

  const ARRAYBUFFER_TYPE = 102

  class MessageFormatter extends Interface$1 {
    splitUserMessage (data, code, senderId, recipientId, action) {
      const dataType = this.getDataType(data)
      let uInt8Array
      switch (dataType) {
        case STRING_TYPE:
          uInt8Array = new TextEncoder().encode(data)
          break
        case UINT8ARRAY_TYPE:
          uInt8Array = data
          break
        case ARRAYBUFFER_TYPE:
          uInt8Array = new Uint8Array(data)
          break
        default:
          return
      }

      const maxUserDataLength = this.getMaxMsgByteLength()
      const msgId = this.generateMsgId()
      const totalChunksNb = Math.ceil(uInt8Array.byteLength / maxUserDataLength)
      for (let chunkNb = 0; chunkNb < totalChunksNb; chunkNb++) {
        let chunkMsgByteLength = Math.min(maxUserDataLength, uInt8Array.byteLength - maxUserDataLength * chunkNb)
        let index = maxUserDataLength * chunkNb
        let totalChunkByteLength = USER_MSG_BYTE_OFFSET + chunkMsgByteLength
        let dataView = new DataView(new ArrayBuffer(totalChunkByteLength))
        dataView.setUint8(0, code)
        dataView.setUint8(1, dataType)
        dataView.setUint32(2, senderId)
        dataView.setUint32(6, recipientId)
        dataView.setUint16(10, msgId)
        dataView.setUint32(12, uInt8Array.byteLength)
        dataView.setUint16(16, chunkNb)
        let resultUint8Array = new Uint8Array(dataView.buffer)
        let j = USER_MSG_BYTE_OFFSET
        for (let i = index; i < index + chunkMsgByteLength; i++) {
          resultUint8Array[j++] = uInt8Array[i]
        }
        action(resultUint8Array)
      }
    }

    msg (code, data = {}) {
      let msgEncoded = (new TextEncoder()).encode(JSON.stringify(data))
      let i8array = new Uint8Array(1 + msgEncoded.length)
      i8array[0] = code
      let index = 1
      for (let i in msgEncoded) {
        i8array[index++] = msgEncoded[i]
      }
      return i8array
    }

    getMaxMsgByteLength () {
      return MAX_CHANNEL_MSG_BYTE_SIZE - USER_MSG_BYTE_OFFSET
    }

    generateMsgId () {
      const MAX = 16777215
      return Math.round(Math.random() * MAX)
    }

    getDataType (data) {
      if (typeof data === 'string' || data instanceof String) {
        return STRING_TYPE
      } else if (data instanceof Uint8Array) {
        return UINT8ARRAY_TYPE
      } else if (data instanceof ArrayBuffer) {
        return ARRAYBUFFER_TYPE
      }
      return 0
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
  const WEBRTC = 'WebRTCService'

  /**
   * Constant used to get an instance of {@link FullyConnectedService}.
   * @type {string}
   */
  const FULLY_CONNECTED = 'FullyConnectedService'

  const MESSAGE_FORMATTER = 'MessageFormatterService'

  const services = new Map()

  /**
   * Provides the service instance specified by `name`.
   *
   * @param  {(module:serviceProvider.CHANNEL_PROXY|
   *          module:serviceProvider.WEBRTC|
   *          module:serviceProvider.FULLY_CONNECTED)} name - The service name.
   * @param  {Object} [options] - Any options that the service accepts.
   * @return {module:service~Interface} - Service instance.
   */
  function provide (name, options = {}) {
    if (services.has(name)) {
      return services.get(name)
    }
    let service
    switch (name) {
      case WEBRTC:
        return new WebRTCService(options)
      case FULLY_CONNECTED:
        service = new FullyConnectedService()
        services.set(name, service)
        return service
      case MESSAGE_FORMATTER:
        service = new MessageFormatter()
        services.set(name, service)
        return service
      default:
        return null
    }
  }

  /**
   * Channel interface.
   * [RTCDataChannel]{@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
   * and
   * [WebSocket]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket}
   * implement it implicitly. Any other channel must implement this interface.
   *
   * @interface
   */
  class Channel {
    constructor (channel, webChannel, peerId) {
      channel.binaryType = 'arraybuffer'
      this.channel = channel
      this.webChannel = webChannel
      this.peerId = peerId
    }

    config () {
      this.channel.onmessage = (msgEvt) => { this.webChannel.onChannelMessage(this, msgEvt.data) }
      this.channel.onerror = (evt) => { this.webChannel.onChannelError(evt) }
      this.channel.onclose = (evt) => { this.webChannel.onChannelClose(evt) }
    }

    /**
     * send - description.
     *
     * @abstract
     * @param {string} msg - Message in stringified JSON format.
     */
    send (data) {
      if (this.channel.readyState !== 'closed') {
        this.channel.send(data)
      }
    }

    /**
     * Close channel.
     *
     * @abstract
     */
    close () {
      this.channel.close()
    }
  }

  const formatter$1 = provide(MESSAGE_FORMATTER)

  class Buffer {
    constructor (totalByteLength, action) {
      this.totalByteLength = totalByteLength
      this.currentByteLength = 0
      this.i8array = new Uint8Array(this.totalByteLength)
      this.action = action
    }

    add (data, chunkNb) {
      const maxSize = formatter$1.getMaxMsgByteLength()
      let intU8Array = new Uint8Array(data)
      this.currentByteLength += data.byteLength - USER_MSG_BYTE_OFFSET
      let index = chunkNb * maxSize
      for (let i = USER_MSG_BYTE_OFFSET; i < data.byteLength; i++) {
        this.i8array[index++] = intU8Array[i]
      }
      if (this.currentByteLength === this.totalByteLength) {
        this.action(this.i8array)
      }
    }
  }

  const formatter = provide(MESSAGE_FORMATTER)

  /**
   * Constant used to build a message designated to API user.
   * @type {int}
   */
  const USER_DATA = 0

  /**
   * Constant used to build a message designated to a specific service.
   * @type {int}
   */
  const SERVICE_DATA = 1
  /**
   * Constant used to build a message that a user has left Web Channel.
   * @type {int}
   */
  const LEAVE = 2
  /**
   * Constant used to build a message to be sent to a newly joining peer.
   * @type {int}
   */
  const JOIN_INIT = 3
  /**
   * Constant used to build a message to be sent to all peers in Web Channel to
   * notify them about a new peer who is about to join the Web Channel.
   * @type {int}
   */
  const JOIN_NEW_MEMBER = 4
  /**
   * Constant used to build a message to be sent to all peers in Web Channel to
   * notify them that the new peer who should join the Web Channel, refuse to join.
   * @type {int}
   */
  const REMOVE_NEW_MEMBER = 5
  /**
   * Constant used to build a message to be sent to a newly joining peer that he
   * has can now succesfully join Web Channel.
   * @type {int}
   */
  const JOIN_FINILIZE = 6
  /**
   * Constant used to build a message to be sent by the newly joining peer to all
   * peers in Web Channel to notify them that he has succesfully joined the Web
   * Channel.
   * @type {int}
   */
  const JOIN_SUCCESS = 7
  /**
   * @type {int}
   */
  const INIT_CHANNEL_PONG = 9

  /**
   * This class is an API starting point. It represents a group of collaborators
   * also called peers. Each peer can send/receive broadcast as well as personal
   * messages. Every peer in the `WebChannel` can invite another person to join
   * the *WebChannel* and he also possess enough information to be able to add it
   * preserving the current *WebChannel* structure (network topology).
   */
  class WebChannel {

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
    constructor (options = {}) {
      this.defaults = {
        connector: WEBRTC,
        topology: FULLY_CONNECTED
      }
      this.settings = Object.assign({}, this.defaults, options)

      /**
       * Channels through which this peer is connected with other peers. This
       * attribute depends on the `WebChannel` topology. E. g. in fully connected
       * `WebChannel` you are connected to each other peer in the group, however
       * in the star structure this attribute contains only the connection to
       * the central peer.
       *
       * @private
       */
      this.channels = new Set()

      /**
       * This event handler is used to resolve *Promise* in `WebChannel.join`.
       *
       * @private
       */
      this.onJoin

      /** @private */
      this.joiningPeers = new Set()
      /** @private */
      this.connectWithRequests = new Map()

      /** @private */
      this.topology = this.settings.topology

      // Public attributes

      /**
       * Unique identifier of this `WebChannel`. The same for all peers.
       * @readonly
       */
      this.id = this.generateId()

      /**
       * Unique peer identifier in this `WebChannel`. After each `join` function call
       * this id will change, because it is up to the `WebChannel` to assign it when
       * you join.
       *
       * @readonly
       */
      this.myId = this.generateId()

      this.buffers = new Map()

      this.onJoining = (id) => {}
      this.onMessage = (id, msg) => {}
      this.onLeaving = (id) => {}
    }

    /** Leave `WebChannel`. No longer can receive and send messages to the group. */
    leave () {
      let msg = formatter.msg(LEAVE, {id: this.myId})
      this.manager.broadcast(this, msg)
    }

    /**
     * Send broadcast message.
     *
     * @param  {string} data Message
     */
    send (data) {
      formatter.splitUserMessage(data, USER_DATA, this.myId, null, (dataChunk) => {
        this.manager.broadcast(this, dataChunk)
      })
    }

    /**
     * Send the message to a particular peer.
     *
     * @param  {type} id Peer id of the recipient peer
     * @param  {type} data Message
     */
    sendTo (id, data) {
      formatter.splitUserMessage(data, USER_DATA, this.myId, id, (dataChunk) => {
        this.manager.sendTo(id, this, dataChunk)
      })
    }

    /**
     * Enable other peers to join the `WebChannel` with your help as an intermediary
     * peer.
     *
     * @param  {Object} [options] Any available connection service options.
     * @return {string} The key required by other peer to join the `WebChannel`.
     */
    openForJoining (options = {}) {
      let settings = Object.assign({}, this.settings, options)

      let cBuilder = provide(settings.connector, settings)
      return cBuilder.open(this.generateKey(), (channel) => {
        this.initChannel(channel, false)
          .then((channel) => {
            let jp = new JoiningPeer(channel.peerId, this.myId)
            jp.intermediaryChannel = channel
            this.joiningPeers.add(jp)
            channel.send(formatter.msg(JOIN_INIT, {
              manager: this.settings.topology,
              id: channel.peerId,
              intermediaryId: this.myId})
            )
            this.manager.broadcast(this, formatter.msg(
              JOIN_NEW_MEMBER, {id: channel.peerId, intermediaryId: this.myId})
            )
            this.manager.add(channel)
              .then(() => channel.send(formatter.msg(JOIN_FINILIZE)))
              .catch((msg) => {
                this.manager.broadcast(this, formatter(
                  REMOVE_NEW_MEMBER, {id: channel.peerId})
                )
                this.removeJoiningPeer(jp.id)
              })
          })
      }).then((data) => {
        this.webRTCOpen = data.socket
        return {key: data.key, url: data.url}
      })
    }

    /**
     * Prevent other peers to join the `WebChannel` even if they have a key.
     */
    closeForJoining () {
      if (Reflect.has(this, 'webRTCOpen')) {
        this.webRTCOpen.close()
      }
    }

    /**
     * Join the `WebChannel`.
     *
     * @param  {string} key The key provided by a `WebChannel` member.
     * @param  {type} [options] Any available connection service options.
     * @return {Promise} It resolves once you became a `WebChannel` member.
     */
    join (key, options = {}) {
      let settings = Object.assign({}, this.settings, options)

      let cBuilder = provide(settings.connector, settings)
      return new Promise((resolve, reject) => {
        this.onJoin = () => resolve(this)
        cBuilder.join(key)
          .then((channel) => this.initChannel(channel, true))
          .catch(reject)
      })
    }

    /**
     *
     *
     * @private
     * @return {type}  description
     */
    isInviting () {}

    /**
     * has - description
     *
     * @private
     * @param  {type} peerId description
     * @return {type}        description
     */
    has (peerId) {
      for (let c of this.channels) {
        if (c.peerId === peerId) {
          return true
        }
      }
      return false
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
    sendSrvMsg (serviceName, recepient, msg = {}, channel = null) {
      let fullMsg = formatter.msg(
        SERVICE_DATA, {serviceName, recepient, data: Object.assign({}, msg)}
      )
      if (channel !== null) {
        channel.send(fullMsg)
        return
      }
      if (recepient === this.myId) {
        this.onChannelMessage(null, fullMsg)
      } else {
        // If this function caller is a peer who is joining
        if (this.isJoining()) {
          this.getJoiningPeer(this.myId)
            .intermediaryChannel
            .send(fullMsg)
        } else {
          // If the recepient is a joining peer
          if (this.hasJoiningPeer(recepient)) {
            let jp = this.getJoiningPeer(recepient)
            // If I am an intermediary peer for recepient
            if (jp.intermediaryId === this.myId) {
              jp.intermediaryChannel.send(fullMsg)
            // If not, then send this message to the recepient's intermediary peer
            } else {
              this.manager.sendTo(jp.intermediaryId, this, fullMsg)
            }
          // If the recepient is a member of webChannel
          } else {
            this.manager.sendTo(recepient, this, fullMsg)
          }
        }
      }
    }

    onChannelMessage (channel, data) {
      let decoder = new TextDecoder()
      let dataView = new DataView(data)
      let code = dataView.getUint8(0)
      if (code === USER_DATA) {
        let totalMsgByteLength = dataView.getUint32(12)
        let senderId = dataView.getUint32(2)
        if (totalMsgByteLength > formatter.getMaxMsgByteLength()) {
          let msgId = dataView.getUint32(10)
          let msgMap
          if (this.buffers.has(senderId)) {
            msgMap = this.buffers.get(senderId)
          } else {
            msgMap = new Map()
            this.buffers.set(senderId, msgMap)
          }
          let chunkNb = dataView.getUint16(16)
          if (msgMap.has(msgId)) {
            msgMap.get(msgId).add(dataView.buffer, chunkNb)
          } else {
            let buf = new Buffer(totalMsgByteLength, (i8array) => {
              this.onMessage(senderId, decoder.decode(i8array))
              msgMap.delete(msgId)
            })
            buf.add(dataView.buffer, chunkNb)
            msgMap.set(msgId, buf)
          }
        } else {
          let uInt8Array = new Uint8Array(data)
          let str = decoder.decode(uInt8Array.subarray(USER_MSG_BYTE_OFFSET, uInt8Array.byteLength))
          this.onMessage(senderId, str)
        }
        return
      } else {
        let msg = {}
        let uInt8Array = new Uint8Array(data)
        let str = decoder.decode(uInt8Array.subarray(1, uInt8Array.byteLength))
        msg = JSON.parse(str)
        let jp
        switch (code) {
          // case USER_DATA:
          //   this.webChannel.onMessage(msg.id, msg.data)
          //   break
          case LEAVE:
            this.onLeaving(msg.id)
            for (let c of this.channels) {
              if (c.peerId === msg.id) {
                this.channels.delete(c)
              }
            }
            break
          case SERVICE_DATA:
            if (this.myId === msg.recepient) {
              provide(msg.serviceName, this.settings).onMessage(this, channel, msg.data)
            } else {
              this.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
            }
            break
          case JOIN_INIT:
            this.topology = msg.manager
            this.myId = msg.id
            channel.peerId = msg.intermediaryId
            jp = new JoiningPeer(this.myId, channel.peerId)
            jp.intermediaryChannel = channel
            this.addJoiningPeer(jp)
            break
          case JOIN_NEW_MEMBER:
            this.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
            break
          case REMOVE_NEW_MEMBER:
            this.removeJoiningPeer(msg.id)
            break
          case JOIN_FINILIZE:
            this.joinSuccess(this.myId)
            this.manager.broadcast(this, formatter.msg(JOIN_SUCCESS, {id: this.myId}))
            this.onJoin()
            break
          case JOIN_SUCCESS:
            this.joinSuccess(msg.id)
            this.onJoining(msg.id)
            break
          case INIT_CHANNEL_PONG:
            channel.onPong()
            delete channel.onPong
            break
        }
      }
    }

    onChannelError (evt) {
      console.log('DATA_CHANNEL ERROR: ', evt)
    }

    onChannelClose (evt) {
      console.log('DATA_CHANNEL CLOSE: ', evt)
    }

    set topology (name) {
      this.settings.topology = name
      this.manager = provide(this.settings.topology)
    }

    get topology () {
      return this.settings.topology
    }

    initChannel (ch, isInitiator, id = -1) {
      return new Promise((resolve, reject) => {
        if (id === -1) { id = this.generateId() }
        let channel = new Channel(ch, this, id)
        // TODO: treat the case when the 'ping' or 'pong' message has not been received
        if (isInitiator) {
          channel.config()
          channel.onPong = () => resolve(channel)
          ch.send('ping')
        } else {
          ch.onmessage = (msgEvt) => {
            if (msgEvt.data === 'ping') {
              channel.config()
              channel.send(formatter.msg(INIT_CHANNEL_PONG))
              resolve(channel)
            }
          }
        }
      })
    }

    /**
     * joinSuccess - description
     *
     * @private
     * @param  {type} id description
     * @return {type}    description
     */
    joinSuccess (id) {
      let jp = this.getJoiningPeer(id)
      jp.channelsToAdd.forEach((c) => {
        this.channels.add(c)
        this.joiningPeers.delete(jp)
      })
    }

    /**
     * getJoiningPeer - description
     *
     * @private
     * @param  {type} id description
     * @return {type}    description
     */
    getJoiningPeer (id) {
      for (let jp of this.joiningPeers) {
        if (jp.id === id) {
          return jp
        }
      }
      throw new Error('Joining peer not found!')
    }

    /**
     * addJoiningPeer - description
     *
     * @private
     * @param  {type} jp description
     * @return {type}    description
     */
    addJoiningPeer (jp) {
      if (this.hasJoiningPeer(jp.id)) {
        throw new Error('Joining peer already exists!')
      }
      this.joiningPeers.add(jp)
    }

    /**
     * removeJoiningPeer - description
     *
     * @private
     * @param  {type} id description
     * @return {type}    description
     */
    removeJoiningPeer (id) {
      if (this.hasJoiningPeer(id)) {
        this.joiningPeers.delete(this.getJoiningPeer(id))
      }
    }

    /**
     * isJoining - description
     *
     * @private
     * @return {type}  description
     */
    isJoining () {
      for (let jp of this.joiningPeers) {
        if (jp.id === this.myId) {
          return true
        }
      }
      return false
    }

    /**
     * hasJoiningPeer - description
     *
     * @private
     * @param  {type} id description
     * @return {type}    description
     */
    hasJoiningPeer (id) {
      for (let jp of this.joiningPeers) {
        if (jp.id === id) {
          return true
        }
      }
      return false
    }

    /**
     * generateKey - description
     *
     * @private
     * @return {type}  description
     */
    generateKey () {
      const MIN_LENGTH = 2
      const DELTA_LENGTH = 0
      const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

      for (let i = 0; i < length; i++) {
        result += MASK[Math.round(Math.random() * (MASK.length - 1))]
      }
      return result
    }

    generateId () {
      const MAX = 16777215
      let id
      do {
        id = Math.floor(Math.random() * MAX)
        for (let c of this.channels) {
          if (c.peerId === id) {
            continue
          }
        }
        if (this.myId === id) {
          continue
        }
        break
      } while (true)
      return id
    }
  }

  exports.WebChannel = WebChannel;
  exports.WEBRTC = WEBRTC;
  exports.FULLY_CONNECTED = FULLY_CONNECTED;

}));