# Developer guide
## Requirements
* NodeJS > v4.
* Chrome, Firefox (stable channels) for run tests.

## Install
```shell
git clone https://github.com/coast-team/netflux.git
cd netflux
npm install
```

## Run tests
Run test in several browsers.
```
npm test
```
Run test in browser X, where is X is `Chrome` or `Firefox`.
```
npm run testin X
```

## Generate documentation
For API users
```
npm run doc
```
For developers (shows private attributes, functions etc.)
```
npm run docdev
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

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

The project follows JavaScript Standard Style.

## Setup development environment
Look at Wiki page: [Setup IDE](https://github.com/coast-team/netflux/wiki/Setup-IDE)
