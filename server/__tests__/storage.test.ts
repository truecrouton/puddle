import { DELETE_CHART, GET_CHARTS, GET_PAIRS, GET_TOPIC_STATUS, GET_TOPICS, UPSERT_CHART, UPSERT_TOPIC } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { randAccessory, randNumber, randWord } from '@ngneat/falso';
import { addMinutes, addSeconds, format, subSeconds } from 'date-fns';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('storing and retrieving a mqtt message', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"linkquality":59,"humidity":32,"update":"available"}');
    expect(topicId).toBeGreaterThan(0);

    const topicRes = await executeOperation(GET_TOPIC_STATUS, { id: topicId });
    expect(topicRes.topic.id).toBeTypeOf('number');
    expect(topicRes.topic.id).toEqual(topicId);
    expect(topicRes.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'linkquality', value: "59" }),
        ])
    );
    expect(topicRes.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'humidity', value: "32" }),
        ])
    );
    expect(topicRes.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'update', value: "available" }),
        ])
    );
});

test('cache invalidation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId1 = storeMessage(topic.topic, '{"humidity":43, "occupancy":0, "no_occupancy_since":60, "update":{"state":"available"}}');
    expect(topicId1).toBeGreaterThan(0);

    const topicRes1 = await executeOperation(GET_TOPIC_STATUS, { id: topicId1 });
    expect(topicRes1.topic.id).toBeTypeOf('number');
    expect(topicRes1.topic.id).toEqual(topicId1);
    expect(topicRes1.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'no_occupancy_since', value: "60" }),
        ])
    );

    const topicId2 = storeMessage(topic.topic, '{"humidity":43, "occupancy":1, "update":{"state":"available"}}');
    expect(topicId2).toBeGreaterThan(0);
    expect(topicId2).toEqual(topicId1);

    const topicRes2 = await executeOperation(GET_TOPIC_STATUS, { id: topicId1 });
    expect(topicRes2.topic.id).toBeTypeOf('number');
    expect(topicRes2.topic.id).toEqual(topicId1);
    expect(topicRes2.topic.status).not.toContainEqual({ name: 'no_occupancy_since' });
    expect(topicRes2.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'humidity', value: "43" }),
        ])
    );
    expect(topicRes2.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'occupancy', value: "1" }),
        ])
    );

    const topicId3 = storeMessage(topic.topic, '{"humidity":43, "occupancy":0, "update":{"state":"available"}}');
    expect(topicId3).toBeGreaterThan(0);
    expect(topicId3).toEqual(topicId1);

    const topicRes3 = await executeOperation(GET_TOPIC_STATUS, { id: topicId1 });
    expect(topicRes3.topic.id).toBeTypeOf('number');
    expect(topicRes3.topic.id).toEqual(topicId1);
    expect(topicRes3.topic.status).not.toContainEqual({ name: 'no_occupancy_since' });
    expect(topicRes3.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'humidity', value: "43" }),
        ])
    );
    expect(topicRes3.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: 'occupancy', value: "0" }),
        ])
    );
});

test('storing the same message without duplication', async ({ executeOperation }) => {
    const now = new Date();
    const start = subSeconds(now, 5);

    const topic = createTopicFactory();
    const key = randWord().toLowerCase();
    const message = { [key]: 36, "state_bottom": "OFF", "state_top": "OFF", "update": { "state": "available" } };
    const topicId1 = storeMessage(topic.topic, JSON.stringify(message), start);
    expect(topicId1).toBeGreaterThan(0);

    const topicId2 = storeMessage(topic.topic, JSON.stringify(message), addSeconds(start, 1));
    expect(topicId2).toBeGreaterThan(0);
    expect(topicId2).toEqual(topicId1);

    storeMessage(topic.topic, JSON.stringify(message), addSeconds(start, 2));
    storeMessage(topic.topic, JSON.stringify(message), addSeconds(start, 3));
    storeMessage(topic.topic, JSON.stringify({ ...message, [key]: 37 }), addSeconds(start, 4));

    const offset = now.getTimezoneOffset();
    const dateFormat = 'yyyy-MM-dd HH:mm:ss';
    const pairsRes = await executeOperation(GET_PAIRS, { topicId: topicId1, name: key, startDate: addMinutes(start, offset).toISOString(), endDate: addMinutes(now, offset + 1).toISOString() });
    expect(pairsRes.pairs).toBeTypeOf('object');
    expect(pairsRes.pairs.length).toEqual(3);
    expect(pairsRes.pairs).not.toContainEqual({ createdAt: format(addMinutes(addSeconds(start, 1), offset), dateFormat), value: "36" });
    expect(pairsRes.pairs).not.toContainEqual({ createdAt: format(addMinutes(addSeconds(start, 2), offset), dateFormat), value: "36" });
    expect(pairsRes.pairs).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ createdAt: format(addMinutes(start, offset), dateFormat), value: "36" }),
        ])
    );
    expect(pairsRes.pairs).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ createdAt: format(addMinutes(addSeconds(start, 3), offset), dateFormat), value: "36" }),
        ])
    );
    expect(pairsRes.pairs).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ createdAt: format(addMinutes(addSeconds(start, 4), offset), dateFormat), value: "37" }),
        ])
    );
});

test('storing a mqtt message with invalid json', async () => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, 'this_is_not_json');
    expect(topicId).toEqual(0);
});