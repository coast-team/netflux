import { WebChannelOptions, WebChannelState } from './service/WebChannel';
import { Topology } from './service/topology/Topology';
import { SignalingState } from './Signaling';
export declare class WebGroup {
    private wc;
    constructor(options: WebChannelOptions);
    readonly id: number;
    readonly myId: number;
    readonly members: number[];
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
