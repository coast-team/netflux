import replace from 'rollup-plugin-replace'
import filesize from 'rollup-plugin-filesize'
import includePaths from 'rollup-plugin-includepaths'
import babel from 'rollup-plugin-babel'
import strip from 'rollup-plugin-strip'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default [
  // netflux.es5.umd.js
  {
    entry: 'src/index.node.js',
    format: 'umd',
    moduleName: 'netflux',
    dest: 'dist/netflux.es5.umd.js',
    plugins: [
      replace({
        WEB_RTC_MODULE: `Util.isBrowser() ? window : require('wrtc')`,
        WEB_SOCKET_MODULE: `Util.isBrowser() ? window.WebSocket : require('ws')`,
        TEXT_ENCODING_MODULE: `Util.isBrowser() ? window : require('text-encoding')`,
        EVENT_SOURCE_MODULE: `Util.isBrowser() ? window.EventSource : require('eventsource')`,
        FETCH_MODULE: `Util.isBrowser() ? window.fetch : require('node-fetch')`,
        LOG_LEVEL: `Level.WARN`
        // eval: '[eval][0]'
      }),
      strip({
        functions: [ 'log.info', 'log.debug', 'log.error', 'log.warn', 'log.trace', 'log.goupe' ]
      }),
      includePaths({
        paths: ['', 'src/'],
        extensions: ['.js']
      }),
      resolve({}),
      commonjs({
        include: 'node_modules/**',
        namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
      }),
      babel({
        exclude: 'node_modules/**'
      }),
      filesize({
        format: {
          round: 0
        }
      })
    ]
  },
  // netflux.es5.module.browser.js
  {
    entry: 'src/index.browser.js',
    format: 'es',
    dest: 'dist/netflux.es5.module.browser.js',
    plugins: [
      replace({
        WEB_RTC_MODULE: `window`,
        WEB_SOCKET_MODULE: `window.WebSocket`,
        TEXT_ENCODING_MODULE: `window`,
        EVENT_SOURCE_MODULE: `window.EventSource`,
        FETCH_MODULE: `window.fetch`,
        LOG_LEVEL: `Level.WARN`
      }),
      strip({
        functions: [ 'log.info', 'log.debug', 'log.error', 'log.warn', 'log.trace', 'log.goupe' ]
      }),
      includePaths({
        paths: ['', 'src/'],
        extensions: ['.js']
      }),
      resolve({}),
      commonjs({
        extensions: [ '.js' ],
        sourceMap: false,
        ignoreGlobal: false,
        namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
      }),
      babel({
        exclude: 'node_modules/**'
      }),
      filesize({
        format: {
          round: 0
        }
      })
    ]
  },
  {
    entry: 'src/index.node.js',
    format: 'es',
    dest: 'dist/netflux.es5.module.node.js',
    plugins: [
      replace({
        WEB_RTC_MODULE: `require('wrtc')`,
        WEB_SOCKET_MODULE: `require('uws')`,
        TEXT_ENCODING_MODULE: `require('text-encoding')`,
        EVENT_SOURCE_MODULE: `require('eventsource')`,
        FETCH_MODULE: `require('node-fetch')`,
        LOG_LEVEL: `Level.WARN`
      }),
      strip({
        functions: [ 'log.info', 'log.debug', 'log.error', 'log.warn', 'log.trace', 'log.goupe' ]
      }),
      includePaths({
        paths: ['', 'src/'],
        extensions: ['.js']
      }),
      resolve({}),
      commonjs({
        extensions: [ '.js' ],
        sourceMap: false,
        ignoreGlobal: false,
        namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
      }),
      babel({
        exclude: 'node_modules/**'
      }),
      filesize({
        format: {
          round: 0
        }
      })
    ]
  }
]
