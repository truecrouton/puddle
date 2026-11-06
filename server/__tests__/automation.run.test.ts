import { UPSERT_AUTOMATION, UPSERT_DEVICE, UPSERT_EXPRESSION } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createDeviceFactory, createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { UpsertExpressionInput } from 'puddle-graphql';
import { randAccessory, randVerb } from '@ngneat/falso';
import { runAutomation } from '../src/automation';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('running an automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'sun',
        position: 'evening',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'OFF' == ${subTopic}.state_bottom AND "ON" == ${subTopic}.state_top`,
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

    const ifExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'OFF' == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression2 });
    expect(ifExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes2.upsertExpression.id,
        isElseStep: false
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const deviceExpression2: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'OFF',
        conditionalExpressionId: 0,
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
            expect.objectContaining({ id: publishExpressionRes.upsertExpression.id, kind: 'publish', message: publishExpression.message, is_else_step: 0, conditional_expression_id: ifExpressionRes2.upsertExpression.id }),
        ])
    );
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes2.upsertExpression.id, kind: 'device', state: deviceExpression2.state, is_else_step: 0, conditional_expression_id: 0 }),
        ])
    );
});


test('running an automation with else steps', async ({ executeOperation }) => {
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

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `"ON" == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression });
    expect(ifExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const device = createDeviceFactory({ topicId });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);

    const deviceExpression1: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'OFF',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
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
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: true
    };
    const deviceExpressionRes2 = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression2 });
    expect(deviceExpressionRes2.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes2.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const runRes = await runAutomation(automationRes.upsertAutomation.id);
    expect(runRes).toBeTypeOf('object');
    expect(runRes.length).toEqual(2);
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: publishExpressionRes.upsertExpression.id, kind: 'publish', message: publishExpression.message, is_else_step: 0, conditional_expression_id: 0 }),
        ])
    );
    expect(runRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes2.upsertExpression.id, kind: 'device', state: deviceExpression2.state, is_else_step: 1, conditional_expression_id: ifExpressionRes.upsertExpression.id }),
        ])
    );
});