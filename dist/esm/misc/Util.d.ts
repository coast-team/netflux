/**
 * Equals to true in any browser.
 */
export declare const isBrowser: boolean;
/**
 * Equals to true in Firefox and false elsewhere.
 * Thanks to https://github.com/lancedikson/bowser
 */
export declare const isFirefox: boolean;
/**
 * Check whether the string is a valid URL.
 */
export declare function isURL(str: string): boolean;
/**
 * Generate random key which will be used to join the network.
 */
export declare function generateKey(): string;
export declare const MAX_KEY_LENGTH = 512;
