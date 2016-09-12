let fs = require('fs')
let rollup = require('rollup')
let includePaths = require('rollup-plugin-includepaths')
let string = require('rollup-plugin-string')

let entries = []
function read (path) {
  if (path.endsWith('test.js')) {
    entries.push(path)
  } else if (fs.statSync(path).isDirectory()) {
    let items = fs.readdirSync(path)
    for (let i of items) {
      read(path + '/' + i)
    }
  }
}
read('test')

for (let entry of entries) {
  let dest = entry.replace(/^test/, 'tmp')
  rollup.rollup({
    entry,
    plugins: [
      string({
        include: 'test/**/*.txt'
      }),
      includePaths({
        paths: ['', 'test/', 'src/'],
        extensions: ['.js', '.txt']
      })
    ]
  }).then(bundle => bundle.write({format: 'cjs', dest}))
    .catch(err => console.log(err))
}
