'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { Topic, storageInit, storeMessage } from "../src/storage";
import { randWord } from '@ngneat/falso';
import { addSeconds, subSeconds, addMinutes } from 'date-fns';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, test } = lab;
export { lab };

experiment('store and get mqtt messages', () => {
    let server: Server;

    before((async () => {
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    test('storing and retrieving a mqtt message', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":99,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        expect(topicId).to.be.greaterThan(0);

        const { result }: { result: Topic | undefined; } = await server.inject({
            method: 'post',
            url: '/api/topic/get',
            payload: { topic_id: topicId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result).to.be.object();
        expect(result?.topic).to.equal(topic);
    });

    test('storing the same message without duplication', async () => {
        const now = new Date();
        const start = subSeconds(now, 5);

        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const key = randWord().toLowerCase();
        const message = { [key]: 36, "state_bottom": "OFF", "state_top": "OFF", "update": { "state": "available" } };
        const topicId1 = storeMessage(topic, JSON.stringify(message), start);
        expect(topicId1).to.be.greaterThan(0);

        const topicId2 = storeMessage(topic, JSON.stringify(message), addSeconds(start, 1));
        expect(topicId2).to.be.greaterThan(0);

        expect(topicId1).to.equal(topicId2);

        storeMessage(topic, JSON.stringify(message), addSeconds(start, 2));
        storeMessage(topic, JSON.stringify(message), addSeconds(start, 3));
        storeMessage(topic, JSON.stringify({ ...message, [key]: 37 }), addSeconds(start, 4));

        const offset = now.getTimezoneOffset();
        const res = await server.inject({
            method: 'post',
            url: '/api/pairs/get',
            payload: { topic_id: topicId1, name: key, start_date: addMinutes(start, offset).toISOString(), end_date: addMinutes(now, offset + 1).toISOString() },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(result.pairs).to.be.array();

        const pairs = result.pairs;
        expect(pairs.length).to.be.equal(3);

        const keys = pairs.map((p) => p.value);
        expect(keys).to.equal([36, 36, 37]);
    });

    test('getting all mqtt messages', async () => {
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: '/api/topics/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result).to.be.object();
        expect(result.topics).to.be.array();
        expect(Number(result.topics.length)).to.be.greaterThan(0);
    });
});