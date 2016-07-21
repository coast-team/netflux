export function isBrowser () {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
    return false
  }
  return true
}
