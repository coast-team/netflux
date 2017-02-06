# Usage
There are 3 builds in `dist` folder. Thus the `package.json` contains the following fields:
```json
...
"main": "dist/netflux.es5.umd.js",
"module": "dist/netflux.es5.module.node.js",
"browser": "dist/netflux.es5.module.browser.js",
...
```

* **netflux.es5.module.browser.js** - ES5 code, ES module, build for Browser
* **netflux.es5.module.node.js** - ES5 code, ES module, build for NodeJS
* **netflux.es5.umd.js** - ES5 code, UMD module, build for Browser & NodeJS


The first two files are suitable for tools like Webpack or Browserify (as they understand `module` and `browser` properties). The difference between them is that for Browser there is no reference of `require` function and in the build for NodeJS there is no reference of `window` global variable.

The third file is and UMD build (both `require` and `window` are preserved and the choice is made on Run Time). Can be consumed directly by Browser, NodeJS or a building tool.

## ES module
```
dist/netflux.es5.module.browser.js
dist/netflux.es5.module.node.js
```
Recommended for using along with `RollupJS`, `Webpack`, `SystemJS` or any other ES module loader.
```
import {create, BotServer, WEB_RTC, WEB_SOCKET} from 'netflux'
```

## UMD module
```
dist/netflux.es5.umd.js
```
Universal Module Definition module is compatible with AMD, CommonJS and "global" modules. It works in browser and NodeJS.
### Browser
```html
<script src="netflux.es5.umd.js">
  window.netflux !== undefined // true
</script>
```

**CDN**: https://cdn.rawgit.com/coast-team/netflux/v1.0.0-rc.13/dist/netflux.es5.umd.js


### NodeJS

```Javascript
const netflux = require('netflux')
```
