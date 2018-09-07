import { SignalingState, WebGroup, WebGroupState } from '../../src/index.browser';
export declare const SIGNALING_URL = "ws://localhost:13477";
export declare const BOT_HOST = "localhost";
export declare const BOT_PORT = 10001;
export declare const BOT_URL: string;
export declare function randomKey(): string;
export declare function randomBigArrayBuffer(): Uint8Array;
export declare function copyArrayBuffer(bytes: Uint8Array): Uint8Array;
export declare function areTheSame(array1: Array<number | string | boolean | Uint8Array>, array2: Array<number | string | boolean | Uint8Array>): boolean;
export declare class Queue {
    private promises;
    private resolvers;
    private counter;
    constructor(length: number, afterAllDone: () => void);
    done(): void;
}
export interface IBotData {
    id: number;
    onMemberJoinCalled: number;
    joinedMembers: number[];
    onMemberLeaveCalled: number;
    leftMembers: number[];
    onStateCalled: number;
    states: number[];
    onSignalingStateCalled: number;
    signalingStates: number[];
    messages: IBotMessage[];
    onMessageToBeCalled: number;
    onMyIdToBeCalled: number;
    state: WebGroupState;
    signalingState: SignalingState;
    key: string;
    topology: number;
    members: number[];
    myId: number;
    autoRejoin: boolean;
    signalingServer: string;
}
export interface IBotMessage {
    id: number;
    msg: string | Uint8Array;
}
export declare function botGetData(key: string): Promise<IBotData>;
export declare function botWaitJoin(key: string): Promise<void>;
export declare function botJoin(key: string): Promise<void>;
export declare function botLeave(key: string): Promise<IBotData>;
export declare function wait(milliseconds: number): Promise<void>;
export declare function cleanWebGroup(...wgs: WebGroup[]): void;
export interface IMessages {
    ids: number[];
    msgs: Array<string | Uint8Array>;
}
