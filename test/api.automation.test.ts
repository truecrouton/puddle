'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import dotenv from 'dotenv';
import { storageInit, storeMessage } from "../src/storage";
import { runAutomation } from "../src/automation";
import { randAccessory, randVerb, randWord } from '@ngneat/falso';
import { format } from 'date-fns';

const lab = Lab.script();
const { afterEach, beforeEach, before, experiment, test } = lab;
export { lab };

experiment('setup and run automations', () => {
    let server: Server;

    before((async () => {
        dotenv.config({ path: './puddle.env' });
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    test('setup and update a new automation', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        const automationReq = {
            automation_id: 0,
            name: `${randVerb()} ${randAccessory()}`,
            trigger: 'time',
            trigger_at: '03:00',

        };
        const automationRes = await server.inject({
            method: 'post',
            url: `/api/automation/setup`,
            payload: automationReq,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(automationRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = automationRes;
        expect(automation).to.be.object();

        const automationId = Number(automation.automation_id);
        expect(automationId).to.be.greaterThan(0);

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'OFF',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message: '{"state":"ON"}'
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
        expect(result).to.be.object();
        expect(Number(result.automation_id)).to.be.greaterThan(0);
        expect(result.automation_id).to.equal(automationId);

        const updateRes = await server.inject({
            method: 'post',
            url: `/api/automation/setup`,
            payload: { ...automationReq, automation_id: automationId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(updateRes.statusCode).to.equal(200);
    });

    test('getting all automations', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/api/automations/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(result.automations).to.be.array();
        expect(Array(result.automations).length).to.be.greaterThan(0);
    });

    test('setup a new topic automation', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationReq = {
            automation_id: 0,
            name: `${randVerb()} ${randAccessory()}`,
            trigger: 'topic',
            topic_id: topicId,
            trigger_key: randWord().toLowerCase(),
            trigger_value: randWord().toLowerCase()
        };
        const automationRes = await server.inject({
            method: 'post',
            url: `/api/automation/setup`,
            payload: automationReq,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(automationRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = automationRes;
        expect(automation).to.be.object();

        const automationId = Number(automation.automation_id);
        expect(automationId).to.be.greaterThan(0);
    });

    test('setup and run a new user automation', async () => {
        const automationReq = {
            automation_id: 0,
            name: `${randVerb()} ${randAccessory()}`,
            trigger: 'user',
            is_control_shown: false
        };
        const automationRes = await server.inject({
            method: 'post',
            url: `/api/automation/setup`,
            payload: automationReq,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(automationRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = automationRes;
        expect(automation).to.be.object();

        const automationId = Number(automation.automation_id);
        expect(automationId).to.be.greaterThan(0);

        const now = new Date();
        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: format(now, 'HH:mm'),
                    right_operand_kind: 'preset',
                    right_preset: 'time'
                }],
                steps: [{
                    kind: 'notify'
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

        const { result: runResult }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/run`,
            payload: { automation_id: automationId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(runResult).to.be.array();
        expect(runResult.length).to.equal(1);

        const executableStep = runResult[0];
        expect(executableStep.kind).to.equal('notify');
        expect(Number(executableStep.conditional_step_id)).to.be.greaterThan(0);
    });

    test('running an automation', async () => {
        const topic = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const message = '{"state":"ON"}';
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationReq = {
            automation_id: 0,
            name: `${randVerb()} ${randAccessory()}`,
            trigger: 'sun',
            position: 'evening',

        };
        const automationRes = await server.inject({
            method: 'post',
            url: `/api/automation/setup`,
            payload: automationReq,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(automationRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = automationRes;
        expect(automation).to.be.object();

        const automationId = Number(automation.automation_id);
        expect(automationId).to.be.greaterThan(0);

        const steps = {
            automation_id: automationId,
            steps: [{
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'OFF',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                },
                {
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'ON',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_top'
                }],
                steps: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message
                }]
            },
            {
                kind: 'if',
                conditions: [{
                    kind: 'eq',
                    left_operand_kind: 'value',
                    left_value: 'OFF',
                    right_operand_kind: 'topic',
                    right_topic_id: topicId,
                    right_topic_key: 'state_bottom'
                }],
                steps: [{
                    kind: 'notify'
                }]
            },
            {
                kind: 'wait'
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

        const runRes = runAutomation(automationId);
        expect(runRes).to.be.array();
        expect(runRes.length).to.equal(2);

        const executableStep1 = runRes[0];
        expect(executableStep1.kind).to.equal('notify');
        expect(executableStep1.conditional_step_id).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('wait');
        expect(executableStep2.conditional_step_id).to.equal(0);
    });

    test('running an automation with else steps', async () => {
        const topic = `zigbee2mqtt/${randAccessory().toLowerCase().replace(' ', '_')}`;
        const message = '{"state":"ON"}';
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationReq = {
            automation_id: 0,
            name: `${randVerb()} ${randAccessory()}`,
            trigger: 'time',
            trigger_at: '12:00'

        };
        const automationRes = await server.inject({
            method: 'post',
            url: `/api/automation/setup`,
            payload: automationReq,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(automationRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = automationRes;
        expect(automation).to.be.object();

        const automationId = Number(automation.automation_id);
        expect(automationId).to.be.greaterThan(0);

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
                kind: 'wait'
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

        const runRes = runAutomation(automationId);
        expect(runRes).to.be.array();
        expect(runRes.length).to.equal(2);

        const executableStep1 = runRes[0];
        expect(executableStep1.topic_id).to.equal(topicId);
        expect(executableStep1.message).to.equal(message);
        expect(executableStep1.kind).to.equal('publish');
        expect(executableStep1.conditional_step_id).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('wait');
        expect(executableStep2.conditional_step_id).to.equal(0);
    });
});