# Developer guide
## Requirements
* Node.js 6.x.
* Chrome, Firefox (stable channels) for run tests.

## Install
```shell
git clone https://github.com/coast-team/netflux.git
cd netflux
npm install
```

## Run tests
Node.js and Browsers test:
```shell
npm test
```

## Generate documentation
```shell
npm run doc
```

## ES2015 with Babel
The source code and tests are written in ES2015. The distribution package is ES5 code compiled by Babel. Checkout [Babel ES2015 features support](https://babeljs.io/docs/learn-es2015/).

## Commit
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)

We use *Commitizen* for commits. It uses [cz-conventional-changelog](https://github.com/commitizen/cz-conventional-changelog) adapter which prompts for [this format](https://github.com/ajoslin/conventional-changelog/blob/master/conventions/angular.md) standard. Instead of usual `git commit` command, execute:
```
npm run commit
```
Look at `config` option in the `package.json` for more details.
## Release

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

Release are automated with help of *semantic-release*.

## Code style

The project uses Eslint and follows JavaScript Standard Style + some personalised rules.

## Setup development environment
Look at Wiki page: [Setup IDE](https://github.com/coast-team/netflux/wiki/Setup-IDE)
