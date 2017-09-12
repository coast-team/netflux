# Usage
There are 4 builds (all ES5 code):
- `dist/netflux.cjs.js` CommonJS format for NodeJS.
- `dist/netflux.node.esm.js` ECMAScript 6 module format for NodeJS.
- `dist/netflux.browser.esm.js` ECMAScript 6 module format for browsers.
- `dist/netflux.umd.js` UMD format for browsers.

The `package.json` contains the following fields:
```json
...
"main": "dist/netflux.cjs.js",
"module": "dist/netflux.node.esm.js",
"browser": "netflux.browser.esm.js",
...
```

All builds are either for NodeJS or for Browser environment.

**For browser environment** exported members are:
- `WebGroup`
- `DataTypeView` type
- `WebGroupOption` type
- `WebGroupState` enum
- `SignalingState` enum
- `Topology` enum

**For NodeJS environment** exported members are the same as for browser plus:
- `WebGroupBotServer`
- `WebGroupBotServerOptions` type.

## ES module

 **Webpack, Browserify etc.**: `netflux.node.esm.js` and `netflux.browser.esm.js` are suitable for these tools or any alike (as they understand `module` and `browser` properties).

```javascript
export {WebGroup, WebGroupState, WebGroupBotServer, WebGroupBotServerOptions} from 'netflux'
const wg = new WebGroup()
```

## CommonJS
`dist/netflux.cjs.js` - CommonJS format, built for NodeJS.

```Javascript
// NodeJS
const netflux = require('netflux')
var wg = new netflux.WebGroup()
```

## UMD
`dist/netflux.umd.js` - Universal Module Definition module is compatible with AMD, CommonJS and "global" modules. Built for browser.

```html
<!--Browser-->
<script src="netflux.es5.umd.js">
  window.netflux !== undefined // true
  var wg = new window.netflux.WebGroup()
</script>
```

## Configuration
For a `WebGroup` object all options are optional.
```javascript
const wg = new WebGroup({
  signalingURL: 'MY_SIGNALING_URL',
  iceServers: [
    {
      urls: 'stun.l.google.com:19302'
    },
    {
      urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
      username: 'user',
      password: 'password'
    }
  ]
})
```

For `WebGroupBotServer` the server option is mandatory.
```javascript
const http = require('http')
const myServer = http.createServer()
const wg = new WebGroupBotServer({
  signalingURL: 'MY_SIGNALING_URL',
  iceServers: [
    {
      urls: 'stun.l.google.com:19302'
    },
    {
      urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
      username: 'user',
      password: 'password'
    }
  ],
  bot: {
    server: myServer
  }
})
```
