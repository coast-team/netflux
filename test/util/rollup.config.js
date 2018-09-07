import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-re'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'test/util/botServer.ts',
  output: {
    file: 'test/util/.botServer.js',
    format: 'cjs',
  },
  context: 'global',
  external: ['url', 'crypto', 'uws', 'text-encoding'],
  plugins: [
    typescript({
      include: ['src/**/*.ts', 'test/**/*.ts'],
    }),
    replace({
      patterns: [
        {
          test: /eval.*\(moduleName\);/g,
          replace: 'undefined;',
        },
      ],
    }),
    resolve({ preferBuiltins: true }),
    commonjs({
      namedExports: {
        'node_modules/protobufjs/minimal.js': ['Reader', 'Writer', 'util', 'roots'],
      },
    }),
  ],
}
