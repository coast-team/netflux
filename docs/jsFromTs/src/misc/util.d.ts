import { Observable } from 'rxjs';
export declare const MIN_ID = 2147483648;
/**
 * Equals to true in any browser.
 */
export declare const isBrowser: boolean;
export declare function isOnline(): boolean;
export declare function isVisible(): boolean;
/**
 * Check whether the string is a valid URL.
 */
export declare function validateWebSocketURL(url: string): void;
/**
 * Generate random key which will be used to join the network.
 */
export declare function generateKey(): string;
export declare function generateId(exclude?: number[]): number;
export declare function validateKey(key: string): boolean;
export declare function extractHostnameAndPort(url: string): string;
export declare function equal(array1: number[], array2: number[]): boolean;
/**
 * Indicates whether WebSocket is supported by the environment.
 */
export declare function isWebSocketSupported(): boolean;
/**
 * Indicates whether WebRTC & RTCDataChannel is supported by the environment.
 */
export declare function isWebRTCSupported(): boolean;
export * from './util.log';
export interface IStream<OutMsg, InMsg> {
    readonly STREAM_ID: number;
    messageFromStream: Observable<InMsg>;
    sendOverStream: (msg: OutMsg, id?: number) => void;
}
