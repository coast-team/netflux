module.exports = (config) => {
  require('./karma.conf.js')(config)
  config.set({

    rollupPreprocessor: {
      rollup: {
        plugins: [
          require('rollup-plugin-string')({
            include: 'test/**/*.txt'
          }),
          require('rollup-plugin-includepaths')({
            paths: ['', 'src/', 'test/'],
            extensions: ['.js', '.txt']
          }),
          require('rollup-plugin-istanbul')({
            exclude: [
              'test/**/*.js',
              'test/*.js',
              'test/*.txt',
              'dist/*.js'
            ]
          })
        ]
      },
      bundle: {
        format: 'iife'
      }
    },

    reporters: ['spec', 'coverage'],

    coverageReporter: {
      dir: 'coverage',
      reporters: [
        {type: 'html'},
        {type: 'text'},
        {type: 'lcovonly', subdir: '.'}
      ]
    },

    autoWatch: false,

    singleRun: true
  })
}
