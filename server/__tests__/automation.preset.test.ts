import { UPSERT_AUTOMATION, UPSERT_DEVICE, UPSERT_EXPRESSION } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createDeviceFactory, createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { UpsertExpressionInput } from 'puddle-graphql';
import { randAccessory, randVerb } from '@ngneat/falso';
import { runAutomation } from '../src/automation';
import { format, subSeconds } from 'date-fns';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('generate accurate preset values', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '12:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const today = new Date();
    const ifExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `date == "${format(today, 'yyyy-MM-dd')}"`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression1 });
    expect(ifExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const device = createDeviceFactory({ topicId });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);

    const deviceExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes1.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression1 });
    expect(deviceExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes1.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const ifExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `month == ${format(today, 'L')}`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression2 });
    expect(ifExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const deviceExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'OFF',
        conditionalExpressionId: ifExpressionRes2.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression2 });
    expect(deviceExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const runRes = await runAutomation(automationRes.upsertAutomation.id);
    expect(runRes).toBeTypeOf('object');
    expect(runRes.length).toEqual(2);
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes1.upsertExpression.id, kind: 'device', state: deviceExpression1.state, is_else_step: 0, conditional_expression_id: ifExpressionRes1.upsertExpression.id }),
        ])
    );
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes2.upsertExpression.id, kind: 'device', state: deviceExpression2.state, is_else_step: 0, conditional_expression_id: ifExpressionRes2.upsertExpression.id }),
        ])
    );
});

test('detect increasing and decreasing values', async ({ executeOperation }) => {
    const topicDec = createTopicFactory();
    const topicInc = createTopicFactory();
    const subTopicDec = topicDec.topic.split('/')[1];
    const subTopicInc = topicInc.topic.split('/')[1];
    const now = new Date();
    const start = subSeconds(now, 1);

    const decTopicId = storeMessage(topicDec.topic, JSON.stringify({ linkquality: 100, illuminance: 66 }), start);
    const incTopicId = storeMessage(topicInc.topic, JSON.stringify({ linkquality: 100, illuminance: 66 }), start);
    storeMessage(topicDec.topic, JSON.stringify({ linkquality: 100, illuminance: 33 }), now);
    storeMessage(topicInc.topic, JSON.stringify({ linkquality: 100, illuminance: 88 }), now);
    expect(decTopicId).toBeGreaterThan(0);
    expect(incTopicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '12:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `${subTopicInc}.illuminance >> 77 AND ${subTopicDec}.illuminance << 55`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression1 });
    expect(ifExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const device = createDeviceFactory({ topicId: decTopicId });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);

    const deviceExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'OFF',
        conditionalExpressionId: ifExpressionRes1.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression1 });
    expect(deviceExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const deviceExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes1.upsertExpression.id,
        isElseStep: true
    };
    const deviceExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression2 });
    expect(deviceExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const ifExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `${subTopicInc}.illuminance << 22`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression2 });
    expect(ifExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId: incTopicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes2.upsertExpression.id,
        isElseStep: false
    };
    const publishExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression1 });
    expect(publishExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId: incTopicId,
        message: '{"state_top":"OFF"}',
        conditionalExpressionId: ifExpressionRes2.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression2 });
    expect(publishExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const runRes = await runAutomation(automationRes.upsertAutomation.id);
    expect(runRes).toBeTypeOf('object');
    expect(runRes.length).toEqual(2);
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: publishExpressionRes2.upsertExpression.id, kind: 'publish', message: publishExpression2.message, is_else_step: 1, conditional_expression_id: ifExpressionRes2.upsertExpression.id }),
        ])
    );
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes1.upsertExpression.id, kind: 'device', state: deviceExpression1.state, is_else_step: 0, conditional_expression_id: ifExpressionRes1.upsertExpression.id }),
        ])
    );
});

test('detect last values', async ({ executeOperation }) => {
    const topic1 = createTopicFactory();
    const topic2 = createTopicFactory();
    const subTopic1 = topic1.topic.split('/')[1];
    const subTopic2 = topic2.topic.split('/')[1];
    const now = new Date();
    const start = subSeconds(now, 60);

    const topicId1 = storeMessage(topic1.topic, JSON.stringify({ linkquality: 100, occupancy: 0 }), start);
    const topicId2 = storeMessage(topic2.topic, JSON.stringify({ linkquality: 100, occupancy: 1 }), start);
    storeMessage(topic1.topic, JSON.stringify({ linkquality: 100, occupancy: 1 }), now);
    storeMessage(topic2.topic, JSON.stringify({ linkquality: 100, occupancy: 0 }), now);
    expect(topicId1).toBeGreaterThan(0);
    expect(topicId2).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '12:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `${subTopic2}.occupancy _>[>30] 0 AND ${subTopic2}.occupancy _=[<1] 0`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression1 });
    expect(ifExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const device = createDeviceFactory({ topicId: topicId1 });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);

    const deviceExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'OFF',
        conditionalExpressionId: ifExpressionRes1.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression1 });
    expect(deviceExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const deviceExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes1.upsertExpression.id,
        isElseStep: true
    };
    const deviceExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression2 });
    expect(deviceExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const ifExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `${subTopic1}.occupancy _<[>30] 1`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression2 });
    expect(ifExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId: topicId2,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes2.upsertExpression.id,
        isElseStep: false
    };
    const publishExpressionRes1 = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression1 });
    expect(publishExpressionRes1.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes1.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId: topicId2,
        message: '{"state_top":"OFF"}',
        conditionalExpressionId: ifExpressionRes2.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression2 });
    expect(publishExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const runRes = await runAutomation(automationRes.upsertAutomation.id);
    expect(runRes).toBeTypeOf('object');
    expect(runRes.length).toEqual(2);
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: publishExpressionRes1.upsertExpression.id, kind: 'publish', message: publishExpression1.message, is_else_step: 0, conditional_expression_id: ifExpressionRes2.upsertExpression.id }),
        ])
    );
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes1.upsertExpression.id, kind: 'device', state: deviceExpression1.state, is_else_step: 0, conditional_expression_id: ifExpressionRes1.upsertExpression.id }),
        ])
    );
});