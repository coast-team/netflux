// Karma configuration
// Generated on Tue Dec 22 2015 18:29:31 GMT+0100 (CET)

/*
  To configurate test run. Possible values: travis, coverage
 */
const TYPE = process.argv[4]

module.exports = (config) => {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'src/log.js',
      // 'test/unit/**/*.test.js',
      'test/e2e/fullMesh/join.test.js'
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/log.js': ['log_rollup'],
      'test/**/*.test.js': ['rollup']
    },

    customPreprocessors: {
      log_rollup: {
        base: 'rollup',
        options: {
          plugins: [
            require('rollup-plugin-replace')({
              LOG_LEVEL: `Level.TRACE`
            })
          ],
          format: 'iife',
          moduleName: 'log'
        }
      }
    },

    rollupPreprocessor: {
      plugins: [
        require('rollup-plugin-string')({
          include: 'test/**/*.txt'
        }),
        require('rollup-plugin-includepaths')({
          paths: ['', 'src/', 'test/', 'dist/'],
          extensions: ['.js', '.txt']
        }),
        require('rollup-plugin-node-resolve')({}),
        require('rollup-plugin-commonjs')({
          include: 'node_modules/**',
          namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
        }),
        require('rollup-plugin-replace')({
          WEB_RTC_MODULE: `window`,
          WEB_SOCKET_MODULE: `window.WebSocket`,
          TEXT_ENCODING_MODULE: `window`,
          EVENT_SOURCE_MODULE: `window.EventSource`,
          FETCH_MODULE: `window.fetch`,
          LOG_LEVEL: `Level.WARN`
        })
      ],
      format: 'iife'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    specReporter: {
      showSpecTiming: true
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    failOnEmptyTestSuite: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: Infinity,

    browserNoActivityTimeout: 200000
  })

  if (process.env.TRAVIS || TYPE === 'travis') {
    Object.assign(config, {
      browsers: ['Chrome_travis_ci'],

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
      singleRun: true,
      browserNoActivityTimeout: 120000
    })
  } else if (TYPE === 'coverage') {
    Object.assign(config, {
      rollupPreprocessor: {
        plugins: [
          require('rollup-plugin-string')({
            include: 'test/**/*.txt'
          }),
          require('rollup-plugin-includepaths')({
            paths: ['', 'src/', 'test/'],
            extensions: ['.js', '.txt']
          }),
          require('rollup-plugin-node-resolve')({}),
          require('rollup-plugin-commonjs')({
            include: 'node_modules/**',
            namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
          }),
          require('rollup-plugin-istanbul')({
            include: [
              'src/**/*.js'
            ],
            exclude: [
              'src/BotServer.js',
              'src/service/EventSourceService.js'
            ]
          }),
          require('rollup-plugin-replace')({
            WEB_RTC_MODULE: `window`,
            WEB_SOCKET_MODULE: `window.WebSocket`,
            TEXT_ENCODING_MODULE: `window`,
            EVENT_SOURCE_MODULE: `window.EventSource`,
            FETCH_MODULE: `window.fetch`,
            LOG_LEVEL: `Level.TRACE`
          })
        ],
        format: 'iife'
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
}
