import filesize from 'rollup-plugin-filesize'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-re'
import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    external: ['wrtc', 'uws', 'text-encoding'],
    plugins: [
      typescript(),
      replace({
        defines: {
          WEBRTC_ADAPTER: false,
          NODE: true
        },
        patterns: [
          {
            test: /eval.*\(moduleName\);/g,
            replace: 'undefined;'
          }
        ]
      }),
      resolve(),
      commonjs({
        namedExports: {
          'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ]
        }
      }),
      filesize({ format: { round: 0 } })
    ]
  },
  {
    input: 'src/index.ts',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'netflux'
    },
    plugins: [
      typescript(),
      replace({
        defines: {
          WEBRTC_ADAPTER: true,
          NODE: false
        },
        patterns: [
          {
            test: /eval.*\(moduleName\);/g,
            replace: 'undefined;'
          }
        ]
      }),
      resolve(),
      commonjs({
        namedExports: {
          'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ]
        }
      }),
      filesize({ format: { round: 0 } })
    ]
  }
]
