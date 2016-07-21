let rollup = require('rollup')
let includePaths = require('rollup-plugin-includepaths')

if (process.argv.length > 2 && process.argv[2].match('-(t|-test)')) {
  // Build test file for NodeJS
  let entry = process.argv[3]
  let dest = process.argv[4]
  let string = require('rollup-plugin-string')
  rollup.rollup({
    entry,
    plugins: [
      string({
        include: 'test/*.txt'
      }),
      includePaths({
        include: {},
        paths: ['', 'test/', 'src/'],
        external: [],
        extensions: ['.js', '.txt']
      })
    ]
  }).then((bundle) => bundle.write({format: 'cjs', dest}))
} else {
  // Build distributions
  let filesize = require('rollup-plugin-filesize')
  rollup.rollup({
    entry: 'src/index.js',
    plugins: [
      filesize(),
      includePaths({
        include: {},
        paths: ['', 'src/'],
        external: [],
        extensions: ['.js']
      })
    ]
  }).then((bundle) => {
    console.log('UMD bundle:')
    bundle.write({
      format: 'umd',
      moduleName: 'netflux',
      dest: 'dist/netflux.es2015.umd.js'
    })

    console.log('ES bundle:')
    bundle.write({
      format: 'es',
      dest: 'dist/netflux.es2015.js'
    })
  })
}
