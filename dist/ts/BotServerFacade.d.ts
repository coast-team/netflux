import { WebGroup } from './WebChannelFacade';
import { BotServerOptions } from './BotServer';
/**
 * BotServer can listen on web socket. A peer can invite bot to join his `WebChannel`.
 * He can also join one of the bot's `WebChannel`.
 */
export declare class WebGroupBotServer {
    /**
     * Bot server settings are the same as for `WebChannel` (see {@link WebChannelSettings}),
     * plus `host` and `port` parameters.
     */
    constructor(options: BotServerOptions);
    readonly server: any;
    readonly webGroups: Set<WebGroup>;
    readonly url: string;
    onWebGroup: (wg: WebGroup) => void;
}
