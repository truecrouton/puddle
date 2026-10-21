import { GET_TOPICS, UPSERT_TOPIC } from '@/lib/queries';
import { test, expect } from '@/__tests__/utils/fixtures';
import { createDeviceFactory, createTopicFactory } from './utils/factories';

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