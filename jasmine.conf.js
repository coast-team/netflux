// Configuration for running tests in NodeJS
const Jasmine = require('jasmine')
const SpecReporter = require('jasmine-spec-reporter').SpecReporter

const config = {
  spec_dir: 'test/.rolledup',
  spec_files: ['unit/**/*.test.js'],
  stopSpecOnExpectationFailure: false,
  random: false,
}

const jrunner = new Jasmine()
jrunner.configureDefaultReporter({ print: () => {} }) // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter({ displaySpecDuration: true })) // add jasmine-spec-reporter
jrunner.loadConfig(config) // load jasmine.json configuration
jrunner.execute()
