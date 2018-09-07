/// <reference types="node" />
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { IWebChannelOptions } from './WebChannel';
import { WebGroup } from './WebChannelFacade';
export interface IBotOptions {
    url?: string;
    server: HttpServer | HttpsServer;
    perMessageDeflate?: boolean;
    leaveOnceAlone?: boolean;
    webGroupOptions?: IWebChannelOptions;
}
export declare class Bot {
    server: HttpServer | HttpsServer;
    perMessageDeflate: boolean;
    webGroups: Map<number, WebGroup>;
    onWebGroup: (wg: WebGroup) => void;
    onError: (err: Error) => void;
    leaveOnceAlone: boolean;
    private listenUrl;
    private webSocketServer;
    private wcOptions;
    constructor(options: IBotOptions);
    readonly url: string;
    private init;
    private validateURLQuery;
    private readURLQuery;
}
