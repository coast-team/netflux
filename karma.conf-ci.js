var fs = require('fs');

module.exports = function(config) {
  require('./karma.conf.coverage.js')(config)

  // Use ENV vars on Travis and sauce.json locally to get credentials
  if (!process.env.SAUCE_USERNAME) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    } else {
      process.env.SAUCE_USERNAME = require('./sauce').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
    }
  }

  // Browsers to run on Sauce Labs
  var customLaunchers = {
    // 'SL_Chrome': {
    //   base: 'SauceLabs',
    //   browserName: 'chrome',
    //   version: '49'
    // },
    // 'SL_InternetExplorer': {
    //   base: 'SauceLabs',
    //   browserName: 'internet explorer',
    //   version: '10'
    // },
    'SL_FireFox': {
      base: 'SauceLabs',
      browserName: 'firefox' // ,
      // version: '45',
      // platform: 'Linux'
    }
    // ,
    // 'SL_Safari': {
    //   base: 'SauceLabs',
    //   browserName: 'safari',
    //   platform: 'OS X 10.9'
    // },
    // 'SL_Edge': {
    //   base: 'SauceLabs',
    //   browserName: 'MicrosoftEdge',
    //   platform: 'Windows 10'
    // }
  };

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/webrtc-adapter/out/adapter_no_edge_no_global.js',
      'dist/netflux.es2015.umd.js',
      // 'test/**/*.test.js'
      'test/functional/bot/1peer.test.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],

    // web server port
    port: 9876,

    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    sauceLabs: {
      testName: 'Netflux on Chrome & Firefox',
      recordScreenshots: false,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      }
    },
    captureTimeout: 600000,
    browserNoActivityTimeout: 600000,
    customLaunchers: customLaunchers,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    singleRun: true
  });
};
