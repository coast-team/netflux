import filesize from 'rollup-plugin-filesize'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

const tsConfig =  { include: ['src/**/*.ts'] }
const commonjsConfig = {
  namedExports: {
    'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ]
  }
}
const filesizeConfig = { format: { round: 0 } }
const replaceConfig = {
  patterns: [{ test: /eval.*\(moduleName\);/g, replace: 'undefined;' }]
}

export default [
  {
    input: 'src/index.node.ts',
    output: [{ file: 'dist/netflux.cjs.js', format: 'cjs', sourcemap: true }],
    plugins: [
      typescript(tsConfig),
      resolve(),
      commonjs(commonjsConfig),
      filesize(filesizeConfig)
    ]
  },
  {
    input: 'src/index.browser.ts',
    output: { file: 'dist/netflux.umd.js', format: 'umd', name: 'netflux', sourcemap: true },
    plugins: [
      typescript(tsConfig),
      resolve(),
      commonjs(commonjsConfig),
      filesize(filesizeConfig)
    ]
  }
]
