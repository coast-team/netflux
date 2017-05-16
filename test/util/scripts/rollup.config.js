import includePaths from 'rollup-plugin-includepaths'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import string from 'rollup-plugin-string'

export default {
  entry: 'test/util/scripts/botServer.js',
  format: 'cjs',
  plugins: [
    string({
      include: 'test/**/*.txt'
    }),
    includePaths({
      paths: ['', 'src', 'test'],
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
      FETCH_MODULE: `require('node-fetch')`
    })
  ],
  dest: 'test/util/scripts/.rolledup/botServer.js'
}
