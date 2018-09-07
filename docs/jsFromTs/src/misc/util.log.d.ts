export interface ILog {
    webgroup: (msg: string, ...rest: any[]) => void;
    signalingState: (msg: string, id: number) => void;
    webGroupState: (msg: string, id: number) => void;
    webrtc: (msg: string, ...rest: any[]) => void;
    channel: (msg: string, ...rest: any[]) => void;
    topology: (msg: string, ...rest: any[]) => void;
    signaling: (msg: string, ...rest: any[]) => void;
    channelBuilder: (msg: string, ...rest: any[]) => void;
    debug: (msg: string, ...rest: any[]) => void;
    warn: (msg: string, ...rest: any[]) => void;
}
declare const log: ILog;
export declare enum LogLevel {
    DEBUG = 0,
    WEB_GROUP = 1,
    WEBRTC = 2,
    CHANNEL = 3,
    TOPOLOGY = 4,
    SIGNALING = 5,
    CHANNEL_BUILDER = 6
}
export declare let logLevels: LogLevel[];
export declare function setLogLevel(...levels: LogLevel[]): void;
export { log };
