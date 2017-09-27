/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser';
import { MAX_KEY_LENGTH } from '../../src/misc/Util';
import { SIGNALING_URL } from '../util/helper';
/** @test {WebGroup} */
describe('Alone', () => {
    /** @test {WebGroup#constructor} */
    it('constructor', () => {
        const wg = new WebGroup({ signalingURL: SIGNALING_URL });
        // Check members
        expect(typeof wg.id).toBe('number');
        expect(Reflect.getOwnPropertyDescriptor(wg, 'id').set).toBeUndefined();
        expect(typeof wg.myId).toBe('number');
        expect(Reflect.getOwnPropertyDescriptor(wg, 'myId').set).toBeUndefined();
        expect(wg.key).toBe('');
        expect(Reflect.getOwnPropertyDescriptor(wg, 'key').set).toBeUndefined();
        expect(wg.members).toEqual([wg.myId]);
        expect(Reflect.getOwnPropertyDescriptor(wg, 'members').set).toBeUndefined();
        expect(wg.topology).toBe(Topology.FULL_MESH);
        expect(Reflect.getOwnPropertyDescriptor(wg, 'topology').set).toBeUndefined();
        expect(wg.state).toBe(WebGroupState.LEFT);
        expect(Reflect.getOwnPropertyDescriptor(wg, 'state').set).toBeUndefined();
        expect(wg.signalingState).toBe(SignalingState.CLOSED);
        expect(Reflect.getOwnPropertyDescriptor(wg, 'signalingState').set).toBeUndefined();
        expect(wg.signalingURL).toBe(SIGNALING_URL);
        expect(Reflect.getOwnPropertyDescriptor(wg, 'signalingURL').set).toBeUndefined();
        expect(wg.autoRejoin).toBeTruthy();
        wg.autoRejoin = false;
        expect(wg.autoRejoin).toBeFalsy();
        // Check event handlers
        expect(wg.onMemberJoin).toBeUndefined();
        expect(wg.onMemberLeave).toBeUndefined();
        expect(wg.onMessage).toBeUndefined();
        expect(wg.onStateChange).toBeUndefined();
        expect(wg.onSignalingStateChange).toBeUndefined();
        // Check methods
        expect(typeof wg.join).toBe('function');
        expect(typeof wg.invite).toBe('function');
        expect(typeof wg.closeSignaling).toBe('function');
        expect(typeof wg.leave).toBe('function');
        expect(typeof wg.send).toBe('function');
        expect(typeof wg.sendTo).toBe('function');
        expect(typeof wg.ping).toBe('function');
    });
    /** @test {WebGroup#join} */
    describe('join', () => {
        let wg;
        beforeEach(() => wg = new WebGroup({ signalingURL: SIGNALING_URL }));
        // afterEach (() => wg.leave())
        function expectToJoin(key) {
            return new Promise((resolve, reject) => {
                const oldMyId = wg.myId;
                const oldId = wg.id;
                wg.onMessage = () => fail('onMessage called');
                wg.onMemberJoin = () => fail('onMemberJoin called');
                wg.onMemberLeave = () => fail('onMemberLeave called');
                let firstStateDone = false;
                function resolveCheck() {
                    if (firstStateDone) {
                        expect(wg.myId).toBe(oldMyId);
                        expect(wg.id).toBe(oldId);
                        expect(typeof wg.key).toBe('string');
                        expect(wg.members).toEqual([wg.myId]);
                        expect(wg.topology).toBe(Topology.FULL_MESH);
                        expect(wg.state).toBe(WebGroupState.JOINED);
                        expect(wg.signalingState).toBe(SignalingState.READY_TO_JOIN_OTHERS);
                        expect(wg.signalingURL).toBe(SIGNALING_URL);
                        expect(wg.autoRejoin).toBeTruthy();
                        setTimeout(() => {
                            expect(wg.state).toBe(WebGroupState.JOINED);
                            expect(wg.signalingState).toBe(SignalingState.READY_TO_JOIN_OTHERS);
                            resolve();
                        }, 100);
                    }
                    else {
                        firstStateDone = true;
                    }
                }
                const onStateChangeGen = (function* () {
                    let state = yield;
                    expect(state).toEqual(WebGroupState.JOINING);
                    expect(wg.state).toBe(state);
                    state = yield;
                    expect(state).toEqual(WebGroupState.JOINED);
                    expect(wg.state).toBe(state);
                    resolveCheck();
                })();
                onStateChangeGen.next();
                const onSignalingStateChangeGen = (function* () {
                    let state = yield;
                    expect(state).toEqual(SignalingState.CONNECTING);
                    expect(wg.signalingState).toBe(state);
                    state = yield;
                    expect(state).toEqual(SignalingState.OPEN);
                    expect(wg.signalingState).toBe(state);
                    state = yield;
                    expect(state).toEqual(SignalingState.READY_TO_JOIN_OTHERS);
                    expect(wg.signalingState).toBe(state);
                    resolveCheck();
                })();
                onSignalingStateChangeGen.next();
                wg.onStateChange = (state) => onStateChangeGen.next(state);
                wg.onSignalingStateChange = (state) => onSignalingStateChangeGen.next(state);
                try {
                    wg.join();
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        /** @test {WebGroup#join} */
        it('should join without a provided key', (done) => {
            expectToJoin().then(() => {
                expect(wg.key).not.toBe('');
                done();
            })
                .catch((err) => fail(err));
        });
        /** @test {WebGroup#join} */
        it('should join with a provided key', (done) => {
            const key = `Free from desire, you realize the mystery.
        Caught in desire, you see only the manifestations. (Tao Te Ching)`;
            expectToJoin(key).then(() => {
                expect(wg.key).not.toBe(key);
                done();
            })
                .catch((err) => fail(err));
        });
        function expectToThrowErrorWhenJoin(webGroup, key, errMessage) {
            webGroup.onStateChange = () => fail('onStateChange called');
            webGroup.onSignalingStateChange = () => fail('onSignalingStateChange called');
            webGroup.onMessage = () => fail('onMessage called');
            webGroup.onMemberJoin = () => fail('onMemberJoin called');
            webGroup.onMemberLeave = () => fail('onMemberLeave called');
            expect(() => webGroup.join(key)).toThrowError(errMessage);
            expect(webGroup.key).toBe('');
            expect(webGroup.members).toEqual([webGroup.myId]);
            expect(webGroup.topology).toBe(Topology.FULL_MESH);
            expect(webGroup.state).toBe(WebGroupState.LEFT);
            expect(webGroup.signalingState).toBe(SignalingState.CLOSED);
            expect(webGroup.signalingURL).toBe(SIGNALING_URL);
            expect(webGroup.autoRejoin).toBeTruthy();
            expect(webGroup.state).toBe(WebGroupState.LEFT);
            expect(webGroup.key).toBe('');
        }
        /** @test {WebGroup#join} */
        it('should throw an error, because the key is not a "string"', () => {
            const oldMyId = wg.myId;
            const oldId = wg.id;
            const key = 42;
            expectToThrowErrorWhenJoin(wg, key, 'Failed to join: the key type "number" is not a "string"');
            expect(wg.myId).toBe(oldMyId);
            expect(wg.id).toBe(oldId);
        });
        /** @test {WebGroup#join} */
        it('should throw an error, because the key is an empty string', () => {
            const oldMyId = wg.myId;
            const oldId = wg.id;
            const key = '';
            expectToThrowErrorWhenJoin(wg, key, 'Failed to join: the key is an empty string');
            expect(wg.myId).toBe(oldMyId);
            expect(wg.id).toBe(oldId);
        });
        /** @test {WebGroup#join} */
        it('should throw an error, because the key length is too long', () => {
            const oldMyId = wg.myId;
            const oldId = wg.id;
            const key = `
        PAYING DOUBLE FOR CAMELS
        A camel dealer reached a village to sell fine animals at a very good price.
        Everyone bought one, except Mr. Hoosep.

        Some time later, the village received a visit from another dealer, with
        excellent camels, but they were much more expensive. This time, Hoosep
        bought some animals.

        "You did not buy the camels when they were almost for free, and now you
        pay almost double," criticized his friends.

        "Those cheap ones were very expensive for me, because at that time I had
        very little money," answered Hoosep, "these animals might seem more
        expensive, but for me they are cheap, because I have more than enough to
        buy them." (Paulo Coelho)
      `;
            expectToThrowErrorWhenJoin(wg, key, `Failed to join : the key length of ${key.length} exceeds the maximum of ${MAX_KEY_LENGTH} characters`);
            expect(wg.myId).toBe(oldMyId);
            expect(wg.id).toBe(oldId);
        });
    });
    /** @test {WebGroup#closeSignaling} */
    describe('closeSignaling', () => {
        let wg;
        beforeEach(() => wg = new WebGroup({ signalingURL: SIGNALING_URL }));
        // afterEach (() => wg.leave())
        /** @test {WebGroup#closeSignaling} */
        it('should do nothing', (done) => {
            const oldId = wg.id;
            const oldMyId = wg.myId;
            wg.onStateChange = () => fail('onStateChange called');
            wg.onSignalingStateChange = () => fail('onSignalingStateChange called');
            wg.onMessage = () => fail('onMessage called');
            wg.onMemberJoin = () => fail('onMemberJoin called');
            wg.onMemberLeave = () => fail('onMemberLeave called');
            wg.closeSignaling();
            setTimeout(() => {
                expect(wg.myId).toBe(oldMyId);
                expect(wg.id).toBe(oldId);
                expect(wg.key).toBe('');
                expect(wg.members).toEqual([wg.myId]);
                expect(wg.topology).toBe(Topology.FULL_MESH);
                expect(wg.state).toBe(WebGroupState.LEFT);
                expect(wg.signalingState).toBe(SignalingState.CLOSED);
                expect(wg.signalingURL).toBe(SIGNALING_URL);
                expect(wg.autoRejoin).toBeTruthy();
                done();
            }, 100);
        });
        /** @test {WebGroup#closeSignaling} */
        it('should close the connection with Signaling server and leave the group after calling join', (done) => {
            const oldId = wg.id;
            const oldMyId = wg.myId;
            wg.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    setTimeout(() => {
                        wg.onStateChange = (s) => expect(s).toBe(WebGroupState.LEFT);
                        wg.onSignalingStateChange = (s) => expect(s).toBe(SignalingState.CLOSED);
                        wg.onMessage = () => fail('onMessage called');
                        wg.onMemberJoin = () => fail('onMemberJoin called');
                        wg.onMemberLeave = () => fail('onMemberLeave called');
                        wg.closeSignaling();
                        setTimeout(() => {
                            expect(wg.myId).toBe(oldMyId);
                            expect(wg.id).toBe(oldId);
                            expect(wg.key).toBe('');
                            expect(wg.members).toEqual([wg.myId]);
                            expect(wg.topology).toBe(Topology.FULL_MESH);
                            expect(wg.state).toBe(WebGroupState.LEFT);
                            expect(wg.signalingState).toBe(SignalingState.CLOSED);
                            expect(wg.signalingURL).toBe(SIGNALING_URL);
                            expect(wg.autoRejoin).toBeTruthy();
                            done();
                        }, 100);
                    }, 100);
                }
            };
            wg.join();
        });
    });
});
