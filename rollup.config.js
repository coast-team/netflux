let rollup = require('rollup')
let filesize = require('rollup-plugin-filesize')
let includePaths = require('rollup-plugin-includepaths')

// Build distributions
rollup.rollup({
  entry: 'src/index.js',
  plugins: [
    filesize({
      format: {
        round: 0
      }
    }),
    includePaths({
      paths: ['', 'src/'],
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
