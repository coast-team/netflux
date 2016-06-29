module.exports = (config) => {
  require('./karma.conf.coverage.js')(config)
  config.set({

    browsers: ['Firefox', 'Chrome_travis_ci'],

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    coverageReporter: {
      reporters: [
        {type: 'text'},
        {type: 'lcovonly', subdir: '.'}
      ]
    },
    autoWatch: false,
    singleRun: true
  })
}
