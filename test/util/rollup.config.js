import commonjs from 'rollup-plugin-commonjs'
import string from 'rollup-plugin-string'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-re'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'test/util/botServer.js',
  output: {
    file: 'test/util/.botServer.js',
    format: 'cjs'
  },
  plugins: [
    typescript(),
    string({
      include: 'test/**/*.txt'
    }),
    replace({
      defines: {
        BROWSER: false,
        NODE: true
      },
      patterns: [
        {
          test: /eval.*\(moduleName\);/g,
          replace: 'undefined;',
        }
      ]
    }),
    resolve(),
    commonjs({
      namedExports: {
        'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ]
      }
    })
  ]
}
