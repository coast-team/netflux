import { Observable, Subject } from 'rxjs';
import { Channel } from './Channel';
import { IStream } from './misc/util';
import { IMessage, Message } from './proto/index';
import { ChannelBuilder } from './service/channelBuilder/ChannelBuilder';
import { ITopology, TopologyEnum } from './service/topology/Topology';
import { UserDataType, UserMessage } from './service/UserMessage';
import { Signaling, SignalingState } from './Signaling';
import { WebChannelState } from './WebChannelState';
import { WebSocketBuilder } from './WebSocketBuilder';
export interface IWebChannelOptions {
    topology?: TopologyEnum;
    signalingServer?: string;
    rtcConfiguration?: RTCConfiguration;
    autoRejoin?: boolean;
}
export declare const webChannelDefaultOptions: {
    topology: TopologyEnum;
    signalingServer: string;
    rtcConfiguration: {
        iceServers: {
            urls: string;
        }[];
    };
    autoRejoin: boolean;
};
export interface InWcMsg extends Message {
    channel: Channel;
}
export declare type OutWcMessage = IMessage;
/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export declare class WebChannel implements IStream<OutWcMessage, InWcMsg> {
    readonly STREAM_ID: number;
    members: number[];
    topologyEnum: TopologyEnum;
    myId: number;
    key: string;
    autoRejoin: boolean;
    rtcConfiguration: RTCConfiguration;
    state: WebChannelState;
    onSignalingStateChange: (state: SignalingState) => void;
    onStateChange: (state: WebChannelState) => void;
    onMemberJoin: (id: number) => void;
    onMemberLeave: (id: number) => void;
    onMessage: (id: number, msg: UserDataType) => void;
    onMyId: (id: number) => void;
    webSocketBuilder: WebSocketBuilder;
    channelBuilder: ChannelBuilder;
    topology: ITopology;
    signaling: Signaling;
    userMsg: UserMessage;
    streamSubject: Subject<InWcMsg>;
    private _id;
    private idSubject;
    private _onAlone;
    private rejoinEnabled;
    private rejoinTimer;
    constructor(options: IWebChannelOptions);
    readonly onIdChange: Observable<number>;
    id: number;
    readonly messageFromStream: Observable<InWcMsg>;
    onAlone: () => void;
    sendOverStream(msg: OutWcMessage): void;
    join(key?: string): void;
    invite(url: string): void;
    leave(): void;
    send(data: UserDataType): void;
    sendTo(id: number, data: UserDataType): void;
    onMemberJoinProxy(id: number): void;
    onAdjacentMembersLeaveProxy(ids: number[]): void;
    onDistantMembersLeaveProxy(ids: number[]): void;
    init(key: string, id?: number): void;
    private clean;
    private setState;
    private setTopology;
    private subscribeToSignalingState;
    private subscribeToBrowserEvents;
    private startJoin;
    private rejoin;
    private reconnectToSignaling;
    private onBrowserBack;
    private onMemberLeaveProxy;
    private internalLeave;
}
