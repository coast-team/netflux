import filesize from 'rollup-plugin-filesize'
import babel from 'rollup-plugin-babel'
import strip from 'rollup-plugin-strip'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import pkg from './package.json'

const plugins = [
  strip({
    functions: [ 'log.info', 'log.debug', 'log.trace', 'log.goupe' ]
  }),
  resolve(),
  commonjs({
    namedExports: {
      'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ]
    }
  }),
  babel({
    exclude: 'node_modules/**'
  }),
  filesize({ format: { round: 0 } })
]

export default [
  {
    entry: 'src/index.js',
    targets: [
      { dest: pkg.main, format: 'cjs' },
      { dest: pkg.module, format: 'es' }
    ],
    external: ['wrtc', 'uws', 'text-encoding'],
    plugins
  },
  {
    entry: 'src/index.js',
    format: 'umd',
    moduleName: 'netflux',
    dest: pkg.browser,
    plugins
  }
]
