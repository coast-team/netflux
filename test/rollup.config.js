import fs from 'fs'
import string from 'rollup-plugin-string'
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
        namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
      })
    ]
  })
}

export default configs
