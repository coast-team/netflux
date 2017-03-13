# <p align="center">Netflux</p>

<p align="center">
  Javascript abstract peer to peer transport API for client and server.<br />
  Permits to create a fully connected peer to peer network based on WebRTC and WebSocket.<br />
  Allows to send/receive [String][String], [ArrayBuffer][ArrayBuffer], [TypedArray][TypedArray] data types over the network.
</p>

<p align="center">
  [![npm version][npm]][npm-url]&nbsp;
  [![Build Status][build]][build-url]&nbsp;
  [![semantic-release][semantic-release]][semantic-release-url]&nbsp;
  [![Join the chat at https://gitter.im/coast-team/netflux][gitter]][gitter-url]

  <br />

  [![Commitizen friendly][commitizen]][commitizen-url]&nbsp;
  [![bitHound Overall Score][bithound]][bithound-url]&nbsp;
  [![Code Climate][codeclimate]][codeclimate-url]&nbsp;
  [![Test Coverage][coverage]][coverage-url]&nbsp;
  [![Documentation][doc]][doc-url]
</p>

<p align="center">
  <img src="manual/asset/example_support.png" />
</p>

## Features
- Universal API (works in browser and server)
- Creates peer to peer full mesh network
- Allows to send/receive [String][String], [ArrayBuffer][ArrayBuffer], [TypedArray][TypedArray] data types.
- Allows mixed connections between peers ([WebSocket][WebSocket] or [RTCDataChannel][RTCDataChannel])
- Automatically chooses between [WebSocket][WebSocket] & [RTCDataChannel][RTCDataChannel]
- No server is mandatory, except signaling server ([Sigver][Sigver])
- Signaling and ICE server URLs are parameterized (see [doc page][Netflux:Configuration]), which allows to have the whole control over the peer to peer network
- Built with DEFAULT Signaling and STUN servers for easy quick start ([doc page][Netflux:Configuration])
- Each peer acts as a Signaling server to establish connection between two other peers (Signaling server is still mandatory for the first connection in the network, but this feature helps to reduce the Signaling server load)
- Provides 3 builds:
 - `dist/netflux.es5.module.browser.js` ES5 code, ES6 module for browser (exports `create` function and does not contain any NodeJS related code)
 - `dist/netflux.es5.module.node.js` ES5 code, ECMAScript 6 module for NodeJS (exports `create` function, plus `BotServer` class)
 - `dist/netflux.es5.umd.js` ES5 code, UMD module format for both browser and NodeJS
- `package.json` has `module` and `browser` attributes which understood be **Webpack**, **Browserify** or other module bundlers for easy consumption.

## Table of contents
 - [Installation](https://doc.esdoc.org/github.com/coast-team/netflux/manual/installation.html)
 - [Usage](https://doc.esdoc.org/github.com/coast-team/netflux/manual/usage.html)
 - [Configuration](https://doc.esdoc.org/github.com/coast-team/netflux/manual/configuration.html)
 - [Example](https://doc.esdoc.org/github.com/coast-team/netflux/manual/example.html)

Full documentation: https://doc.esdoc.org/github.com/coast-team/netflux

## API
`create` function is the start point, unless you are developing a peer bot, then consider using `BotServer` (see below). `create` functions return an object of type `WebChannel` which represents the peer to peer network.

 - [**create**(settings): WebChannel](https://doc.esdoc.org/github.com/coast-team/netflux/function/index.html#static-function-create)

 Members:
  - [**id**: number](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-id)
  - [**members**: number[]](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-members)
  - [**myId**: number**](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-myId)
  - [**onMessage**: function (peerId: number, msg: UserMessage, isBroadcast: boolean)**](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-onMessage)
  - [**onPeerJoin**: function (peerId: number)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-onPeerJoin)
  - [**onPeerLeave**: function (peerId: number)**](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-onPeerLeave)
  - [**onClose**: function (closeEvt: CloseEvent)**](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-member-onClose)

  Methods:

  ```
  Open method allows other peers to join your network.
  ```

  - [**open**([options: OpenData]): Promise<OpenData, string>](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-open)
  - [**getOpenData**(): OpenData | null](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-getOpenData)
  - [**isOpen**(): boolean](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-isOpen)
  - [**close**()](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-close)

  ```
  After someone has opened his network and has provided the key to you, you can join his network.
  ```
  - [**join**(keyOrSocket: string | WebSocket[, url: string]): Promise<undefined, string>](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-join)
  - [**leave**()](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-leave)

  ```
  Any member can invite a peer bot (server) to join this network.
  ```
  - [**invite**(urlOrSocket: string | WebSocket): Promise<undefined, string>](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-invite)

  ```
  Any member is allowed to send a message.
  ```
  - [**send**(message: UserMessage)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-send)
  - [**sendTo**(peerId: number, message: UserMessage)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-sendTo)

  ```
  Or ping.
  ```
  - [**ping**(): Promise<number, string>](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/WebChannel.js~WebChannel.html#instance-method-ping)
 - [**WEB_RTC**](https://doc.esdoc.org/github.com/coast-team/netflux/variable/index.html#static-variable-WEB_RTC) constant
 - [**WEB_SOCKET**](https://doc.esdoc.org/github.com/coast-team/netflux/variable/index.html#static-variable-WEB_SOCKET) constant
 - [**BotServer**(settings)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html)

   Members:

   - [**onWebChannel**: function (wc: WebChannel)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-member-onWebChannel)
   - [**webChannels**: WebChannel[]](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-member-webChannels)

   Methods:
   - [**start**(): Promise<undefined, string](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-method-start)
   - [**stop**()](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-method-stop)
   - [**addWebChannel**(wc: WebChannel)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-method-addWebChannel)
   - [**removeWebChannel**(wc: WebChannel)](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-method-removeWebChannel)
   - [**getWebChannel**(id: number): WebChannel | null](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-method-getWebChannel)


[WebSocket]: https://developer.mozilla.org/en/docs/Web/API/WebSocket
[RTCDataChannel]: https://developer.mozilla.org/en/docs/Web/API/RTCDataChannel
[String]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String
[ArrayBuffer]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[TypedArray]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
[Sigver]: https://github.com/coast-team/sigver
[Netflux:Configuration]: https://doc.esdoc.org/github.com/coast-team/netflux/manual/configuration/configuration.html

[npm]: https://img.shields.io/npm/v/netflux.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/netflux

[build]: https://travis-ci.org/coast-team/netflux.svg?branch=master
[build-url]: https://travis-ci.org/coast-team/netflux

[semantic-release]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release

[gitter]: https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square
[gitter-url]: https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge

[commitizen]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square
[commitizen-url]: http://commitizen.github.io/cz-cli

[bithound]: https://www.bithound.io/github/coast-team/netflux/badges/score.svg
[bithound-url]: https://www.bithound.io/github/coast-team/netflux

[codeclimate]: https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg
[codeclimate-url]: https://codeclimate.com/github/coast-team/netflux

[coverage]: https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg
[coverage-url]: https://codeclimate.com/github/coast-team/netflux/coverage

[doc]: https://doc.esdoc.org/github.com/coast-team/netflux/badge.svg
[doc-url]: https://doc.esdoc.org/github.com/coast-team/netflux
