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
"module": "dist/esm/index.node.js",
"browser": "dist/netflux.umd.js",
...
```

All builds are either for NodeJS or for Browser environment.

**For browser environment** exported members are:
- `WebGroup`
- `WebGroupState` enum
- `SignalingState` enum
- `Topology` enum
- `DataType` type
- `WebGroupOption` type

**For NodeJS environment** exported members are the same as for browser plus:
- `WebGroupBotServer`
- `WebGroupBotServerOptions` type.

## CommonJS: netflux.cjs.js
`dist/netflux.cjs.js` - CommonJS format, built for NodeJS.

```Javascript
// NodeJS
const netflux = require('netflux')
var wg = new netflux.WebGroup()
```

## ES module: esm/index.node.js

`esm/index.node.js` is suitable for Webpack, Browserify or any alike, which also undersand `package.json#module` property. It is build for NodeJS: contains all exported API members and all necessary polyfills for NodeJS environment.

```javascript
export {WebGroup, WebGroupState, WebGroupBotServer, WebGroupBotServerOptions} from 'netflux'
const wg = new WebGroup()
```

## UMD
`dist/netflux.umd.js` - Universal Module Definition format is compatible with AMD, CommonJS and "global" modules. Built for browser and suitable for Webpack, Browserify and any other who
also understands `package.json#browser` property.

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
// Example:
const http = require('http')
const myServer = http.createServer()
const wg = new WebGroupBotServer({
  server: myServer,
  signalingURL: 'MY_SIGNALING_URL',
  webGroupOptions: {
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
  }
})
```
