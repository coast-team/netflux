import { LogLevel, setLogLevel } from '../../src/misc/util';
setLogLevel([
    LogLevel.DEBUG,
]);
// Main signaling server for all tests
export const SIGNALING_URL = 'ws://localhost:8010';
// Configuration for bot server
export const BOT_HOST = 'localhost';
export const BOT_PORT = 10001;
export const BOT_URL = `ws://${BOT_HOST}:${BOT_PORT}`;
const BOT_FETCH_URL = `http://${BOT_HOST}:${BOT_PORT}`;
export function randomKey() {
    const mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 42; // Should be less then MAX_KEY_LENGTH value
    const values = new Uint32Array(length);
    global.crypto.getRandomValues(values);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += mask[values[i] % mask.length];
    }
    return result;
}
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
    constructor(length, afterAllDone) {
        this.counter = 0;
        this.promises = [];
        this.resolvers = [];
        for (let i = 0; i < length; i++) {
            this.promises.push(new Promise((resolve) => {
                this.resolvers.push(() => resolve());
            }));
        }
        Promise.all(this.promises).then(() => afterAllDone());
    }
    done() {
        if (this.counter < this.resolvers.length) {
            this.resolvers[this.counter++]();
        }
    }
}
export function botGetData(key) {
    return fetch(`${BOT_FETCH_URL}/data/${key}`).then(async (res) => {
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
        else {
            return res.json();
        }
    });
}
export function botWaitJoin(key) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            fetch(`${BOT_FETCH_URL}/waitJoin/${key}`)
                .then(async (res) => {
                if (res.status !== 200) {
                    throw new Error(await res.text());
                }
            })
                .then(() => resolve())
                .catch((err) => reject(err));
        }, 1000);
    });
}
export function botJoin(key) {
    return fetch(`${BOT_FETCH_URL}/new/${key}`).then(async (res) => {
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
    });
}
export function botLeave(key) {
    return fetch(`${BOT_FETCH_URL}/leave/${key}`).then(async (res) => {
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
        else {
            return res.json();
        }
    });
}
export function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
}
export function cleanWebGroup(...wgs) {
    wgs.forEach((wg) => {
        wg.onMemberJoin = undefined;
        wg.onMemberLeave = undefined;
        wg.onMessage = undefined;
        wg.onSignalingStateChange = undefined;
        wg.onStateChange = undefined;
    });
}
