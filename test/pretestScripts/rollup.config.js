const rollup = require('rollup')
const includePaths = require('rollup-plugin-includepaths')

const entries = [
  'test/pretestScripts/botServer.js',
  'test/pretestScripts/botForFirefox.js',
  'test/pretestScripts/botForChrome.js',
  'test/pretestScripts/botForNode.js'
]

for (let entry of entries) {
  const dest = entry.replace(/pretestScripts/, 'pretestScripts/.rolledup')
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
