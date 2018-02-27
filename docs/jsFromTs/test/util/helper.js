import { LogLevel, setLogLevel } from '../../src/index.browser';
setLogLevel(LogLevel.CHANNEL_BUILDER);
// Main signaling server for all tests
export const SIGNALING_URL = 'ws://localhost:8111';
// Configuration for bot server
export const BOT_HOST = 'localhost';
export const BOT_PORT = 10001;
export const BOT_URL = `ws://${BOT_HOST}:${BOT_PORT}`;
const BOT_FETCH_URL = `http://${BOT_HOST}:${BOT_PORT}`;
export function areTheSame(array1, array2) {
    if (array1.length === array2.length) {
        if (array1.length !== 0) {
            const array2Copy = Array.from(array2);
            if (array1[0] instanceof Uint8Array) {
                for (const e of array1) {
                    let found = false;
                    array2Copy.forEach((v, i) => {
                        if (areIdentical(e, v)) {
                            found = true;
                            array2Copy[i] = ['¤'];
                        }
                    });
                    if (!found) {
                        return false;
                    }
                }
            }
            else {
                for (const e of array1) {
                    const index = array2Copy.indexOf(e);
                    if (index !== -1) {
                        array2Copy[index] = '¤';
                    }
                    else {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    else {
        return false;
    }
}
function areIdentical(array1, array2) {
    return array1.every((v, i) => v === array2[i]);
}
export class Queue {
    constructor(length) {
        this.counter = 0;
        this.promises = [];
        this.resolvers = [];
        for (let i = 0; i < length; i++) {
            this.promises.push(new Promise((resolve) => {
                this.resolvers.push(() => resolve());
            }));
        }
    }
    pop() {
        if (this.counter < this.resolvers.length) {
            this.resolvers[this.counter++]();
        }
    }
    wait() {
        return Promise.all(this.promises);
    }
}
export function getBotData(wgId) {
    return fetch(`${BOT_FETCH_URL}/data/${wgId}`)
        .then(async (res) => {
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
        else {
            return res.json();
        }
    });
}
export function waitBotJoin(wgId) {
    return fetch(`${BOT_FETCH_URL}/waitJoin/${wgId}`)
        .then(async (res) => {
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
    });
}
export function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
}
export function cleanWebGroup(wg) {
    wg.onMemberJoin = undefined;
    wg.onMemberLeave = undefined;
    wg.onMessage = undefined;
    wg.onSignalingStateChange = undefined;
    wg.onStateChange = undefined;
}
