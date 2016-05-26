module.exports = function(config) {
  require('./karma.conf.coverage.js')(config);
  config.set({

    browsers: ['Firefox'],

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
