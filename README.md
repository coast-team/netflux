# Netflux

[![NPM](https://nodei.co/npm/netflux.png)](https://npmjs.org/package/netflux>)&nbsp;
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;
[![Join the chat at https://gitter.im/coast-team/netflux](https://badges.gitter.im/coast-team/netflux.svg?style=flat-square)](https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![bitHound Overall Score](https://www.bithound.io/github/coast-team/netflux/badges/score.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![bitHound Code](https://www.bithound.io/github/coast-team/netflux/badges/code.svg)](https://www.bithound.io/github/coast-team/netflux)&nbsp;
[![Code Climate](https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg)](https://codeclimate.com/github/coast-team/netflux)&nbsp;
[![Test Coverage](https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg)](https://codeclimate.com/github/coast-team/netflux/coverage)

[![Build Status](https://travis-ci.org/coast-team/netflux.svg?branch=master)](https://travis-ci.org/coast-team/netflux)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/netflux/dev-status.svg)](https://david-dm.org/coast-team/netflux#info=devDependencies)&nbsp;

Abstract peer to peer client transport API. Implementations based on WebRTC and webSocket to be done.

## API specification (*warning*: early state)

### Facade

#### attributes

- **onPeerJoining**: function (new: *Peer*, oneOfMy: *Network*)
  * When the *new* peer has joined *oneOfMy* network.
- **onPeerLeaving**: function (left: *Peer*, oneOfMy: *Network*)
  * When the *left* peer has disconnected from *oneOfMy* network.
- **onBroadcastMessage**: function (from: Peer, to: Network, data: string)
  * When a message has arrived from on the network (someone in the network sent a broadcast message).
- **onPeerMessage**: function (from: *Peer*, data: *string*)
  * When some peer in the network has sent a message only to you.
- **onJoinRequest**: function (from: *Peer*,  requestData: *Object*)
  * When some peer in the network has sent you a join request via network. This peer wants you to join one of his network with which you are not connected yet. (see ***Peer.acceptJoinRequest*** and ***Peer.rejectJoinRequest***).

#### methods

- **create** (topology: *string*): *Network*
  * Create a new peer to peer network.
- **join** (serverURL: *string*): *Promise*
- .then (function (net: *Network*)): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Join network with server help. *serverURL* is obtained from a peer which started inviting (see *Network.startInviting*).
- **sendJoinRequest** (to: *Array [Peer]*, oneOfMy: *Network*)
  * Send join request message to peers via network to ask them to join *oneOfMy* network.

___
### Network

- **leave** (): *Promise*
- .then (function ()): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Disconnect from this network.
- **send** (to: *Peer*, data: *string*): *Promise*
- .then (function ()): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Send a message to some peer in this network.
- **broadcast** (data: *string*): *Promise
- .then (function ()): *Promise*
- .catch (function (err: *string*)): *Promise*
  * Send broadcast message to this network.
- **startInviting** (serverURL: *string*): *string*
  * Start inviting people to this network.
- **stopInviting** ()
  * Stop inviting people to this network.

___
### Peer

- **send** (data: *string*): *Promise*
- .then (function ()): *Promise*  
- .catch (function (err: *string*)): *Promise*
  * Send message to this peer via network.
- **sendJoinRequest** (oneOfMy: Network)
  * Send join request message to this peer via network to ask him to join *oneOfMy* network.
- **acceptJoinRequest** (requestData.id: *string*)
  * Accept join request received from this peer which has been sent by him with ***sendJoinRequest*** method.
- **rejectJoinRequest** (requestData.id: *string*)
  * Reject join request received from this peer which has been sent by him with ***sendJoinRequest*** method.

## UML
![Netflux UML class diagram](doc/UML.png)
