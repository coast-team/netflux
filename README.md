# [![NPM](https://nodei.co/npm/netflux.png)](https://nodei.co/npm/netflux/) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Join the chat at https://gitter.im/coast-team/netflux](https://badges.gitter.im/coast-team/netflux.svg?style=flat-square)](https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)&nbsp;
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![Build Status](https://travis-ci.org/coast-team/netflux.svg?branch=master)](https://travis-ci.org/coast-team/netflux)&nbsp;
[![bitHound Overall Score](https://www.bithound.io/github/coast-team/netflux/badges/score.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![bitHound Code](https://www.bithound.io/github/coast-team/netflux/badges/code.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![Code Climate](https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg)](https://codeclimate.com/github/coast-team/netflux)&nbsp;
[![Test Coverage](https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg)](https://codeclimate.com/github/coast-team/netflux/coverage)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/netflux/dev-status.svg)](https://david-dm.org/coast-team/netflux#info=devDependencies)

Abstract peer to peer client transport API. Implementations based on WebRTC and WebSocket to be done.

**Documentation:** https://coast-team.github.io/netflux

## Remark

When using API, it may not work from the first attempt. This is because WebRTC uses `ws://sigver-coastteam.rhcloud.com:8000` signaling server by default. Due to the rhcloud application hosting specification, following a period of inactivity, the server will be available after a while. Try it again a few seconds later.

## Supported browsers

*Chrome* 49 and above

*Firefox* 45 and above

## API specification (*warning*: alpha state)

### Remarks
Perhaps `WebChannel.openForJoining` and `WebChannel.closeForJoining` could be used in case of *WebRTC* and *WebSocket*. Maybe leave the possibility to the API user to decide either is an invite-only `WebChannel` or not. Lets implement and see.

___
### WebChannel
 See http://coast-team.github.io/netflux/WebChannel.html

  ## UML
  The Green and green/red parts (`Facade`, `WebChannel` and `Peer`) is what we consider to expose to the API user).

  The Gray parts represent some of internal elements of the API.

  The White parts are not yet implemented.

  ![Netflux UML class diagram](doc/uml.png)
