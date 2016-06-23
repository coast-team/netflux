module.exports = function(config) {
  require('./karma.conf.js')(config);
  config.set({

    rollupPreprocessor: {
      rollup: {
        plugins: [
          require('rollup-plugin-string')({
            include: 'test/*.txt'
          }),
          require('rollup-plugin-istanbul')({
            exclude: [
              'test/**/*.js',
              'test/*.js',
              'test/*.txt'
            ]
          })
        ]
      },
      bundle: {
        format: 'iife'
      }
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir : 'coverage',
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
