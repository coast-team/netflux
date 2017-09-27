import { ReplaySubject } from 'rxjs/ReplaySubject';
import { WebGroup, WebGroupBotServer, WebGroupState } from '../../src/index.node';
import { BOT_HOST, BOT_PORT, onMessageForBot, SIGNALING_URL } from './helper';
// Require dependencies
const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const cors = require('kcors');
try {
    // Instantiate main objects
    const app = new Koa();
    const router = new Router();
    const server = http.createServer(app.callback());
    const bot = new WebGroupBotServer({ server });
    const webGroups = new ReplaySubject();
    // Configure router
    router
        .get('/members/:wcId', (ctx, next) => {
        console.log('check members');
        const wcId = Number(ctx.params.wcId);
        let members = [];
        let id;
        for (const wg of bot.webGroups) {
            if (wg.id === wcId) {
                members = wg.members;
                id = wg.myId;
                break;
            }
        }
        ctx.body = { id, members };
    })
        .get('/waitJoin/:wcId', async (ctx, next) => {
        const wcId = Number(ctx.params.wcId);
        let id = -1;
        await new Promise((resolve, reject) => {
            webGroups.filter((wg) => wg.id === wcId)
                .subscribe((wg) => {
                if (wg.state === WebGroupState.JOINED) {
                    resolve();
                }
                else {
                    wg.onStateChange = (state) => {
                        if (state === WebGroupState.JOINED) {
                            resolve();
                        }
                    };
                }
                id = wg.myId;
            });
        });
        ctx.body = { id };
    })
        .get('/send/:wcId', (ctx, next) => {
        const wcId = Number(ctx.params.wcId);
        for (const wc of bot.webGroups) {
            if (wc.id === wcId) {
                // Create a message
                const msg = JSON.stringify({ id: wc.myId });
                // Broadcast the message
                wc.send(msg);
                // Send the message privately to each peer
                wc.members.forEach((id) => {
                    if (id !== wc.myId) {
                        wc.sendTo(id, msg);
                    }
                });
                ctx.status = 200;
                break;
            }
        }
    });
    // Apply router and cors middlewares
    app
        .use(cors())
        .use(router.routes())
        .use(router.allowedMethods());
    // Configure bot
    bot.onWebGroup = (wc) => {
        wc.onMessage = (id, msg, isBroadcast) => {
            onMessageForBot(wc, id, msg, isBroadcast);
        };
        webGroups.next(wc);
    };
    bot.onError = (err) => console.error('Bot ERROR: ', err);
    // Add specific web channel to the bot for tests in Chrome
    // bot.addWebChannel(createWebChannel('CHROME'))
    //
    // // Add specific web channel to the bot for tests in Firefox
    // bot.addWebChannel(createWebChannel('FIREFOX'))
    //
    // // Add specific web channel to the bot for tests in NodeJS
    // bot.addWebChannel(createWebChannel('NODE'))
    // Start the server
    server.listen(BOT_PORT, BOT_HOST, () => {
        const host = server.address().address;
        const port = server.address().port;
        console.info('Netflux bot is listening on ' + host + ':' + port);
    });
    // Leave all web channels before process death
    process.on('SIGINT', () => bot.webGroups.forEach((wg) => wg.leave()));
}
catch (err) {
    console.error('WebGroupBotServer script error: ', err);
}
function createWebChannel(env) {
    // Add specific web channel to the bot for tests in Firefox
    const wc = new WebGroup({ signalingURL: SIGNALING_URL });
    wc.onMessage = (id, msg, isBroadcast) => {
        onMessageForBot(wc, id, msg, isBroadcast);
    };
    wc.join('FIREFOX');
    return wc;
}
