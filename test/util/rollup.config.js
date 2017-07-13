import includePaths from 'rollup-plugin-includepaths'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import string from 'rollup-plugin-string'
import resolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'test/util/botServer.js',
  format: 'cjs',
  dest: 'test/util/.botServer.js',
  plugins: [
    string({
      include: 'test/**/*.txt'
    }),
    includePaths({
      paths: ['', 'src', 'test'],
      extensions: ['.js']
    }),
    resolve({}),
    commonjs({
      extensions: [ '.js' ],
      sourceMap: false,
      ignoreGlobal: false,
      include: 'node_modules/**',
      namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
    }),
    replace({
      WEB_RTC_MODULE: `require('wrtc')`,
      WEB_SOCKET_MODULE: `require('uws')`,
      TEXT_ENCODING_MODULE: `require('text-encoding')`,
      EVENT_SOURCE_MODULE: `require('eventsource')`,
      FETCH_MODULE: `require('node-fetch')`,
      LOG_LEVEL: `Level.TRACE`
    })
  ]
}
