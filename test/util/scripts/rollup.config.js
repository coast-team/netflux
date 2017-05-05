const rollup = require('rollup')
const includePaths = require('rollup-plugin-includepaths')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')

const entries = [
  'test/util/scripts/botServer.js',
  'test/util/scripts/botForFirefox.js',
  'test/util/scripts/botForChrome.js',
  'test/util/scripts/botForNode.js'
]

for (let entry of entries) {
  const dest = entry.replace(/scripts/, 'scripts/.rolledup')
  rollup.rollup({
    entry,
    plugins: [
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
    ]
  }).then(bundle => bundle.write({format: 'cjs', dest}))
    .catch(err => console.log(err))
}
