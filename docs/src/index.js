import './misc/polyfills';
import { SignalingState as SigState } from './Signaling';
import { TopologyEnum } from './service/topology/Topology';
export { WebGroup, WebGroupState } from './WebChannelFacade';
// #if NODE
export { WebGroupBotServer } from './BotServerFacade';
// #endif
/**
 * The state enum of the signaling server for WebRTC.
 */
export class SignalingState {
    /**
     * The connection is not yet open.
     * @type {number}
     */
    static get CONNECTING() { return SigState.CONNECTING; }
    /**
     * Equals to `'CONNECTING'`.
     * @type {string}
     */
    static get [SignalingState.CONNECTING]() { return SigState[SigState.CONNECTING]; }
    /**
     * The connection is open and ready to communicate.
     * @type {number}
     */
    static get OPEN() { return SigState.OPEN; }
    /**
     * Equals to `'OPEN'`.
     * @type {string}
     */
    static get [SignalingState.OPEN]() { return SigState[SigState.OPEN]; }
    /**
     * `RTCDataChannel` has been established with one of the group member.
     * From now the signaling is no longer needed, because the joining process
     * will continue with a help of this member.
     * @type {number}
     */
    static get FIRST_CONNECTED() { return SigState.FIRST_CONNECTED; }
    /**
     * Equals to `'FIRST_CONNECTED'`.
     * @type {string}
     */
    static get [SignalingState.FIRST_CONNECTED]() { return SigState[SigState.FIRST_CONNECTED]; }
    /**
     * You has successfully been joined a web group and ready to help join others.
     * @type {number}
     */
    static get READY_TO_JOIN_OTHERS() { return SigState.READY_TO_JOIN_OTHERS; }
    /**
     * Equals to `'READY_TO_JOIN_OTHERS'`.
     * @type {string}
     */
    static get [SignalingState.READY_TO_JOIN_OTHERS]() { return SigState[SigState.READY_TO_JOIN_OTHERS]; }
    /**
     * The connection is closed.
     * @type {number}
     */
    static get CLOSED() { return SigState.CLOSED; }
    /**
     * Equals to `'CLOSED'`.
     * @type {string}
     */
    static get [SignalingState.CLOSED]() { return SigState[SigState.CLOSED]; }
}
/**
 * The topology enum.
 */
export class Topology {
    /**
     * Full mesh topology identifier.
     * @type {number}
     */
    static get FULL_MESH() { return TopologyEnum.FULL_MESH; }
    /**
     * Equals to `'FULL_MESH'`.
     * @type {string}
     */
    static get [Topology.FULL_MESH]() { return TopologyEnum[TopologyEnum.FULL_MESH]; }
}
