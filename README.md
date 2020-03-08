# Netflux

![Netflux logo][logo]

Isomorphic Javascript **peer to peer** transport API for client and server.

Secure and fault tolerant full mesh peer to peer network based on **RTCDataChannel** and **WebSocket**.

Send/receive **String** and **Uint8Array** data types.

Documentation: <https://coast-team.github.io/netflux>

[![version](https://img.shields.io/npm/v/netflux.svg?style=flat-square)](https://www.npmjs.com/package/netflux)
[![travis](https://travis-ci.org/coast-team/netflux.svg?branch=master)](https://travis-ci.org/coast-team/netflux)

[![codeclimate](https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg)](https://codeclimate.com/github/coast-team/netflux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/65c5d6308e7e58edd7b0/test_coverage)](https://codeclimate.com/github/coast-team/netflux/test_coverage)
[![documentation](https://coast-team.github.io/netflux/badge.svg)](https://coast-team.github.io/netflux)

[![Conventional Changelog](https://img.shields.io/badge/changelog-conventional-brightgreen.svg?)](http://conventional-changelog.github.io)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square)](https://gitter.im/coast-team/netflux?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![Netflux example][netflux_example]

## Features

- Peer to peer full mesh network tolerant to connection failures.
- Same API for clients (Chrome, Firefox) and servers (NodeJS).
- Send private or broadcast messages with [String][string], [Uint8Array][uint8array] data types.
- Send large amounts of data (over the limit of ~16kb used in RTCDataChannel).
- Automatic rejoin the group when connection lost.
- Hide the connection nature ( [WebSocket][websocket] or [RTCDataChannel][rtcdatachannel]) from API consumer.
- All connections are encrypted.
- Full control over WebRTC servers: Signaling, STUN and TURN.
  - Deploy your own Signaling server ([Sigver][sigver]) or use the one provided by default.
  - Configure STUN and TURN servers.
- Small Signaling server payload.
- Signaling server is only used to establish connection between two peers, no user data is passing through it.
- TypeScript declaration files are included.
- Simple and familiar API usage.
- Multiple bundles to suit your workflow:
  - For NodeJS
    - `dist/netflux.node.es5.cjs.js` commonjs format, es5 code (see _package.json#main_).
    - `dist/netflux.node.es5.esm.js` ES module format, es5 code (see _package.json#module_).
  - For browsers
    - `dist/netflux.browser.es5.umd.js` UMD format, es5 code
    - `dist/netflux.browser.es5.esm.js` ES module format, es5 code (see _package.json#browser_).
    - `dist/netflux.browser.es2015.esm.js` ES module format, es2015 code (see _package.json#es2015_).
    - `dist/netflux.browser.esnext.esm.js` ES module format, esnext code (see _package.json#esnext_).

## Install

```shell
npm install netflux
```

3 peer dependencies to be installed in some cases:

- `rxjs` is necessary for both NodeJS and browsers if you want to take advantage of EcmaScript modules, tree-shaking etc. Otherwise it is already included into `dist/netflux.browser.es5.umd.js` and `dist/netflux.node.es5.cjs.js` bundles.

```shell
npm install rxjs
```

- `ws` and `text-encoding` if you target NodeJS (developing a bot):

```shell
npm install ws text-encoding
```

**Why peer dependencies?**

- Reduce the installation size by omitting unused dependencies.
- Take advantage of new standards and techniques: EcmaScript modules, bundle tools like Webpack, Rollup etc.

## Usage

Here is a basic usage example for client and server (checkout the [documenation](https://coast-team.github.io/netflux) for more details).

> Bot server is not mandatory. The group may completely be composed of clients only, as well as be composed of servers only or may also be mixed.

### Client example

```javascript
import { WebGroup, WebGroupState } from 'netflux'

// Create instance and set callbacks
const wg = new WebGroup()

wg.onMemberJoin = (id) => {
  console.log(`Member ${id} has joined. Current members list is: `, wg.members)
  // Say hello to the new peer
  wg.sendTo(id, 'Hello, my name is Bob')
}

wg.onMemberLeave = (id) => {
  console.log(`Member ${id} has left. Remained members are: `, wg.members)
}

wg.onMessage = (id, data) => {
  console.log(`Message from ${id} group member`, data)
}

wg.onStateChange = (state) => {
  console.log('The new Group state is ', state)
  switch (state) {
    case WebGroupState.JOINING:
      // Do something
      break
    case WebGroupState.JOINED:
      // Do something... for example invite a bot...
      wg.invite('BOT_SERVER_WEB_SOCKET_URL')
      // Or send message to all peers
      wg.send('Hello everybody. I have just joined the group.')
      break
    case WebGroupState.LEFT:
      // wg.key === ''
      // wg.id === 0
      // wg.myId === 0
      // wg.members === []
      // the current wg object is at the same state as if it was instantiated via new WebGroup(...), hence
      // it can be reused to join another group for example.
      // Do something...
      break
  }
}

// Join the group
wg.join('MY_UNIQUE_KEY_FOR_THE_GROUP')
```

### Bot example

```javascript
import { Bot, WebGroupState } from 'netflux'
const http = require('http') // https is also possible
const server = http.createServer()

const bot = new Bot({
  server: server,
  webGroupOptions: {
    // Any WebGroup options like for a client
  },
})

bot.onWebGroup = (wg) => {
  console.log('The current state is JOINING: ', wg.state === WebGroupState.JOINING)
  // New instance of a WebGroup (Someone has invited this bot).
  // See example above for client as it is the same API.
}

server.listen(BOT_PORT, _BOT_HOST)
// A client may invite this bot with the following URL: 'ws://BOT_HOST:BOT_PORT'
```

## Demo

Netflux used as a transport layer for Multi User Text Editor ([MUTE repo](https://github.com/coast-team/mute)) developed by our team. The demo version is available on: <https://coedit.re>.

[websocket]: https://developer.mozilla.org/en/docs/Web/API/WebSocket
[rtcdatachannel]: https://developer.mozilla.org/en/docs/Web/API/RTCDataChannel
[string]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String
[uint8array]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[sigver]: https://github.com/coast-team/sigver
[logo]: manual/asset/logo_760px.png
[netflux_example]: manual/asset/example.png
