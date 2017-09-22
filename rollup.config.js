import filesize from 'rollup-plugin-filesize'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-re'
import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import uglify from 'rollup-plugin-uglify'

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
    output: [{ file: pkg.main, format: 'cjs', sourcemap: true }],
    plugins: [
      typescript(tsConfig),
      replace(replaceConfig),
      resolve(),
      commonjs(commonjsConfig),
      filesize(filesizeConfig)
    ]
  },
  {
    input: 'src/index.node.ts',
    output: [{ file: pkg.module, format: 'es', sourcemap: true }],
    plugins: [
      typescript({
        tsconfig: 'tsconfig.dist.esm.json',
        useTsconfigDeclarationDir: true
      }),
      replace(replaceConfig),
      resolve(),
      commonjs(commonjsConfig),
      filesize(filesizeConfig)
    ]
  },
  {
    input: 'src/index.browser.ts',
    output: { file: pkg.browser, format: 'umd', name: 'netflux', sourcemap: true },
    plugins: [
      typescript(tsConfig),
      replace(replaceConfig),
      resolve(),
      commonjs(commonjsConfig),
      filesize(filesizeConfig)
    ]
  },
  {
    input: 'src/index.browser.ts',
    output: { file: 'dist/netflux.umd.min.js', format: 'umd', name: 'netflux', sourcemap: true },
    plugins: [
      typescript(tsConfig),
      replace(replaceConfig),
      resolve(),
      commonjs(commonjsConfig),
      uglify(),
      filesize(filesizeConfig)
    ]
  }
]
