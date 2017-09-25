![Netflux logo][logo]

Universal Javascript **peer to peer** transport API for client and server. Full mesh peer to peer network based on **RTCDataChannel** and **WebSocket**. Send/receive **String** and **Uint8Array** data types.


<p align="center">
  <a href="https://www.npmjs.com/package/netflux">
    <img src="https://img.shields.io/npm/v/netflux.svg?style=flat-square" />
  </a>&nbsp;
  <a href="https://travis-ci.org/coast-team/netflux">
    <img src="https://travis-ci.org/coast-team/netflux.svg?branch=master" />
  </a>&nbsp;
  <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square" />
  </a>&nbsp;
  <a href="https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
    <img src="https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square" />
  </a>

  <br />

  <a href="http://commitizen.github.io/cz-cli">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square" />
  </a>&nbsp;
  <a href="https://www.bithound.io/github/coast-team/netflux">
    <img src="https://www.bithound.io/github/coast-team/netflux/badges/score.svg" />
  </a>&nbsp;
  <a href="https://codeclimate.com/github/coast-team/netflux">
    <img src="https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg" />
  </a>&nbsp;
  <a href="https://coast-team.github.io/netflux/netflux">
    <img src="https://coast-team.github.io/netflux/badge.svg" />
  </a>
</p>

<p align="center">
  <img src="manual/asset/example_support.png" />
</p>

## Features
- Universal API (works in Chrome/Firefox and NodeJS).
- TypeScript declaration files are included.
- Create peer to peer full mesh network.
- Send/receive [String][String], [Uint8Array][Uint8Array] data types.
- Automatic rejoin when the connection with Signaling has lost.
- Automatic selection between [WebSocket][WebSocket] & [RTCDataChannel][RTCDataChannel].
- Full control over WebRTC servers: Signaling, STUN and TURN.
  - Deploy your own Signaling server ([Sigver][Sigver]) or use one provided by default.
  - Configure STUN and TURN servers.
- Small Signaling server payload: server is necessary to establish the first connection with
  one of the group member, then this member acts as a Signaling server to establish connections with the rest of the group members.
- 3 builds (ES5 code):
  - `dist/netflux.cjs.js` - CommonJS format for NodeJS (see *package.json#main*)
  - `dist/esm/index.node.js` - ES module format for NodeJS (see *package.json#module*).
  - `dist/netflux.umd.js` - UMD format for browsers (see *package.json#browser*).

## Demo
Netflux is used by our team for Multi User Text Editor ([MUTE repo](https://github.com/coast-team/mute)) development. The demo version is available on: https://www.coedit.re

[WebSocket]: https://developer.mozilla.org/en/docs/Web/API/WebSocket
[RTCDataChannel]: https://developer.mozilla.org/en/docs/Web/API/RTCDataChannel
[String]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String
[ArrayBuffer]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[TypedArray]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
[Sigver]: https://github.com/coast-team/sigver

[commitizen]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square
[commitizen-url]: http://commitizen.github.io/cz-cli

[bithound]: https://www.bithound.io/github/coast-team/netflux/badges/score.svg
[bithound-url]: https://www.bithound.io/github/coast-team/netflux

[codeclimate]: https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg
[codeclimate-url]: https://codeclimate.com/github/coast-team/netflux

[coverage]: https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg
[coverage-url]: https://codeclimate.com/github/coast-team/netflux/coverage

[doc]: https://coast-team.github.io/netflux/badge.svg
[doc-url]: https://coast-team.github.io/netflux/netflux

[logo]: manual/asset/logo_big.png "Netflux logo"
