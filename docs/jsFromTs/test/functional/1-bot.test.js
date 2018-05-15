/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroupState } from '../../src/index.browser';
import { botGetData, botJoin, botLeave, botWaitJoin, randomKey, SIGNALING_URL, } from '../util/helper';
/** @test {WebGroup} */
describe('🤖 - 1 bot', () => {
    /** @test {WebGroup#join} */
    describe('join', () => {
        let key;
        beforeEach((done) => {
            key = randomKey();
            botJoin(key).then(() => done());
        });
        afterEach((done) => {
            botLeave(key).then(() => done());
        });
        /** @test {WebGroup#onSignalingStateChange} */
        it('should change the Signaling state', (done) => {
            const expected = [
                SignalingState.CONNECTING,
                SignalingState.OPEN,
                SignalingState.CHECKING,
                SignalingState.CHECKED,
                SignalingState.CHECKING,
                SignalingState.CHECKED,
            ];
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.onSignalingStateCalled).toEqual(expected.length);
                expect(data.signalingStates).toEqual(expected);
                expect(data.signalingState).toEqual(SignalingState.CHECKED);
                done();
            });
        });
        /** @test {WebGroup#onStateChange} */
        it('should change the WebGroup state', (done) => {
            const expected = [WebGroupState.JOINING, WebGroupState.JOINED];
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.state).toEqual(WebGroupState.JOINED);
                expect(data.states).toEqual(expected);
                expect(data.onStateCalled).toEqual(expected.length);
                done();
            });
        });
        /** @test {WebGroup#onMemberJoin} */
        it('should NOT be notified about new member', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.onMemberJoinCalled).toEqual(0);
                expect(data.joinedMembers.length).toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#onMemberLeave} */
        it('should NOT be notified about left member', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.onMemberLeaveCalled).toEqual(0);
                expect(data.leftMembers.length).toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#onMessage} */
        it('should NOT receive any message', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.onMessageToBeCalled).toEqual(0);
                expect(data.messages).toEqual([]);
                done();
            });
        });
        /** @test {WebGroup#autoRejoin} */
        it('autoRejoin should be disabled', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.autoRejoin).toBeFalsy();
                done();
            });
        });
        /** @test {WebGroup#signalinServer} */
        it('signalinServer should not change', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.signalingServer).toEqual(SIGNALING_URL);
                done();
            });
        });
        /** @test {WebGroup#topology} */
        it('topology should not change', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.topology).toEqual(Topology.FULL_MESH);
                done();
            });
        });
        /** @test {WebGroup#members} */
        it('should have only me as a member', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.members).toEqual([data.myId]);
                done();
            });
        });
        /** @test {WebGroup#myId} */
        it('my id should not be 0', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.myId).not.toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#id} */
        it('WebGroup id should not be 0', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.id).not.toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#key} */
        it('key should be the one provided to the join method', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.key).toEqual(key);
                done();
            });
        });
        /** @test {WebGroup#state} */
        it('WebGroup state should be JOINED', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.state).toEqual(WebGroupState.JOINED);
                done();
            });
        });
        /** @test {WebGroup#signalingState} */
        it('Signaling state should be CHECKED', (done) => {
            botWaitJoin(key)
                .then(() => botGetData(key))
                .then((data) => {
                expect(data.signalingState).toEqual(SignalingState.CHECKED);
                done();
            });
        });
    });
    /** @test {WebGroup#leave} */
    describe('leave', () => {
        let key;
        beforeEach((done) => {
            key = randomKey();
            botJoin(key).then(() => done());
        });
        /** @test {WebGroup#onStateChange} */
        it('should change the WebGroup state', (done) => {
            const expected = [WebGroupState.JOINING, WebGroupState.JOINED, WebGroupState.LEFT];
            botLeave(key).then((data) => {
                expect(data.states).toEqual(expected);
                expect(data.onStateCalled).toEqual(expected.length);
                done();
            });
        });
        /** @test {WebGroup#onSignalingStateChange} */
        it('should change the Signaling state', (done) => {
            const expected = [
                SignalingState.CONNECTING,
                SignalingState.OPEN,
                SignalingState.CHECKING,
                SignalingState.CHECKED,
                SignalingState.CHECKING,
                SignalingState.CHECKED,
                SignalingState.CLOSED,
            ];
            botLeave(key).then((data) => {
                expect(data.signalingStates).toEqual(expected);
                expect(data.onSignalingStateCalled).toEqual(expected.length);
                done();
            });
        });
        /** @test {WebGroup#onMemberJoin} */
        it('should NOT be notified about new member', (done) => {
            botLeave(key).then((data) => {
                expect(data.onMemberJoinCalled).toEqual(0);
                expect(data.joinedMembers.length).toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#onMemberLeave} */
        it('should NOT be notified about left member', (done) => {
            botLeave(key).then((data) => {
                expect(data.onMemberLeaveCalled).toEqual(0);
                expect(data.leftMembers.length).toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#onMessage} */
        it('should NOT receive any message', (done) => {
            botLeave(key).then((data) => {
                expect(data.onMessageToBeCalled).toEqual(0);
                expect(data.messages).toEqual([]);
                done();
            });
        });
        /** @test {WebGroup#autoRejoin} */
        it('autoRejoin should be disabled', (done) => {
            botLeave(key).then((data) => {
                expect(data.autoRejoin).toBeFalsy();
                done();
            });
        });
        /** @test {WebGroup#signalinServer} */
        it('signalinServer should not change', (done) => {
            botLeave(key).then((data) => {
                expect(data.signalingServer).toEqual(SIGNALING_URL);
                done();
            });
        });
        /** @test {WebGroup#topology} */
        it('topology should not change', (done) => {
            botLeave(key).then((data) => {
                expect(data.topology).toEqual(Topology.FULL_MESH);
                done();
            });
        });
        /** @test {WebGroup#members} */
        it('should have no members', (done) => {
            botLeave(key).then((data) => {
                expect(data.members).toEqual([]);
                done();
            });
        });
        /** @test {WebGroup#myId} */
        it('my id should be 0', (done) => {
            botLeave(key).then((data) => {
                expect(data.myId).toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#id} */
        it('WebGroup id should be 0', (done) => {
            botLeave(key).then((data) => {
                expect(data.id).toEqual(0);
                done();
            });
        });
        /** @test {WebGroup#key} */
        it('key should be empty', (done) => {
            botLeave(key).then((data) => {
                expect(data.key).toEqual('');
                done();
            });
        });
        /** @test {WebGroup#state} */
        it('WebGroup state should be LEFT', (done) => {
            botLeave(key).then((data) => {
                expect(data.state).toEqual(WebGroupState.LEFT);
                done();
            });
        });
        /** @test {WebGroup#signalingState} */
        it('Signaling state should be CLOSED', (done) => {
            botLeave(key).then((data) => {
                expect(data.signalingState).toEqual(SignalingState.CLOSED);
                done();
            });
        });
    });
});
