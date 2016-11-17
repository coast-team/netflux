const rollup = require('rollup')
const filesize = require('rollup-plugin-filesize')
const includePaths = require('rollup-plugin-includepaths')
const babel = require('rollup-plugin-babel')
const uglify = require('rollup-plugin-uglify')

// ES6 module
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
  console.log('ES bundle:')
  bundle.write({
    format: 'es',
    dest: 'dist/netflux.es6.js'
  })
})

// ES5 umd module
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
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    uglify()
  ]
}).then((bundle) => {
  console.log('UMD bundle:')
  bundle.write({
    format: 'umd',
    moduleName: 'netflux',
    dest: 'dist/netflux.es5.umd.min.js'
  })
})
