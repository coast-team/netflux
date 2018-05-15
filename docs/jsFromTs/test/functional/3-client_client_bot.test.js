/// <reference types='jasmine' />
/* tslint:disable:one-variable-per-declaration */
import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser';
import { areTheSame, BOT_URL, botGetData, botWaitJoin, randomKey, SIGNALING_URL, } from '../util/helper';
const WebGroupOptions = {
    signalingServer: SIGNALING_URL,
    autoRejoin: false,
};
/** @test {WebGroup} */
describe('🙂 🙂 🤖 - 3 members: 2 clients and 1 bot', () => {
    /** @test {WebGroup#invite} */
    it('join', (done) => {
        const key = randomKey();
        const wg1 = new WebGroup(WebGroupOptions);
        let wgId = wg1.id;
        const wg1JoinedMembers = [];
        const wg1LeftMembers = [];
        let wg1OnMessageCalled = 0;
        const wg2 = new WebGroup(WebGroupOptions);
        const wg2LeftMembers = [];
        const wg2JoinedMembers = [];
        let wg2OnMessageCalled = 0;
        wg1.onMessage = () => wg1OnMessageCalled++;
        wg1.onMemberJoin = (id) => wg1JoinedMembers.push(id);
        wg1.onMemberLeave = (id) => wg1LeftMembers.push(id);
        wg1.onStateChange = (state) => {
            if (state === WebGroupState.JOINED) {
                wgId = wg1.id;
                wg2.join(key);
            }
        };
        wg1.onMessage = () => wg2OnMessageCalled++;
        wg2.onMemberJoin = (id) => wg2JoinedMembers.push(id);
        wg2.onMemberLeave = (id) => wg2LeftMembers.push(id);
        wg2.onStateChange = (state) => {
            if (state === WebGroupState.JOINED) {
                wg2.invite(BOT_URL);
            }
        };
        botWaitJoin(key)
            .then(() => botGetData(key))
            .then((bot) => {
            const expectedMembers = [wg1.myId, wg2.myId, bot.myId];
            // Expect for the first client
            expect(wg1.state).toEqual(WebGroupState.JOINED);
            expect(wg1.signalingState).not.toEqual(SignalingState.CLOSED);
            expect(wg1OnMessageCalled).toEqual(0);
            expect(wg1.key).toEqual(key);
            expect(wg1.id).toEqual(wgId);
            expect(wg1.topology).toEqual(Topology.FULL_MESH);
            expect(wg1.signalingServer).toEqual(SIGNALING_URL);
            expect(wg1.autoRejoin).toBeFalsy();
            expect(areTheSame(wg1.members, expectedMembers)).toBeTruthy();
            expect(areTheSame(wg1JoinedMembers, [wg2.myId, bot.myId])).toBeTruthy();
            expect(areTheSame(wg1LeftMembers, [])).toBeTruthy();
            // Expect for the second client
            expect(wg2.state).toEqual(WebGroupState.JOINED);
            expect(wg2.signalingState).not.toEqual(SignalingState.CLOSED);
            expect(wg2OnMessageCalled).toEqual(0);
            expect(wg2.key).toEqual(key);
            expect(wg2.id).toEqual(wgId);
            expect(wg2.topology).toEqual(Topology.FULL_MESH);
            expect(wg2.signalingServer).toEqual(SIGNALING_URL);
            expect(wg2.autoRejoin).toBeFalsy();
            expect(areTheSame(wg2.members, expectedMembers)).toBeTruthy();
            expect(areTheSame(wg2JoinedMembers, [wg1.myId, bot.myId])).toBeTruthy();
            expect(areTheSame(wg2LeftMembers, [])).toBeTruthy();
            // Expect for the bot
            expect(bot.state).toEqual(WebGroupState.JOINED);
            expect(bot.signalingState).not.toEqual(SignalingState.CLOSED);
            expect(bot.onMessageToBeCalled).toEqual(0);
            expect(bot.key).toEqual(key);
            expect(bot.id).toEqual(wgId);
            expect(bot.topology).toEqual(Topology.FULL_MESH);
            expect(bot.signalingServer).toEqual(SIGNALING_URL);
            expect(bot.autoRejoin).toBeFalsy();
            expect(areTheSame(bot.members, expectedMembers)).toBeTruthy();
            expect(areTheSame(bot.joinedMembers, [wg1.myId, wg2.myId])).toBeTruthy();
            expect(areTheSame(bot.leftMembers, [])).toBeTruthy();
            done();
        });
        wg1.join(key);
    });
});
