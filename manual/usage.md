# Usage

There are 4 builds (all ES5 code):

* `dist/netflux.cjs.js` CommonJS format for NodeJS.
* `dist/esm/netflux.node.js` ECMAScript 6 module format for NodeJS.
* `dist/esm/netflux.browser.js` ECMAScript 6 module format for browsers.
* `dist/netflux.umd.js` UMD format for browsers.

The `package.json` contains the following fields:

```json
...
"main": "dist/netflux.cjs.js",
"module": "dist/esm/index.node.js",
"browser": "dist/esm/index.browser.js",
...
```

All builds are either for NodeJS or for Browser environment.

**For browser environment** exported members are:

* `WebGroup` class
* `WebGroupState` enum
* `SignalingState` enum
* `Topology` enum
* `DataType` type
* `WebGroupOption` type

**For NodeJS environment** exported members are the same as for browser plus:

* `Bot` class
* `BotOptions` type.

## CommonJS

`dist/netflux.cjs.js` - CommonJS format, built for NodeJS.

```Javascript
// NodeJS
const netflux = require('netflux')
var wg = new netflux.WebGroup()
```

## ES module

`esm/index.node.js` and `esm/index.browser.js` are suitable for Webpack, Browserify or any alike, which also undersands `package.json#module` and `package.json#module` properties respectively and can parse ES modules.

`esm/index.node.js` is build for NodeJS: contains all exported API members and all necessary polyfills for NodeJS environment.

`esm/index.browser.js` is build for browsers.

```javascript
export { WebGroup, WebGroupState, Bot, BotOptions } from 'netflux'
const wg = new WebGroup()
```

## UMD

`dist/netflux.umd.js` - Universal Module Definition format is compatible with AMD, CommonJS and "global" modules. Built for browser and suitable for Webpack, Browserify and any other who also understands `package.json#browser` property.

```html
<!-- Browser global usage example -->
<script src="netflux.es5.umd.js">
  window.netflux !== undefined // true
  var wg = new window.netflux.WebGroup()
</script>
```

## Configuration

For a `WebGroup` object all options are optional.

```javascript
// Example:
const wg = new WebGroup({
  signalingServer: 'MY_SIGNALING_URL',
  rtcConfiguration: {
    iceServers: [
      { urls: 'stun:mystun.org' },
      {
        urls: ['turn:myturn.org?transport=udp', 'turn:myturn.org?transport=tcp'],
        username: 'user',
        password: 'password',
      },
    ],
  },
})
```

For `Bot` the server option is mandatory.

```javascript
// Example:
const http = require('http')
const myServer = http.createServer()
const wg = new Bot({
  server: myServer,
  signalingServer: 'MY_SIGNALING_URL',
  webGroupOptions: {
    rtcConfiguration: {
      iceServers: [
        { urls: 'stun:mystun.org' },
        {
          urls: ['turn:myturn.org?transport=udp', 'turn:myturn.org?transport=tcp'],
          username: 'user',
          password: 'password',
        },
      ],
    },
  },
})
```
