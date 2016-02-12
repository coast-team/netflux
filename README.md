# [![NPM](https://nodei.co/npm/netflux.png)](https://nodei.co/npm/netflux/) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard) [![Join the chat at https://gitter.im/coast-team/netflux](https://badges.gitter.im/coast-team/netflux.svg?style=flat-square)](https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)&nbsp;[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![Build Status](https://travis-ci.org/coast-team/netflux.svg?branch=master)](https://travis-ci.org/coast-team/netflux)&nbsp;
[![bitHound Overall Score](https://www.bithound.io/github/coast-team/netflux/badges/score.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![bitHound Code](https://www.bithound.io/github/coast-team/netflux/badges/code.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![Code Climate](https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg)](https://codeclimate.com/github/coast-team/netflux)&nbsp;
[![Test Coverage](https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg)](https://codeclimate.com/github/coast-team/netflux/coverage)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/netflux/dev-status.svg)](https://david-dm.org/coast-team/netflux#info=devDependencies)

Abstract peer to peer client transport API. Implementations based on WebRTC and WebSocket to be done.

## Install

```
npm install
./node_modules/.bin/jspm install
```

## Run tests
Run test in several browsers.
```
npm test
```
Run test in browser X, where is X is `Chrome`, `Firefox` or `Opera`.
```
npm run testin X
```

## API specification (*warning*: early state)

### Remarks
Perhaps `WebChannel.openForJoining` and `WebChannel.closeForJoining` could be used in case of *WebRTC* and *WebSocket*. Maybe leave the possibility to the API user to decide either is an invite-only `WebChannel` or not. Lets implement and see.

### Facade

#### Attributes
- **onJoining**: function (someNew: *Peer*, oneOfMy: *WebChannel*)
  * When the *someNew* peer has joined the *oneOfMy* `WebChannel`.
- **onLeaving**: function (left: *Peer*, oneOfMy: *WebChannel*)
  * When the *left* peer has disconnected from the *oneOfMy* `WebChannel`.
- **onMessage**: function (from: Peer, to: WebChannel, data: string)
  * When a message has arrived from a `WebChannel`.
- **onPeerMessage**: function (from: *Peer*, data: *string*)
  * When some peer in the network has sent a message to you.
- **onInvite**: function (from: *Peer*,  data: *Object*)
  * When some peer in the network invites you to join one of his `WebChannel` and this using one of the `WebChannel` you are both connected to. (see `Peer.acceptInvite` and `Peer.rejectInvite`).

#### Methods
- **join** (key: *string*): *Promise*
- .then (function (net: *WebChannel*)): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Join a `WebChannel` by providing the *key*. *key* is obtained from one of the peers who called `WebChannel.openForJoining`.
- **invite** (to: *Array [Peer]*, oneOfMy: *WebChannel*)
  * Send an invitation request to peer(s) to join *oneOfMy* `WebChannel` via another `WebChannel`(s).

___
### WebChannel

#### Methods
- **onJoining**: function (someNew: *Peer*, oneOfMy: *WebChannel*)
  * When the *someNew* peer has joined the *oneOfMy* `WebChannel`.
- **onLeaving**: function (left: *Peer*, oneOfMy: *WebChannel*)
  * When the *left* peer has disconnected from the *oneOfMy* `WebChannel`.
- **onMessage**: function (from: Peer, to: WebChannel, data: string)
  * When a message has arrived from a `WebChannel`.

#### Attributes
- **leave** (): *Promise*
- .then (function ()): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Disconnect from this `WebChannel`.
- **send** (data: *string*): *Promise*
- .then (function ()): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Send broadcast message to this `WebChannel`.
- **openForJoining** (): *string*
  * Enable people to join this `WebChannel`. This method return a key which must be provided by newcomers in order to join this `WebChannel`.
- **closeForJoining** ()
  * Disable people to join this `WebChannel` even if they have a key.

___
### Peer

- **send** (data: *string*): *Promise*
- .then (function ()): *Promise*  
- .catch (function (err: *string*)): *Promise*
  * Send a message to this peer via `WebChannel`.
- **Invite** (oneOfMy: Network)
  * Send an invitation request to peer(s) to join *oneOfMy* `WebChannel` via another `WebChannel`.
- **acceptInvite** ()
  * Accept invitation received from this peer which has been sent by him with `invite` method.
- **rejectInvite** ()
  * Reject join request received from this peer which has been sent by him with `invite` method.

## UML
Green and green/red parts (`Facade`, `WebChannel` and `Peer`) is what we consider to expose to the API user).

Gray parts represent some of internal elements of the API and they might change in the future (maybe find a new name for *Topology*).

![Netflux UML class diagram](doc/UML.png)
