/**
 * Equals to true in any browser.
 */
export const isBrowser = (typeof window === 'undefined') ? false : true;
/**
 * Equals to true in Firefox and false elsewhere.
 * Thanks to https://github.com/lancedikson/bowser
 */
export const isFirefox = (isBrowser &&
    navigator !== undefined &&
    navigator.userAgent !== undefined &&
    /firefox|iceweasel|fxios/i.test(navigator.userAgent)) ? true : false;
/**
 * Check whether the string is a valid URL.
 */
export function isURL(str) {
    const regex = '^' +
        // protocol identifier
        '(?:wss|ws)://' +
        // Host name/IP
        '[^\\s]+' +
        // port number
        '(?::\\d{2,5})?' +
        '$';
    return (new RegExp(regex, 'i')).test(str);
}
/**
 * Generate random key which will be used to join the network.
 */
export function generateKey() {
    const mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 42; // Should be less then MAX_KEY_LENGTH value
    const values = new Uint32Array(length);
    global.crypto.getRandomValues(values);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += mask[values[i] % mask.length];
    }
    return result;
}
export const MAX_KEY_LENGTH = 512;
