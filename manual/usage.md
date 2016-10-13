There are two builds in `dist` folder:
```
dist/netflux.es2015.js
dist/netflux.es2015.umd.js
```

Both are ES2015 javascript code without transpiling or polyfills.

# ES2015 module
```
dist/netflux.es2015.js
```
Recommended for using along with `RollupJS`, `SystemJS` or any other ES2015 module loader.
If you consider to use Rollup, check [*jsnext:main*](https://github.com/rollup/rollup/wiki/jsnext:main). Netflux supports it.
```
import {create, BotServer, WEB_RTC, WEB_SOCKET} from 'netflux'
```

If you do not use *jsnext:main* then:
```
import {create, BotServer, WEB_RTC, WEB_SOCKET} from './node_modules/netflux/dist/netflux.es2015.js'
```

# UMD module
```
dist/netflux.es2015.umd.js
```
Universal Module Definition module is compatible with AMD, CommonJS and "global" modules. It works in browser and NodeJS.
## Browser
```html
<script src="netflux.es2015.umd.js">
  window.netflux !== undefined // true
</script>
```

**CDN**
 - Release: https://cdn.rawgit.com/coast-team/netflux/v1.0.0-rc.3/dist/netflux.es2015.umd.js (Instead of `v1.0.0-rc.3` you may specify one of the [available releases](https://github.com/coast-team/netflux/releases))
 - Nightly: https://github.com/coast-team/netflux/blob/master/dist/netflux.es2015.umd.js


## NodeJS

```Javascript
const netflux = require('netflux')
```
