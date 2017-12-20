import 'webrtc-adapter'
/**
 * ECMAScript Proposal, specs, and reference implementation for `global`
 * http://tc39.github.io/proposal-global/
 * Code copied from: https://github.com/tc39/proposal-global
 */
((global) => {
  if (!global.global) {
    if (Object.defineProperty) {
      Object.defineProperty(global, 'global', {
        configurable: true,
        enumerable: false,
        value: global,
        writable: true,
      })
    } else {
      global.global = global
    }
  }
})(Function('return this')()) // tslint:disable-line
