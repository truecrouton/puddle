import { UPSERT_AUTOMATION, UPSERT_DEVICE, UPSERT_EXPRESSION } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createDeviceFactory, createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { UpsertExpressionInput } from 'puddle-graphql';
import { randAccessory, randSoonDate, randVerb, randWord } from '@ngneat/falso';
import { triggerSunAutomations, triggerTimeAutomations, triggerTopicAutomations } from '../src/automation';
import { format } from 'date-fns';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('trigger a topic automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const triggerKey = randWord().toLowerCase();
    const triggerValue = randVerb().toLowerCase();
    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'topic',
        topicId,
        triggerKey,
        triggerValue,
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'ON' == ${subTopic}.state_bottom`,
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

    const deviceExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const triggerRes = await triggerTopicAutomations(topic.topic, `{ "${triggerKey}":"${triggerValue}" }`);
    expect(triggerRes).toBeTypeOf('object');
    expect(triggerRes.length).toEqual(1);

    const runRes = triggerRes[0];
    expect(runRes.automation_id).toBeTypeOf('number');
    expect(runRes.automation_id).toBeGreaterThan(0);
    expect(runRes.result).toBeTypeOf('object');
    expect(runRes.result.length).toEqual(1);
    expect(runRes.result).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', state: deviceExpression.state, is_else_step: 0, conditional_expression_id: ifExpressionRes.upsertExpression.id }),
        ])
    );
});

test('trigger a topic automation with a number value', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const triggerKey = randWord().toLowerCase();
    const triggerValue = randVerb().toLowerCase();
    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'topic',
        topicId,
        triggerKey,
        triggerValue,
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'ON' == ${subTopic}.state_bottom`,
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

    const deviceExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const triggerRes = await triggerTopicAutomations(topic.topic, `{ "${triggerKey}":"${triggerValue}" }`);
    expect(triggerRes).toBeTypeOf('object');
    expect(triggerRes.length).toEqual(1);

    const runRes = triggerRes[0];
    expect(runRes.automation_id).toBeTypeOf('number');
    expect(runRes.automation_id).toBeGreaterThan(0);
    expect(runRes.result).toBeTypeOf('object');
    expect(runRes.result.length).toEqual(1);
    expect(runRes.result).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', state: deviceExpression.state, is_else_step: 0, conditional_expression_id: ifExpressionRes.upsertExpression.id }),
        ])
    );
});

test('trigger a topic automation without a trigger key', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const ignoredMessage = JSON.stringify({ [randWord().toLowerCase()]: randWord().toLowerCase() });

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'topic',
        topicId,
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'ON' == ${subTopic}.state_bottom`,
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

    const deviceExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const triggerRes = await triggerTopicAutomations(topic.topic, ignoredMessage);
    expect(triggerRes).toBeTypeOf('object');
    expect(triggerRes.length).toEqual(1);

    const runRes = triggerRes[0];
    expect(runRes.automation_id).toBeTypeOf('number');
    expect(runRes.automation_id).toBeGreaterThan(0);
    expect(runRes.result).toBeTypeOf('object');
    expect(runRes.result.length).toEqual(1);
    expect(runRes.result).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', state: deviceExpression.state, is_else_step: 0, conditional_expression_id: ifExpressionRes.upsertExpression.id }),
        ])
    );
});

test('trigger a sun automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const position = "goldenHour";
    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'sun',
        position,
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'ON' == ${subTopic}.state_bottom`,
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

    const deviceExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const triggerRes = await triggerSunAutomations(position);
    expect(triggerRes).toBeTypeOf('object');
    expect(triggerRes.length).toBeGreaterThan(0);
    expect(triggerRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ automation_id: automationRes.upsertAutomation.id }),
        ])
    );

    const runRes = triggerRes.find((r) => r.automation_id === automationRes.upsertAutomation.id)!;
    expect(runRes.automation_id).toBeTypeOf('number');
    expect(runRes.automation_id).toBeGreaterThan(0);
    expect(runRes.result).toBeTypeOf('object');
    expect(runRes.result.length).toEqual(1);
    expect(runRes.result).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', state: deviceExpression.state, is_else_step: 0, conditional_expression_id: ifExpressionRes.upsertExpression.id }),
        ])
    );
});

test('trigger a time automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
    expect(topicId).toBeGreaterThan(0);

    const time = format(randSoonDate(), "hh:mm");
    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: time,
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `'ON' == ${subTopic}.state_bottom`,
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

    const deviceExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'device',
        deviceId: deviceRes.upsertDevice.id,
        state: 'ON',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: true
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);

    const triggerRes = await triggerTimeAutomations(time);
    expect(triggerRes).toBeTypeOf('object');
    expect(triggerRes.length).toBeGreaterThan(0);
    expect(triggerRes).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ automation_id: automationRes.upsertAutomation.id }),
        ])
    );

    const runRes = triggerRes.find((r) => r.automation_id === automationRes.upsertAutomation.id)!;
    expect(runRes.automation_id).toBeTypeOf('number');
    expect(runRes.automation_id).toBeGreaterThan(0);
    expect(runRes.result).toBeTypeOf('object');
    expect(runRes.result.length).toEqual(1);
    expect(runRes.result).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', state: deviceExpression.state, is_else_step: 0, conditional_expression_id: ifExpressionRes.upsertExpression.id }),
        ])
    );
});