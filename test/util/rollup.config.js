import commonjs from 'rollup-plugin-commonjs'
import string from 'rollup-plugin-string'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

export default {
  entry: './test/util/botServer.js',
  format: 'cjs',
  dest: './test/util/.botServer.js',
  plugins: [
    typescript(),
    string({
      include: './test/util/*.txt'
    }),
    resolve({}),
    commonjs({
      extensions: [ '.js' ],
      sourceMap: false,
      ignoreGlobal: false,
      include: 'node_modules/**',
      namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
    })
  ]
}
