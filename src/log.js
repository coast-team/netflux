import { Util } from 'Util'

export const info = Util.isBrowser()
? (msg, ...rest) => {
  console.info(`%cℹ ${msg}`, 'background-color: #bbdefb; padding: 2px', ...rest)
}
: (msg, ...rest) => {
  console.info(`INFO | ${msg}`, ...rest)
}

export const debug = Util.isBrowser()
? (msg, ...rest) => {
  console.log(`%c${msg}`, 'color: white; height: 30px; background-color: #3949ab; font-size: 1.1rem; padding: 0 3px;', ...rest)
}
: (msg, ...rest) => {
  console.log(`DEBUG| ${msg}`, ...rest)
}

export const error = Util.isBrowser()
? (msg, ...rest) => {
  console.error(`%c${msg}`, 'color: black; background-color: #ef5350; padding: 2px', ...rest)
}
: (msg, ...rest) => {
  console.error(`ERROR| ${msg}`, ...rest)
}

export const warn = Util.isBrowser()
? (msg, ...rest) => {
  console.warn(`%c${msg}`, 'color: black; background-color: #ffe082; padding: 2px', ...rest)
}
: (msg, ...rest) => {
  console.warn(`WARN | ${msg}`, ...rest)
}

export const trace = Util.isBrowser()
? (msg, ...rest) => {
  console.trace(`%c${msg}`, 'color: black; background-color: #b0bec5; padding: 2px', ...rest)
}
: (msg, ...rest) => {
  console.trace(`TRACE| ${msg}`, ...rest)
}

export const group = Util.isBrowser()
? (msg, args) => {
  console.group(msg)
  for (let argName in args) {
    if (args[argName] !== undefined) {
      console.log(`%c${argName} =`, 'color: #0f6717; font-weight: bold; padding: 3px', args[argName])
    } else {
      console.log(`%c${argName} =`, 'color: #e20000; font-weight: bold; padding: 3px', args[argName])
    }
  }
  console.groupEnd()
}
: (msg, args) => {
  console.log(`GROUP| ${msg}`, args)
}
