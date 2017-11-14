import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-re'
import babel from 'rollup-plugin-babel'

export default [
  {
    output: [{ file: 'src/proto/index.js', format: 'es' }],
    plugins: [
      replace({
        patterns: [{
          test: /eval.*\(moduleName\);/g,
          replace: 'undefined;'
        }]
      }),
      resolve(),
      commonjs({
        namedExports: {
          'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ]
        }
      }),
      babel({
        babelrc: false,
        presets: [[
          "env",
          {
            modules: false
          }
        ]]
      })
    ]
  }
]
