/// <reference types='jasmine' />
/* tslint:disable:one-variable-per-declaration */
import { SignalingState, Topology, WebGroup } from '../../src/index.browser';
import { WebGroupState } from '../../src/index.browser';
import { areTheSame, botGetData, botJoin, botLeave, cleanWebGroup, randomKey, SIGNALING_URL, wait, } from '../util/helper';
const WebGroupOptions = {
    signalingServer: SIGNALING_URL,
    autoRejoin: false,
};
/** @test {WebGroup} */
describe('🤖 🙂 - 2 members: bot first, then client', () => {
    let called;
    let key;
    let client;
    beforeEach(() => {
        called = 0;
        key = randomKey();
        client = new WebGroup(WebGroupOptions);
    });
    /** @test {WebGroup#join} */
    describe('join', () => {
        beforeEach((done) => botJoin(key).then(() => done()));
        afterEach((done) => {
            cleanWebGroup(client);
            client.leave();
            botLeave(key).then(() => done());
        });
        /** @test {WebGroup#onSignalingStateChange} */
        it('should change the Signaling state', (done) => {
            const states = [];
            const expected = [
                SignalingState.CONNECTING,
                SignalingState.OPEN,
                SignalingState.CHECKING,
                SignalingState.CHECKED,
                SignalingState.CHECKING,
                SignalingState.CHECKED,
            ];
            client.onSignalingStateChange = (state) => {
                states.push(state);
                called++;
                if (called === expected.length) {
                    expect(states).toEqual(expected);
                    botGetData(key).then((bot) => {
                        expect(bot.signalingState).toEqual(SignalingState.CHECKED);
                        expect(called).toEqual(expected.length);
                        expect(states).toEqual(expected);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#signalingState} */
        it('Signaling state should be CHECKED', (done) => {
            client.onSignalingStateChange = (state) => {
                called++;
                if (called === 6) {
                    botGetData(key).then((bot) => {
                        expect(bot.signalingState).toEqual(SignalingState.CHECKED);
                        expect(client.signalingState).toEqual(SignalingState.CHECKED);
                        expect(called).toEqual(6);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#onStateChange} */
        it('should change the WebGroup state', (done) => {
            const states = [];
            const expected = [WebGroupState.JOINING, WebGroupState.JOINED];
            client.onStateChange = (state) => {
                states.push(state);
                called++;
                if (called === expected.length) {
                    expect(states).toEqual(expected);
                    botGetData(key).then((bot) => {
                        expect(bot.state).toEqual(WebGroupState.JOINED);
                        expect(called).toEqual(expected.length);
                        expect(states).toEqual(expected);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#state} */
        it('WebGroup state should be JOINED', (done) => {
            client.onStateChange = (state) => {
                called++;
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(bot.state).toEqual(WebGroupState.JOINED);
                        expect(client.state).toEqual(WebGroupState.JOINED);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#onMemberJoin} */
        it('should be notified about new member', (done) => {
            const joinedMembers = [];
            client.onMemberJoin = (id) => {
                joinedMembers.push(id);
                botGetData(key).then((bot) => {
                    expect(joinedMembers).toEqual([bot.myId]);
                    expect(bot.joinedMembers).toEqual([client.myId]);
                    done();
                });
            };
            client.join(key);
        });
        /** @test {WebGroup#onMemberLeave} */
        it('should NOT be notified about left member', (done) => {
            const leftMembers = [];
            client.onMemberLeave = (id) => leftMembers.push(id);
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(leftMembers).toEqual([]);
                        expect(bot.leftMembers).toEqual([]);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#onMessage} */
        it('should NOT receive any message', (done) => {
            client.onMessage = (id) => called++;
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(called).toEqual(0);
                        expect(bot.onMessageToBeCalled).toEqual(0);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#members} */
        it('should have 2 members', (done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        const expected = [bot.myId, client.myId];
                        expect(areTheSame(bot.members, expected)).toBeTruthy();
                        expect(areTheSame(client.members, expected)).toBeTruthy();
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#myId} */
        it("bot's id should not change and the client's id should not be 0", (done) => {
            botGetData(key).then((bot) => {
                const botMyId = bot.myId;
                client.onStateChange = (state) => {
                    if (state === WebGroupState.JOINED) {
                        botGetData(key).then((botAfter) => {
                            expect(botAfter.myId).toEqual(botMyId);
                            expect(client.myId).not.toEqual(0);
                            done();
                        });
                    }
                };
                client.join(key);
            });
        });
        /** @test {WebGroup#id} */
        it('WebGroup id should not change, should be the same and not 0', (done) => {
            botGetData(key).then((bot) => {
                const botWgId = bot.id;
                client.onStateChange = (state) => {
                    if (state === WebGroupState.JOINED) {
                        botGetData(key).then((botAfter) => {
                            expect(botAfter.id).toEqual(botWgId);
                            expect(client.id).toEqual(botAfter.id);
                            expect(client.id).not.toEqual(0);
                            done();
                        });
                    }
                };
                client.join(key);
            });
        });
        /** @test {WebGroup#key} */
        it('key should not change, should be the same and not empty', (done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(client.key).toEqual(key);
                        expect(bot.key).toEqual(key);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#topology} */
        it('topology should not change', (done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(client.topology).toEqual(Topology.FULL_MESH);
                        expect(bot.topology).toEqual(Topology.FULL_MESH);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#signalingServer} */
        it('Signaling server should not change', (done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(client.signalingServer).toEqual(SIGNALING_URL);
                        expect(bot.signalingServer).toEqual(SIGNALING_URL);
                        done();
                    });
                }
            };
            client.join(key);
        });
        /** @test {WebGroup#autoRejoin} */
        it('autoRejoin should be disabled', (done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    botGetData(key).then((bot) => {
                        expect(client.autoRejoin).toBeFalsy();
                        expect(bot.autoRejoin).toBeFalsy();
                        done();
                    });
                }
            };
            client.join(key);
        });
    });
    describe('should send/receive', () => {
        beforeEach((done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    cleanWebGroup(client);
                    wait(500).then(() => done());
                }
            };
            botJoin(key).then(() => client.join(key));
        });
        afterEach(() => {
            cleanWebGroup(client);
            client.leave();
        });
        /** @test {WebGroup#send} */
        it('broadcast String', (done) => {
            const msgClient = 'sendArt is long, life is short';
            const msgBot = 'bot: ' + msgClient;
            client.onMessage = (id, msg) => {
                called++;
                expect(msg).toEqual(msgBot);
                // Check bot bot
                wait(1000)
                    .then(() => botGetData(key))
                    .then((bot) => {
                    expect(called).toEqual(1);
                    expect(id).toEqual(bot.myId);
                    expect(bot.onMessageToBeCalled).toEqual(1);
                    expect(bot.messages[0].msg).toEqual(msgClient);
                    expect(bot.messages[0].id).toEqual(client.myId);
                    done();
                })
                    .catch(fail);
            };
            // Start sending message
            client.send(msgClient);
        });
        /** @test {WebGroup#send} */
        it('broadcast ArrayBuffer', (done) => {
            const msgClient = new Uint8Array([10, 34, 248, 157, 10, 8, 220]);
            const msgBot = new Uint8Array([42, 34, 248, 157, 10, 8, 220]);
            // Code for peer 1
            client.onMessage = (id, msg) => {
                called++;
                expect(msg).toEqual(msgBot);
                // Check bot bot
                wait(1000)
                    .then(() => botGetData(client.key))
                    .then((bot) => {
                    expect(called).toEqual(1);
                    expect(id).toEqual(bot.myId);
                    expect(bot.onMessageToBeCalled).toEqual(1);
                    expect(bot.messages[0].msg).toEqual(Array.from(msgClient));
                    expect(bot.messages[0].id).toEqual(client.myId);
                    done();
                })
                    .catch(fail);
            };
            // Start sending message
            client.send(msgClient);
        });
        /** @test {WebGroup#sendTo} */
        it('private String', (done) => {
            const msgClient = 'Art is long, life is short';
            const msgBot = 'bot: ' + msgClient;
            // Code for peer 1
            client.onMessage = (id, msg) => {
                called++;
                expect(msg).toEqual(msgBot);
                // Check bot bot
                wait(1000)
                    .then(() => botGetData(client.key))
                    .then((bot) => {
                    expect(called).toEqual(1);
                    expect(id).toEqual(bot.myId);
                    expect(bot.onMessageToBeCalled).toEqual(1);
                    expect(bot.messages[0].msg).toEqual(msgClient);
                    expect(bot.messages[0].id).toEqual(client.myId);
                    done();
                })
                    .catch(fail);
            };
            // Start sending message
            client.sendTo(client.members[1], msgClient);
        });
        /** @test {WebGroup#sendTo} */
        it('private ArrayBuffer', (done) => {
            const msgClient = new Uint8Array([45, 34, 248, 157, 10, 8, 220]);
            const msgBot = new Uint8Array([42, 34, 248, 157, 10, 8, 220]);
            // Code for peer 1
            client.onMessage = (id, msg) => {
                called++;
                expect(msg).toEqual(msgBot);
                // Check bot bot
                wait(1000)
                    .then(() => botGetData(client.key))
                    .then((bot) => {
                    expect(called).toEqual(1);
                    expect(id).toEqual(bot.myId);
                    expect(bot.onMessageToBeCalled).toEqual(1);
                    expect(bot.messages[0].msg).toEqual(Array.from(msgClient));
                    expect(bot.messages[0].id).toEqual(client.myId);
                    done();
                })
                    .catch(fail);
            };
            // Start sending message
            client.sendTo(client.members[1], msgClient);
        });
    });
    describe('leave', () => {
        beforeEach((done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.JOINED) {
                    cleanWebGroup(client);
                    wait(500).then(() => done());
                }
            };
            botJoin(key).then(() => client.join(key));
        });
        afterEach(() => {
            cleanWebGroup(client);
            client.leave();
        });
        it('bot should still be connected to the signaling server', (done) => {
            client.onStateChange = (state) => {
                if (state === WebGroupState.LEFT) {
                    wait(1000)
                        .then(() => botGetData(key))
                        .then((bot) => {
                        expect(bot.state).toEqual(WebGroupState.JOINED);
                        expect(bot.signalingState).not.toEqual(SignalingState.CLOSED);
                        done();
                    });
                }
            };
            client.leave();
        });
    });
});
