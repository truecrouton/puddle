'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { runAutomation } from "../src/automation";
import { randAccessory, randVerb } from '@ngneat/falso';
import { automationCreate, factoryInit } from './helpers/factory';
import { format, subSeconds } from 'date-fns';

const lab = Lab.script();
const { afterEach, beforeEach, before, experiment, test } = lab;
export { lab };

experiment('run automations with preset conditions', () => {
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

    test('generate accurate preset values', async () => {
        const topic = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const message = '{"state":"ON"}';
        const today = new Date();
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '12:00'
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'preset',
                    left_preset: 'date',
                    right_operand_kind: 'value',
                    right_value: format(today, 'yyyy-MM-dd')
                }],
                steps: [{
                    kind: 'notify'
                },
                {
                    kind: 'publish',
                    topic_id: topicId,
                    message,
                    is_else_step: true
                }]
            },
            {
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'preset',
                    left_preset: 'month',
                    right_operand_kind: 'value',
                    right_value: format(today, 'L')
                }],
                steps: [{
                    kind: 'notify'
                }]
            }]
        };
        const res = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const runRes = runAutomation(automationId);
        expect(runRes).to.be.array();
        expect(runRes.length).to.equal(2);

        const executableStep1 = runRes[0];
        expect(executableStep1.kind).to.equal('notify');
        expect(executableStep1.conditional_step_id).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('notify');
        expect(executableStep2.conditional_step_id).to.be.greaterThan(0);
    });

    test('detect increasing and decreasing values', async () => {
        const topicDec = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const topicInc = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const message = '{"state":"ON"}';

        const now = new Date();
        const start = subSeconds(now, 1);

        const decTopicId = storeMessage(topicDec, JSON.stringify({ linkquality: 100, illuminance: 66 }), start);
        const incTopicId = storeMessage(topicInc, JSON.stringify({ linkquality: 100, illuminance: 66 }), start);
        storeMessage(topicDec, JSON.stringify({ linkquality: 100, illuminance: 33 }), now);
        storeMessage(topicInc, JSON.stringify({ linkquality: 100, illuminance: 88 }), now);

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '12:00'
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'inc',
                    left_operand_kind: 'topic',
                    left_topic_id: incTopicId,
                    left_topic_key: 'illuminance',
                    right_operand_kind: 'value',
                    right_value: 77
                },
                {
                    kind: 'dec',
                    left_operand_kind: 'topic',
                    left_topic_id: decTopicId,
                    left_topic_key: 'illuminance',
                    right_operand_kind: 'value',
                    right_value: 55
                }],
                steps: [{
                    kind: 'notify'
                },
                {
                    kind: 'publish',
                    topic_id: incTopicId,
                    message,
                    is_else_step: true
                }]
            },
            {
                kind: 'if',
                conditions: [{
                    kind: 'dec',
                    left_operand_kind: 'topic',
                    left_topic_id: incTopicId,
                    left_topic_key: 'illuminance',
                    right_operand_kind: 'value',
                    right_value: 22
                }],
                steps: [{
                    kind: 'notify'
                },
                {
                    kind: 'publish',
                    topic_id: incTopicId,
                    message,
                    is_else_step: true
                }]
            }]
        };
        const res = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const runRes = runAutomation(automationId);
        expect(runRes).to.be.array();
        expect(runRes.length).to.equal(2);

        const executableStep1 = runRes[0];
        expect(executableStep1.kind).to.equal('notify');
        expect(executableStep1.conditional_step_id).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('publish');
        expect(executableStep2.conditional_step_id).to.be.greaterThan(0);
    });

    test('detect last values', async () => {
        const topic1 = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const topic2 = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const message = '{"state":"ON"}';

        const now = new Date();
        const start = subSeconds(now, 60);

        const topicId1 = storeMessage(topic1, JSON.stringify({ linkquality: 100, occupancy: 0 }), start);
        const topicId2 = storeMessage(topic2, JSON.stringify({ linkquality: 100, occupancy: 1 }), start);
        storeMessage(topic1, JSON.stringify({ linkquality: 100, occupancy: 1 }), now);
        storeMessage(topic2, JSON.stringify({ linkquality: 100, occupancy: 0 }), now);

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '12:00'
        });

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'lgt',
                    left_operand_kind: 'topic',
                    left_topic_id: topicId2,
                    left_topic_key: 'occupancy',
                    right_operand_kind: 'value',
                    right_value: '0 , >30'
                },
                {
                    kind: 'leq',
                    left_operand_kind: 'topic',
                    left_topic_id: topicId2,
                    left_topic_key: 'occupancy',
                    right_operand_kind: 'value',
                    right_value: '0,<1'
                }],
                steps: [{
                    kind: 'notify'
                },
                {
                    kind: 'publish',
                    topic_id: topicId2,
                    message,
                    is_else_step: true
                }]
            },
            {
                kind: 'if',
                conditions: [{
                    kind: 'llt',
                    left_operand_kind: 'topic',
                    left_topic_id: topicId1,
                    left_topic_key: 'occupancy',
                    right_operand_kind: 'value',
                    right_value: '1,>30'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId1,
                    message

                }, {
                    kind: 'notify',
                    is_else_step: true
                }]
            }]
        };
        const res = await server.inject({
            method: 'post',
            url: `/api/automation/steps/setup`,
            payload: steps,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const runRes = runAutomation(automationId);
        expect(runRes).to.be.array();
        expect(runRes.length).to.equal(2);

        const executableStep1 = runRes[0];
        expect(executableStep1.kind).to.equal('notify');
        expect(executableStep1.conditional_step_id).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('publish');
        expect(executableStep2.conditional_step_id).to.be.greaterThan(0);
    });
});