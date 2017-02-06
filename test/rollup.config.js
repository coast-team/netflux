const fs = require('fs')
const rollup = require('rollup')
const includePaths = require('rollup-plugin-includepaths')
const string = require('rollup-plugin-string')
const replace = require('rollup-plugin-replace')

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

for (let entry of entries) {
  const dest = entry.replace(/^test/, 'test/.rolledup')
  rollup.rollup({
    entry,
    plugins: [
      string({
        include: 'test/**/*.txt'
      }),
      includePaths({
        paths: ['', 'test/', 'src/'],
        extensions: ['.js', '.txt']
      }),
      replace({
        WEB_RTC_MODULE: `require('wrtc')`,
        WEB_SOCKET_MODULE: `require('ws')`,
        TEXT_ENCODING_MODULE: `require('text-encoding')`,
        EVENT_SOURCE_MODULE: `require('eventsource')`,
        FETCH_MODULE: `require('node-fetch')`
      })
    ]
  }).then(bundle => bundle.write({format: 'cjs', dest}))
    .catch(err => console.log(err))
}
