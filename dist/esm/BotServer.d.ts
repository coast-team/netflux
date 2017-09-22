/// <reference types="node" />
import { Server as NodeJSHttpServer } from 'http';
import { Server as NodeJSHttpsServer } from 'https';
import { WebGroup } from './WebChannelFacade';
export interface IBotServerOptions {
    url?: string;
    server: any;
    perMessageDeflate?: boolean;
}
export declare const bsDefaults: {
    bot: {
        url: string;
        server: any;
        perMessageDeflate: boolean;
    };
};
/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export declare class BotServer {
    server: NodeJSHttpServer | NodeJSHttpsServer;
    webGroups: Set<WebGroup>;
    onWebGroup: (wg: WebGroup) => void;
    onError: (err) => void;
    private wcSettings;
    private botSettings;
    private serverSettings;
    /**
     * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
     * plus `host` and `port` parameters.
     *
     * @param {Object} options
     * @param {FULL_MESH} [options.topology=FULL_MESH] Fully connected topology is the only one available for now
     * @param {string} [options.signalingURL='wss://www.coedit.re:10443'] Signaling server url
     * @param {RTCIceServer} [options.iceServers=[{urls:'stun3.l.google.com:19302'}]] Set of ice servers for WebRTC
     * @param {Object} [options.bot] Options for bot server
     * @param {string} [options.bot.url=''] Bot public URL to be shared on the p2p network
     * @param {Object} [options.bot.server=null] A pre-created Node.js HTTP server
     */
    constructor(options?: any);
    readonly url: string;
    /**
     * Get `WebChannel` identified by its `id`.
     */
    private getWebGroup(id);
    private init();
    private validateConnection(info);
}
