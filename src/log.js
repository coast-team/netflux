const Level = {
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5
}

const logLevel = LOG_LEVEL

export const trace = logLevel <= Level.TRACE
? (msg, ...rest) => {
  console.trace(`TRACE| ${msg}`, ...rest)
}
: () => {}

export const debug = logLevel <= Level.DEBUG
? (msg, ...rest) => {
  console.group(`DEBUG| ${msg}`)
  rest.forEach(param => logRecursive(param))
  console.groupEnd()
}
: () => {}

export const info = logLevel <= Level.INFO
? (msg, ...rest) => {
  console.info(`INFO | ${msg}`, ...rest)
}
: () => {}

export const warn = logLevel <= Level.WARN
? (msg, ...rest) => {
  console.warn(`WARN | ${msg}`, ...rest)
}
: () => {}

export const error = logLevel <= Level.ERROR
? (msg, ...rest) => {
  console.error(`ERROR| ${msg}`, ...rest)
}
: () => {}

function logObject (obj) {
  for (let prop in obj) {
    console.log(`${prop} = `, obj[prop])
  }
}

function logRecursive (obj) {
  switch (obj.constructor.name) {
    case 'Array':
      obj.forEach((value, index) => {
        if (value.constructor.name === 'Object') {
          console.groupCollapsed(`${index} object`)
          logRecursive(value)
          console.groupEnd()
        } else {
          logRecursive(value)
        }
      })
      break
    case 'Object':
      logObject(obj)
      break
    default:
      console.log(obj)
  }
}
