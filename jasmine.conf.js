// Configuration for running tests in NodeJS
let Jasmine = require('jasmine')
let SpecReporter = require('jasmine-spec-reporter')
let config = {
  spec_dir: 'tmp/test/node',
  spec_files: ['**/*test.js'],
  stopSpecOnExpectationFailure: false,
  random: false
}

let jrunner = new Jasmine()
jrunner.configureDefaultReporter({print: () => {}})    // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter())   // add jasmine-spec-reporter
jrunner.loadConfig(config)           // load jasmine.json configuration
jrunner.execute()
