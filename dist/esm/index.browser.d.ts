import './misc/polyfills.browser';
export { WebGroup, WebGroupOptions, WebGroupState, DataType } from './WebChannelFacade';
/**
 * The state enum of the signaling server for WebRTC.
 */
export declare class SignalingState {
    /**
     * The connection is not yet open.
     * @type {number}
     */
    static readonly CONNECTING: number;
    /**
     * The connection is open and ready to communicate.
     * @type {number}
     */
    static readonly OPEN: number;
    /**
     * `RTCDataChannel` has been established with one of the group member.
     * From now the signaling is no longer needed, because the joining process
     * will continue with a help of this member.
     * @type {number}
     */
    static readonly FIRST_CONNECTED: number;
    /**
     * You has successfully been joined a web group and ready to help join others.
     * @type {number}
     */
    static readonly READY_TO_JOIN_OTHERS: number;
    /**
     * The connection is closed.
     * @type {number}
     */
    static readonly CLOSED: number;
}
/**
 * The topology enum.
 */
export declare class Topology {
    /**
     * Full mesh topology identifier.
     * @type {number}
     */
    static readonly FULL_MESH: number;
}
