import { DELETE_AUTOMATION, DELETE_EXPRESSION, GET_AUTOMATION, GET_AUTOMATIONS, UPSERT_AUTOMATION, UPSERT_DEVICE, UPSERT_EXPRESSION } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createDeviceFactory, createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { UpsertExpressionInput } from 'puddle-graphql';
import { randAccessory, randVerb } from '@ngneat/falso';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('setup and get a new automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '03:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.triggerAt).toEqual(newAutomation.triggerAt);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `"OFF" == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression });
    expect(ifExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(ifExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(ifExpressionRes.upsertExpression.expression).toEqual(ifExpression.expression);

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
    expect(deviceExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(deviceExpressionRes.upsertExpression.deviceId).toEqual(deviceExpression.deviceId);

    const getAutomationRes = await executeOperation(GET_AUTOMATION, { id: automationRes.upsertAutomation.id });
    expect(getAutomationRes.automation.id).toBeTypeOf('number');
    expect(getAutomationRes.automation.id).toEqual(automationRes.upsertAutomation.id);
    expect(getAutomationRes.automation.name).toEqual(newAutomation.name);
    expect(getAutomationRes.automation.trigger).toEqual(newAutomation.trigger);
    expect(getAutomationRes.automation.triggerAt).toEqual(newAutomation.triggerAt);
    expect(getAutomationRes.automation.expressions).toBeTypeOf('object');
    expect(getAutomationRes.automation.expressions.length).toEqual(2);
    expect(getAutomationRes.automation.expressions).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: ifExpressionRes.upsertExpression.id, kind: 'if', expression: ifExpression.expression, isElseStep: false, conditionalExpressionId: 0 }),
        ])
    );
    expect(getAutomationRes.automation.expressions).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', deviceId: deviceExpression.deviceId, state: 'ON', conditionalExpressionId: ifExpressionRes.upsertExpression.id, isElseStep: false }),
        ])
    );
});

test('setup an automation with else steps', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '03:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.triggerAt).toEqual(newAutomation.triggerAt);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `"OFF" == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression });
    expect(ifExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(ifExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(ifExpressionRes.upsertExpression.expression).toEqual(ifExpression.expression);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(publishExpressionRes.upsertExpression.topicId).toEqual(topicId);

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
        isElseStep: true
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(deviceExpressionRes.upsertExpression.deviceId).toEqual(deviceExpression.deviceId);

    const getAutomationRes = await executeOperation(GET_AUTOMATION, { id: automationRes.upsertAutomation.id });
    expect(getAutomationRes.automation.id).toBeTypeOf('number');
    expect(getAutomationRes.automation.id).toEqual(automationRes.upsertAutomation.id);
    expect(getAutomationRes.automation.name).toEqual(newAutomation.name);
    expect(getAutomationRes.automation.trigger).toEqual(newAutomation.trigger);
    expect(getAutomationRes.automation.triggerAt).toEqual(newAutomation.triggerAt);
    expect(getAutomationRes.automation.expressions).toBeTypeOf('object');
    expect(getAutomationRes.automation.expressions.length).toEqual(3);
    expect(getAutomationRes.automation.expressions).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: ifExpressionRes.upsertExpression.id, kind: 'if', expression: ifExpression.expression, isElseStep: false, conditionalExpressionId: 0 }),
        ])
    );
    expect(getAutomationRes.automation.expressions).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: publishExpressionRes.upsertExpression.id, kind: 'publish', topicId, message: publishExpression.message, conditionalExpressionId: ifExpressionRes.upsertExpression.id, isElseStep: false }),
        ])
    );
    expect(getAutomationRes.automation.expressions).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceExpressionRes.upsertExpression.id, kind: 'device', deviceId: deviceExpression.deviceId, state: 'ON', conditionalExpressionId: ifExpressionRes.upsertExpression.id, isElseStep: true }),
        ])
    );
});

test('get all automations', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '03:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.triggerAt).toEqual(newAutomation.triggerAt);

    const getAutomationsRes = await executeOperation(GET_AUTOMATIONS);
    expect(getAutomationsRes.automations).toBeTypeOf('object');
    expect(getAutomationsRes.automations.length).toBeGreaterThan(0);
    expect(getAutomationsRes.automations).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: automationRes.upsertAutomation.id, name: newAutomation.name, trigger: newAutomation.trigger }),
        ])
    );
});

