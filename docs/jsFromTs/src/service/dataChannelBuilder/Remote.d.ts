import { RTCDataChannel } from '../../misc/env';
import { dataChannelBuilder as proto } from '../../proto/index';
export declare class Remote {
    readonly id: number;
    readonly pc: RTCPeerConnection;
    finalMessageReceived: boolean;
    private readonly candidates;
    private readonly send;
    private readonly remotes;
    private isSDPSent;
    private _onError;
    private timer;
    private finalMessageSent;
    constructor(id: number, pc: RTCPeerConnection, send: (msg: proto.IMessage) => void, remotes: Map<number, Remote>, timeout: number);
    onError: (err: Error) => void;
    sdpIsSent(): void;
    clean(sendFinalMessage?: boolean): void;
    dataChannelOpen(dc: RTCDataChannel): void;
    handleMessage(msg: proto.Message): void;
    private sendFinalMessage;
}
