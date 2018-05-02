/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser';
import { areTheSame, cleanWebGroup, SIGNALING_URL, wait } from '../util/helper';
const WebGroupOptions = {
    signalingServer: SIGNALING_URL,
    autoRejoin: false,
};
/** @test {WebGroup} */
describe('1 member', () => {
    describe('🙂', () => {
        let wg1;
        /** @test {WebGroup#constructor} */
        it('constructor', () => {
            const wg = new WebGroup({ signalingServer: SIGNALING_URL });
            // Check members
            const id = Reflect.getOwnPropertyDescriptor(wg, 'id');
            expect(id).toBeDefined();
            expect(typeof wg.id).toBe('number');
            expect(id.set).toBeUndefined();
            const myId = Reflect.getOwnPropertyDescriptor(wg, 'myId');
            expect(myId).toBeDefined();
            expect(typeof wg.myId).toBe('number');
            expect(myId.set).toBeUndefined();
            const key = Reflect.getOwnPropertyDescriptor(wg, 'key');
            expect(key).toBeDefined();
            expect(wg.key).toBe('');
            expect(key.set).toBeUndefined();
            const members = Reflect.getOwnPropertyDescriptor(wg, 'members');
            expect(members).toBeDefined();
            expect(wg.members).toEqual([wg.myId]);
            expect(members.set).toBeUndefined();
            const topology = Reflect.getOwnPropertyDescriptor(wg, 'topology');
            expect(topology).toBeDefined();
            expect(wg.topology).toBe(Topology.FULL_MESH);
            expect(topology.set).toBeUndefined();
            const state = Reflect.getOwnPropertyDescriptor(wg, 'state');
            expect(state).toBeDefined();
            expect(wg.state).toBe(WebGroupState.LEFT);
            expect(state.set).toBeUndefined();
            const signalingState = Reflect.getOwnPropertyDescriptor(wg, 'signalingState');
            expect(signalingState).toBeDefined();
            expect(wg.signalingState).toBe(SignalingState.CLOSED);
            expect(signalingState.set).toBeUndefined();
            const signalingServer = Reflect.getOwnPropertyDescriptor(wg, 'signalingServer');
            expect(signalingServer).toBeDefined();
            expect(wg.signalingServer).toBe(SIGNALING_URL);
            expect(signalingServer.set).toBeUndefined();
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
            expect(typeof wg.leave).toBe('function');
            expect(typeof wg.send).toBe('function');
            expect(typeof wg.sendTo).toBe('function');
        });
        /** @test {WebGroup#join} */
        describe('joining', () => {
            beforeEach(() => {
                wg1 = new WebGroup(WebGroupOptions);
            });
            afterEach((done) => {
                cleanWebGroup(wg1);
                if (wg1.state !== WebGroupState.LEFT) {
                    wg1.onStateChange = (state) => {
                        if (state === WebGroupState.LEFT) {
                            done();
                        }
                    };
                    wg1.leave();
                }
                else {
                    cleanWebGroup(wg1);
                    done();
                }
            });
            /** @test {WebGroup#onSignalingStateChange} */
            it('should change the Signaling state', (done) => {
                let called = 0;
                const states = [];
                const expectedStates = [
                    SignalingState.CONNECTING,
                    SignalingState.OPEN,
                    SignalingState.CHECKING,
                    SignalingState.CHECKED,
                ];
                wg1.onSignalingStateChange = (state) => {
                    called++;
                    states.push(state);
                    if (called === expectedStates.length) {
                        wait(1000).then(() => {
                            expect(states).toEqual(expectedStates);
                            expect(called).toEqual(expectedStates.length);
                            expect(wg1.signalingState).toEqual(SignalingState.CHECKED);
                            done();
                        });
                    }
                };
                // Start joining
                wg1.join();
            });
            /** @test {WebGroup#onStateChange} */
            it('should change the WebGroup state', (done) => {
                let called = 0;
                const states = [];
                const expectedStates = [WebGroupState.JOINING, WebGroupState.JOINED];
                wg1.onStateChange = (state) => {
                    called++;
                    states.push(state);
                    if (called === expectedStates.length) {
                        wait(1000).then(() => {
                            expect(states).toEqual(expectedStates);
                            expect(called).toEqual(expectedStates.length);
                            expect(wg1.state).toEqual(WebGroupState.JOINED);
                            done();
                        });
                    }
                };
                // Start joining
                wg1.join();
            });
            /** @test {WebGroup#onMemberJoin} */
            it('should NOT be notified about new member', (done) => {
                let called1 = 0;
                wg1.onMemberJoin = () => called1++;
                wg1.onStateChange = (state) => {
                    if (state === WebGroupState.JOINED) {
                        wait(1000).then(() => {
                            expect(called1).toEqual(0);
                            done();
                        });
                    }
                };
                // Start joining
                wg1.join();
            });
            it('should have the same members, WebGroup id, topology and NOT empty key once joined', (done) => {
                const members = Array.from(wg1.members);
                const myId = wg1.myId;
                const id = wg1.id;
                const topology = wg1.topology;
                wg1.onStateChange = (state) => {
                    if (state === WebGroupState.JOINED) {
                        expect(areTheSame(wg1.members, members)).toBeTruthy();
                        expect(myId).toEqual(wg1.myId);
                        expect(id).toEqual(wg1.id);
                        expect(topology).toEqual(wg1.topology);
                        expect(wg1.key).not.toEqual('');
                        wait(1000).then(() => {
                            expect(areTheSame(wg1.members, members)).toBeTruthy();
                            expect(myId).toEqual(wg1.myId);
                            expect(id).toEqual(wg1.id);
                            expect(topology).toEqual(wg1.topology);
                            expect(wg1.key).not.toEqual('');
                            done();
                        });
                    }
                };
                // Start joining
                wg1.join();
            });
            /** @test {WebGroup#join} */
            it('should join with the specified key', (done) => {
                const key = 'ArtIsLongLifeIsShort';
                const wg = new WebGroup(WebGroupOptions);
                wg.onStateChange = (state) => {
                    if (state === WebGroupState.JOINED) {
                        expect(wg.key).toEqual(key);
                        wg.leave();
                        done();
                    }
                };
                // Start joining
                wg.join(key);
            });
        });
        describe('leaving', () => {
            beforeEach((done) => {
                wg1 = new WebGroup(WebGroupOptions);
                wg1.onStateChange = (state) => {
                    if (state === WebGroupState.JOINED) {
                        cleanWebGroup(wg1);
                        done();
                    }
                };
                wg1.join();
            });
            afterEach(() => cleanWebGroup(wg1));
            /** @test {WebGroup#leave} */
            it('should have the same members, WebGroup id, topology and an empty key', (done) => {
                const members = Array.from(wg1.members);
                const myId = wg1.myId;
                const id = wg1.id;
                const topology = wg1.topology;
                wg1.onStateChange = (state) => {
                    if (state === WebGroupState.LEFT) {
                        expect(areTheSame(wg1.members, members)).toBeTruthy();
                        expect(myId).toEqual(wg1.myId);
                        expect(id).toEqual(wg1.id);
                        expect(topology).toEqual(wg1.topology);
                        expect(wg1.key).toEqual('');
                        wait(1000).then(() => {
                            expect(areTheSame(wg1.members, members)).toBeTruthy();
                            expect(myId).toEqual(wg1.myId);
                            expect(id).toEqual(wg1.id);
                            expect(topology).toEqual(wg1.topology);
                            expect(wg1.key).toEqual('');
                            done();
                        });
                    }
                };
                // Start leaving
                wg1.leave();
            });
            /** @test {WebGroup#onMemberLeave} */
            it('should be NOT notified about left member', (done) => {
                let called1 = 0;
                wg1.onMemberJoin = () => called1++;
                wg1.onStateChange = (state) => {
                    if (state === WebGroupState.LEFT) {
                        wait(1000).then(() => {
                            expect(called1).toEqual(0);
                            done();
                        });
                    }
                };
                // Start leaving
                wg1.leave();
            });
            /** @test {WebGroup#onStateChange} */
            it('should change the WebGroup state', (done) => {
                let called1 = 0;
                const states = [];
                const expectedStates = [WebGroupState.LEAVING, WebGroupState.LEFT];
                wg1.onStateChange = (state) => {
                    states.push(state);
                    called1++;
                    if (state === WebGroupState.LEFT) {
                        wait(1000).then(() => {
                            expect(called1).toEqual(2);
                            expect(states).toEqual(expectedStates);
                            expect(state).toEqual(WebGroupState.LEFT);
                            done();
                        });
                    }
                };
                // Start leaving
                wg1.leave();
            });
            /** @test {WebGroup#onSignalingStateChange} */
            it('should change the Signaling state', (done) => {
                let called1 = 0;
                const states = [];
                const expectedStates = [SignalingState.CLOSING, SignalingState.CLOSED];
                wg1.onSignalingStateChange = (state) => {
                    states.push(state);
                    called1++;
                    wait(1000).then(() => {
                        expect(called1).toEqual(2);
                        expect(states).toEqual(expectedStates);
                        done();
                    });
                };
                // Start leaving
                wg1.leave();
            });
        });
    });
});
