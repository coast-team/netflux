let rollup = require('rollup')
let includePaths = require('rollup-plugin-includepaths')

let entries = [
  'test/utils/init.js',
  'test/utils/botForFirefox.js',
  'test/utils/botForChrome.js',
  'test/utils/botForNode.js'
]

for (let entry of entries) {
  let dest = entry.replace(/^test/, 'tmp')
  rollup.rollup({
    entry,
    plugins: [
      includePaths({
        paths: ['', 'test/', 'src/'],
        extensions: ['.js']
      })
    ]
  }).then(bundle => bundle.write({format: 'cjs', dest}))
    .catch(err => console.log(err))
}
