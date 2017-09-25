/// <reference types="node" />
import { Server as NodeJSHttpServer } from 'http';
import { Server as NodeJSHttpsServer } from 'https';
import { IWebChannelOptions } from './service/WebChannel';
import { WebGroup } from './WebChannelFacade';
export interface IBotServerOptions {
    url?: string;
    server: NodeJSHttpServer | NodeJSHttpsServer;
    perMessageDeflate?: boolean;
    webGroupOptions?: IWebChannelOptions;
}
export declare class BotServer {
    server: NodeJSHttpServer | NodeJSHttpsServer;
    perMessageDeflate: boolean;
    webGroups: Set<WebGroup>;
    onWebGroup: (wg: WebGroup) => void;
    onError: (err: Error) => void;
    private listenUrl;
    private webSocketServer;
    private wcOptions;
    private botSettings;
    constructor({url, perMessageDeflate, server, webGroupOptions}?: IBotServerOptions);
    readonly url: string;
    private getWebGroup(id);
    private init();
    private validateConnection(info);
}
