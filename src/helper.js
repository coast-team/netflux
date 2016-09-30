
let NodeCloseEvent = class CloseEvent {
  constructor (options = {}) {
    this.wasClean = options.wasClean
    this.code = options.code
    this.reason = options.reason
  }
}

export function createCloseEvent (code, reason = '', wasClean = true) {
  let obj = {wasClean, code, reason}
  if (isBrowser()) {
    return new CloseEvent('netfluxClose', obj)
  } else {
    return new NodeCloseEvent(obj)
  }
}

export function isBrowser () {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
    return false
  }
  return true
}

export function isSocket (channel) {
  return channel.constructor.name === 'WebSocket'
}

export function isURL (str) {
  let regex =
    '^' +
    // protocol identifier
    '(?:(?:wss|ws)://)' +
    // user:pass authentication
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:'

  let tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))?'

  regex +=
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
      '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
      '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
      // host name
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
      // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
      tld +
    ')' +
    // port number
    '(?::\\d{2,5})?' +
    // resource path
    '(?:[/?#]\\S*)?' +
  '$'

  if (!(new RegExp(regex, 'i')).exec(str)) return false
  return true
}
