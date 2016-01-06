// Karma configuration
// Generated on Tue Dec 22 2015 18:29:31 GMT+0100 (CET)
var karmaConf = require('./karma.conf.js');

module.exports = function(config) {
  karmaConf(config);
  config.set({
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox', 'Chrome_travis'],

    customLaunchers: {
      Chrome_travis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
  })
}
