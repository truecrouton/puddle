import { GET_TOPIC_STATUS, GET_TOPICS, UPSERT_TOPIC } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { initFastify } from '../src/graphql/server';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('create and get topics', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicRes = await executeOperation(UPSERT_TOPIC, { input: topic });
    expect(topicRes.upsertTopic).toBeTruthy();
    expect(topicRes.upsertTopic.id).toBeTypeOf('number');
    expect(topicRes.upsertTopic.id).toBeGreaterThan(0);
    expect(topicRes.upsertTopic.topic).toEqual(topic.topic);

    const getTopicsRes = await executeOperation(GET_TOPICS);
    expect(getTopicsRes.topics).toBeTruthy();
    expect(getTopicsRes.topics.length).toBeGreaterThan(0);
    expect(getTopicsRes.topics).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: topicRes.upsertTopic.id, topic: topic.topic }),
        ])
    );
});

test('create and get topic status', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"humidity":88,"state":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const getTopicsRes = await executeOperation(GET_TOPICS);
    expect(getTopicsRes.topics).toBeTruthy();
    expect(getTopicsRes.topics.length).toBeGreaterThan(0);
    expect(getTopicsRes.topics).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: topicId, topic: topic.topic }),
        ])
    );

    const getTopicStatusRes = await executeOperation(GET_TOPIC_STATUS, { id: topicId });
    expect(getTopicStatusRes.topic.id).toEqual(topicId);
    expect(getTopicStatusRes.topic.status.length).toBeGreaterThan(0);
    expect(getTopicStatusRes.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: "humidity", value: '88' }),
        ])
    );
    expect(getTopicStatusRes.topic.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: "state", value: 'OFF' }),
        ])
    );
});