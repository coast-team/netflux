import fs from 'fs'
import string from 'rollup-plugin-string'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

const inputs = []
function read (path) {
  if (path.endsWith('test.js')) {
    inputs.push(path)
  } else if (fs.statSync(path).isDirectory()) {
    const items = fs.readdirSync(path)
    for (let i of items) {
      read(path + '/' + i)
    }
  }
}
read('test')

const configs = []
for (let input of inputs) {
  configs.push({
    input,
    output: {
      file: entry.replace(/^test/, 'test/.rolledup'),
      format: 'cjs'
    },
    plugins: [
      typescript(),
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
