import { WebChannel, WebChannelOptions as WebGroupOptions, WebChannelState } from './service/WebChannel';
import { Topology } from './service/topology/Topology';
import { SignalingState } from './Signaling';
export declare const wcs: WeakMap<WebGroup, WebChannel>;
/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export declare class WebGroup {
    /**
     * Create instance of WebGroup.
     * @param {WebGroupOptions} options [description]
     */
    constructor(options: WebGroupOptions);
    /**
     * WebGroup id. The same value for all members.
     */
    readonly id: number;
    /**
     * Your unique member id.
     */
    readonly myId: number;
    /**
     * An array of member ids.
     */
    readonly members: number[];
    /**
     * Topology id.
     */
    readonly topology: Topology;
    readonly state: WebChannelState;
    readonly signalingState: SignalingState;
    readonly signalingURL: string;
    autoRejoin: boolean;
    onMessage: (id: number, msg: string | Uint8Array, isBroadcast: boolean) => void;
    onPeerJoin: (id: number) => void;
    onPeerLeave: (id: number) => void;
    onStateChanged: (state: WebChannelState) => void;
    onSignalingStateChanged: (state: SignalingState) => void;
    join(key: string): void;
    invite(url: string): void;
    closeSignaling(): void;
    leave(): void;
    send(data: string | Uint8Array): void;
    sendTo(id: number, data: string | Uint8Array): void;
    ping(): Promise<number>;
}
