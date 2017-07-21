import fs from 'fs'
import string from 'rollup-plugin-string'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'

const entries = []
function read (path) {
  if (path.endsWith('test.js')) {
    entries.push(path)
  } else if (fs.statSync(path).isDirectory()) {
    const items = fs.readdirSync(path)
    for (let i of items) {
      read(path + '/' + i)
    }
  }
}
read('test')

const configs = []
for (let entry of entries) {
  configs.push({
    entry,
    format: 'cjs',
    dest: entry.replace(/^test/, 'test/.rolledup'),
    plugins: [
      string({
        include: 'test/**/*.txt'
      }),
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
  })
}

export default configs