test('update an automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'user',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.isControlShown).toEqual(newAutomation.isControlShown);

    const updatedAutomation = { ...newAutomation, id: automationRes.upsertAutomation.id, name: `${randVerb()} ${randAccessory()}`, isControlShown: true };
    const updateAutomationRes = await executeOperation(UPSERT_AUTOMATION, { input: updatedAutomation });
    expect(updateAutomationRes.upsertAutomation).toBeTypeOf('object');
    expect(updateAutomationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(updateAutomationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(updateAutomationRes.upsertAutomation.name).toEqual(updatedAutomation.name);
    expect(updateAutomationRes.upsertAutomation.trigger).toEqual(updatedAutomation.trigger);
    expect(updateAutomationRes.upsertAutomation.isControlShown).toEqual(updatedAutomation.isControlShown);

    const getAutomationRes = await executeOperation(GET_AUTOMATION, { id: automationRes.upsertAutomation.id });
    expect(getAutomationRes.automation.id).toBeTypeOf('number');
    expect(getAutomationRes.automation.id).toEqual(updateAutomationRes.upsertAutomation.id);
    expect(getAutomationRes.automation.name).toEqual(updatedAutomation.name);
    expect(getAutomationRes.automation.trigger).toEqual(updatedAutomation.trigger);
    expect(getAutomationRes.automation.expressions).toBeTypeOf('object');
    expect(getAutomationRes.automation.expressions.length).toEqual(0);
});

test('setup and delete an automation', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '03:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.triggerAt).toEqual(newAutomation.triggerAt);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `"OFF" == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression });
    expect(ifExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(ifExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(ifExpressionRes.upsertExpression.expression).toEqual(ifExpression.expression);

    const publishExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const publishExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: publishExpression });
    expect(publishExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(publishExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(publishExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(publishExpressionRes.upsertExpression.topicId).toEqual(topicId);

    const deleteAutomationRes = await executeOperation(DELETE_AUTOMATION, { input: { id: automationRes.upsertAutomation.id } });
    expect(deleteAutomationRes.deleteAutomation).toEqual(true);

    const getAutomationRes = await executeOperation(GET_AUTOMATION, { id: automationRes.upsertAutomation.id });
    expect(getAutomationRes.automation).toBeFalsy();
});

test('delete expressions', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '03:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.triggerAt).toEqual(newAutomation.triggerAt);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `"OFF" == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression });
    expect(ifExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(ifExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(ifExpressionRes.upsertExpression.expression).toEqual(ifExpression.expression);

    const device = createDeviceFactory({ topicId });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);

    const deviceExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'publish',
        topicId,
        message: '{"state_top":"ON"}',
        conditionalExpressionId: ifExpressionRes.upsertExpression.id,
        isElseStep: false
    };
    const deviceExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: deviceExpression });
    expect(deviceExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(deviceExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(deviceExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(deviceExpressionRes.upsertExpression.topicId).toEqual(topicId);

    const deleteExpressionRes = await executeOperation(DELETE_EXPRESSION, { input: { id: ifExpressionRes.upsertExpression.id } });
    expect(deleteExpressionRes.deleteExpression).toEqual(true);

    const getAutomationRes = await executeOperation(GET_AUTOMATION, { id: automationRes.upsertAutomation.id });
    expect(getAutomationRes.automation.id).toBeTypeOf('number');
    expect(getAutomationRes.automation.id).toEqual(automationRes.upsertAutomation.id);
    expect(getAutomationRes.automation.name).toEqual(newAutomation.name);
    expect(getAutomationRes.automation.trigger).toEqual(newAutomation.trigger);
    expect(getAutomationRes.automation.triggerAt).toEqual(newAutomation.triggerAt);
    expect(getAutomationRes.automation.expressions).toBeTypeOf('object');
    expect(getAutomationRes.automation.expressions.length).toEqual(0);
});

test('update expression', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const subTopic = topic.topic.split('/')[1];
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');
    expect(topicId).toBeGreaterThan(0);

    const newAutomation = {
        id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        trigger: 'time',
        triggerAt: '03:00',
        isControlShown: false
    };
    const automationRes = await executeOperation(UPSERT_AUTOMATION, { input: newAutomation });
    expect(automationRes.upsertAutomation).toBeTypeOf('object');
    expect(automationRes.upsertAutomation.id).toBeTypeOf('number');
    expect(automationRes.upsertAutomation.id).toBeGreaterThan(0);
    expect(automationRes.upsertAutomation.name).toEqual(newAutomation.name);
    expect(automationRes.upsertAutomation.trigger).toEqual(newAutomation.trigger);
    expect(automationRes.upsertAutomation.triggerAt).toEqual(newAutomation.triggerAt);

    const ifExpression: UpsertExpressionInput = {
        id: 0,
        automationId: automationRes.upsertAutomation.id,
        kind: 'if',
        expression: `"OFF" == ${subTopic}.state_bottom`,
        conditionalExpressionId: 0,
        isElseStep: false
    };
    const ifExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: ifExpression });
    expect(ifExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(ifExpressionRes.upsertExpression.id).toBeTypeOf('number');
    expect(ifExpressionRes.upsertExpression.id).toBeGreaterThan(0);
    expect(ifExpressionRes.upsertExpression.expression).toEqual(ifExpression.expression);

    const device = createDeviceFactory({ topicId });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);

    const updatedExpression: UpsertExpressionInput = { ...ifExpression, id: ifExpressionRes.upsertExpression.id, expression: '4 == 5' };
    const updateExpressionRes = await executeOperation(UPSERT_EXPRESSION, { input: updatedExpression });
    expect(updateExpressionRes.upsertExpression).toBeTypeOf('object');
    expect(updateExpressionRes.upsertExpression.id).toEqual(ifExpressionRes.upsertExpression.id);
    expect(updateExpressionRes.upsertExpression.expression).toEqual(updatedExpression.expression);

    const getAutomationRes = await executeOperation(GET_AUTOMATION, { id: automationRes.upsertAutomation.id });
    expect(getAutomationRes.automation.id).toBeTypeOf('number');
    expect(getAutomationRes.automation.id).toEqual(automationRes.upsertAutomation.id);
    expect(getAutomationRes.automation.name).toEqual(newAutomation.name);
    expect(getAutomationRes.automation.trigger).toEqual(newAutomation.trigger);
    expect(getAutomationRes.automation.triggerAt).toEqual(newAutomation.triggerAt);
    expect(getAutomationRes.automation.expressions).toBeTypeOf('object');
    expect(getAutomationRes.automation.expressions.length).toEqual(1);
    expect(getAutomationRes.automation.expressions).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: ifExpressionRes.upsertExpression.id, kind: 'if', expression: updatedExpression.expression, isElseStep: false, conditionalExpressionId: 0 }),
        ])
    );
});