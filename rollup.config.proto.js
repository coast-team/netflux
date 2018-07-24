import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-re'
import typescript from 'rollup-plugin-typescript2'
import cleanup from 'rollup-plugin-cleanup'

export default [
  {
    input: 'src/proto/index.js',
    output: [{ file: 'src/proto/index.js', format: 'es' }],
    plugins: [
      replace({
        patterns: [
          {
            test: /eval.*\(moduleName\);/g,
            replace: 'undefined;',
          },
        ],
      }),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            allowJs: true,
            removeComments: true,
          },
        },
        include: ['src/proto/index.js'],
      }),
      resolve(),
      commonjs({
        namedExports: {
          'node_modules/protobufjs/minimal.js': ['Reader', 'Writer', 'util', 'roots'],
        },
      }),
      cleanup(),
    ],
  },
]
