# [![NPM](https://nodei.co/npm/netflux.png)](https://nodei.co/npm/netflux/) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Join the chat at https://gitter.im/coast-team/netflux](https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square)](https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)&nbsp;
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![bitHound Dependencies](https://www.bithound.io/github/coast-team/netflux/badges/dependencies.svg)](https://www.bithound.io/github/coast-team/netflux/master/dependencies/npm)&nbsp;
[![Dependency Status](https://david-dm.org/coast-team/netflux.svg?style=flat-square)](https://david-dm.org/coast-team/netflux)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/netflux/dev-status.svg?style=flat-square)](https://david-dm.org/coast-team/netflux#info=devDependencies)&nbsp;

[![Build Status](https://travis-ci.org/coast-team/netflux.svg?branch=master)](https://travis-ci.org/coast-team/netflux)&nbsp;
[![bitHound Overall Score](https://www.bithound.io/github/coast-team/netflux/badges/score.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![Code Climate](https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg)](https://codeclimate.com/github/coast-team/netflux)&nbsp;
[![Test Coverage](https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg)](https://codeclimate.com/github/coast-team/netflux/coverage)&nbsp;
[![Inline docs](http://inch-ci.org/github/coast-team/netflux.svg?branch=master&style=flat-square)](http://inch-ci.org/github/coast-team/netflux)

Abstract peer to peer transport API for client and server. Implementation based on WebRTC and WebSocket. Only raw data, no video or audio.

**Documentation:** https://coast-team.github.io/netflux

## Browsers & NodeJS support <sub><sup><sub><sub>made by @godban</sub></sub></sup></sub>

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/32px-Node.js_logo.svg.png" alt="NodeJS" width="32px" height="20px" />](http://godban.github.io/browsers-support-badges/)</br>NodeJS |
| --------- | --------- | --------- |
| last 2 versions| last 2 versions| 6 and above

## Install
```shell
npm install netflux
```

**Remark**: Might be a problem with `wrtc` package installation on some OS. This package is mandatory for using WebRTC in NodeJS (connect a peer machine via RTCDataChannel). Without this you can still use Netflux and connect via WebSocket, but if you need this package and you have trouble with its installation then:
- For Ubuntu 16.04 execute: `sudo apt-get install libexpat1-dev`
- For other systems take a look at package repository: https://github.com/js-platform/node-webrtc

## Usage
There are two builds in `dist` folder.

### ES2015 module (*package.json->jsnext:main*)
```shell
dist/netflux.es2015.js
```

### UMD module (*package.json->jsnext:main*)
```shell
dist/netflux.es2015.umd.js
```
 **CDN** (learn more [here](https://rawgit.com)): https://cdn.rawgit.com/coast-team/netflux/master/dist/netflux.es2015.umd.js



## Signaling server
We use our own signaling server: [Sigver](https://github.com/coast-team/sigver). It may also be used for production, but was initially developed for testing.

By default: `ws://sigver-coastteam.rhcloud.com:8000`

Also available: `wss://sigver-coastteam.rhcloud.com:8443`

**Remark**: Due to the rhcloud application hosting specification, following a period of inactivity, the server will be available after a while. Try it again a few seconds later.

## STUN/TURN servers
STUN by default: `stun:turn01.uswest.xirsys.com`

Unfortunately free TURN server is no longer available in the internet. So there is no one by default in Netflux. Some companies like [Xirsys](http://xirsys.com) provide such services.
