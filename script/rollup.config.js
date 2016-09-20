let rollup = require('rollup')
let includePaths = require('rollup-plugin-includepaths')

let entries = [
  'script/init.js',
  'script/botForFirefox.js',
  'script/botForChrome.js',
  'script/botForNode.js'
]

for (let entry of entries) {
  let dest = entry.replace(/^script/, '.rolledupScript')
  rollup.rollup({
    entry,
    plugins: [
      includePaths({
        paths: ['', 'src', 'test'],
        extensions: ['.js']
      })
    ]
  }).then(bundle => bundle.write({format: 'cjs', dest}))
    .catch(err => console.log(err))
}
