'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage, AutomationSteps } from "../src/storage";
import { triggerTopicAutomations, triggerSunAutomations, triggerTimeAutomations } from "../src/automation";
import { randNumber, randSoonDate, randVerb, randWord } from '@ngneat/falso';
import { automationCreate, factoryInit } from './helpers/factory';
import { format } from 'date-fns';

const lab = Lab.script();
const { afterEach, beforeEach, before, experiment, test } = lab;
export { lab };

experiment('setup and run automations', () => {
    let server: Server;

    before((async () => {
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
        factoryInit(server);
    });

    afterEach(async () => {
        await server.stop();
    });

    test('trigger a topic automation', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
        const message = '{"state":"ON"}';
        const triggerKey = randWord().toLowerCase();
        const triggerValue = randVerb().toLowerCase();

        const automationId = await automationCreate({
            trigger: 'topic',
            topic_id: topicId,
            trigger_key: triggerKey,
            trigger_value: triggerValue
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'ON',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message,
                },
                {
                    kind: 'notify',
                    is_else_step: true
                }]
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const triggerRes = triggerTopicAutomations(topic, `{ "${triggerKey}":"${triggerValue}" }`);
        expect(triggerRes).to.be.array();
        expect(triggerRes.length).to.equal(1);

        const runRes = triggerRes[0];
        expect(runRes.automation_id).to.equal(automationId);
        expect(runRes.result).to.be.array();
        expect(runRes.result.length).to.equal(1);

        const step = runRes.result[0];
        expect(step.kind).to.equal('publish');
        expect(step.topic_id).to.equal(topicId);
        expect(step.message).to.equal(message);
    });

    test('trigger a topic automation with a number value', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}_${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
        const message = '{"state":"ON"}';
        const triggerKey = randWord().toLowerCase();
        const triggerValue = String(randNumber({ min: 1, max: 100, precision: 1 }));
        const triggerMessage = JSON.stringify({ [triggerKey]: triggerValue });

        const automationId = await automationCreate({
            trigger: 'topic',
            topic_id: topicId,
            trigger_key: triggerKey,
            trigger_value: triggerValue
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'ON',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message,
                },
                {
                    kind: 'notify',
                    is_else_step: true
                }]
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const triggerRes = triggerTopicAutomations(topic, triggerMessage);
        expect(triggerRes).to.be.array();
        expect(triggerRes.length).to.equal(1);

        const runRes = triggerRes[0];
        expect(runRes.automation_id).to.equal(automationId);
        expect(runRes.result).to.be.array();
        expect(runRes.result.length).to.equal(1);

        const step = runRes.result[0];
        expect(step.kind).to.equal('publish');
        expect(step.topic_id).to.equal(topicId);
        expect(step.message).to.equal(message);
    });

    test('trigger a topic automation without a trigger key', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
        const message = '{"state":"ON"}';
        const ignoredMessage = JSON.stringify({ [randWord().toLowerCase()]: randWord().toLowerCase() });

        const automationId = await automationCreate({
            trigger: 'topic',
            topic_id: topicId
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'ON',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message,
                },
                {
                    kind: 'notify',
                    is_else_step: true
                }]
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const triggerRes = triggerTopicAutomations(topic, ignoredMessage);
        expect(triggerRes).to.be.array();
        expect(triggerRes.length).to.equal(1);

        const runRes = triggerRes[0];
        expect(runRes.automation_id).to.equal(automationId);
        expect(runRes.result).to.be.array();
        expect(runRes.result.length).to.equal(1);

        const step = runRes.result[0];
        expect(step.kind).to.equal('publish');
        expect(step.topic_id).to.equal(topicId);
        expect(step.message).to.equal(message);
    });

    test('trigger a sun automation', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
        const message = '{"state":"ON"}';
        const position = "goldenHour";

        const automationId = await automationCreate({
            trigger: 'sun',
            position
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'ON',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message,
                },
                {
                    kind: 'notify',
                    is_else_step: true
                }]
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const triggerRes = triggerSunAutomations(position);
        expect(triggerRes).to.be.array();
        expect(triggerRes.length).to.be.greaterThan(0);

        const runRes = <AutomationSteps>triggerRes.find((r) => r.automation_id === automationId);
        expect(runRes).to.be.object();
        expect(runRes.automation_id).to.equal(automationId);
        expect(runRes.result).to.be.array();
        expect(runRes.result.length).to.equal(1);

        const step = runRes.result[0];
        expect(step.kind).to.equal('publish');
        expect(step.topic_id).to.equal(topicId);
        expect(step.message).to.equal(message);
    });

    test('trigger a time automation', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"ON","state_top":"OFF"}');
        const message = '{"state":"ON"}';
        const time = format(randSoonDate(), "hh:mm");

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: time
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'ON',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message,
                },
                {
                    kind: 'notify',
                    is_else_step: true
                }]
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const triggerRes = triggerTimeAutomations(time);
        expect(triggerRes).to.be.array();
        expect(triggerRes.length).to.be.greaterThan(0);

        const runRes = <AutomationSteps>triggerRes.find((r) => r.automation_id === automationId);
        expect(runRes.automation_id).to.equal(automationId);
        expect(runRes.result).to.be.array();
        expect(runRes.result.length).to.equal(1);

        const step = runRes.result[0];
        expect(step.kind).to.equal('publish');
        expect(step.topic_id).to.equal(topicId);
        expect(step.message).to.equal(message);
    });
});