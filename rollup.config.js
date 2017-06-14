const replace = require('rollup-plugin-replace')
const rollup = require('rollup')
const filesize = require('rollup-plugin-filesize')
const includePaths = require('rollup-plugin-includepaths')
const babel = require('rollup-plugin-babel')
const strip = require('rollup-plugin-strip')
const commonjs = require('rollup-plugin-commonjs')

// netflux.es5.umd.js
rollup.rollup({
  entry: 'src/index.node.js',
  plugins: [
    strip({
      functions: [ 'log.info', 'log.debug', 'log.error', 'log.warn', 'log.trace', 'log.goupe' ]
    }),
    filesize({
      format: {
        round: 0
      }
    }),
    includePaths({
      paths: ['', 'src/'],
      extensions: ['.js']
    }),
    commonjs({
      extensions: [ '.js' ],
      sourceMap: false,
      ignoreGlobal: false
    }),
    replace({
      WEB_RTC_MODULE: `Util.isBrowser() ? window : require('wrtc')`,
      WEB_SOCKET_MODULE: `Util.isBrowser() ? window.WebSocket : require('ws')`,
      TEXT_ENCODING_MODULE: `Util.isBrowser() ? window : require('text-encoding')`,
      EVENT_SOURCE_MODULE: `Util.isBrowser() ? window.EventSource : require('eventsource')`,
      FETCH_MODULE: `Util.isBrowser() ? window.fetch : require('node-fetch')`,
      LOG_LEVEL: `Level.WARN`
    }),
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then((bundle) => {
  console.log('ES5 code, UMD, for Browser & NodeJS')
  bundle.write({
    format: 'umd',
    moduleName: 'netflux',
    dest: 'dist/netflux.es5.umd.js'
  })
}).catch(err => {
  console.log('Rollup error: ' + err.message)
})

// netflux.es5.module.browser.js
rollup.rollup({
  entry: 'src/index.browser.js',
  plugins: [
    filesize({
      format: {
        round: 0
      }
    }),
    includePaths({
      paths: ['', 'src/'],
      extensions: ['.js']
    }),
    commonjs({
      extensions: [ '.js' ],
      sourceMap: false,
      ignoreGlobal: false
    }),
    replace({
      WEB_RTC_MODULE: `window`,
      WEB_SOCKET_MODULE: `window.WebSocket`,
      TEXT_ENCODING_MODULE: `window`,
      EVENT_SOURCE_MODULE: `window.EventSource`,
      FETCH_MODULE: `window.fetch`,
      LOG_LEVEL: `Level.TRACE`
    }),
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then((bundle) => {
  console.log('ES5 code, ES module, for Browser')
  bundle.write({
    format: 'es',
    dest: 'dist/netflux.es5.module.browser.js'
  })
}).catch(err => {
  console.log('Rollup error: ' + err.message)
})

// netflux.es5.module.node.js
rollup.rollup({
  entry: 'src/index.node.js',
  plugins: [
    filesize({
      format: {
        round: 0
      }
    }),
    includePaths({
      paths: ['', 'src/'],
      extensions: ['.js']
    }),
    commonjs({
      extensions: [ '.js' ],
      sourceMap: false,
      ignoreGlobal: false
    }),
    replace({
      WEB_RTC_MODULE: `require('wrtc')`,
      WEB_SOCKET_MODULE: `require('uws')`,
      TEXT_ENCODING_MODULE: `require('text-encoding')`,
      EVENT_SOURCE_MODULE: `require('eventsource')`,
      FETCH_MODULE: `require('node-fetch')`,
      LOG_LEVEL: `Level.WARN`
    }),
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then((bundle) => {
  console.log('ES5 code, ES module for NodeJS')
  bundle.write({
    format: 'es',
    dest: 'dist/netflux.es5.module.node.js'
  })
}).catch(err => {
  console.log('Rollup error: ' + err.message)
})
