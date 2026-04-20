'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { runAutomation } from "../src/automation";
import { randAccessory, randVerb, randWord } from '@ngneat/falso';
import { format } from 'date-fns';
import { automationCreate, topicGenerate, factoryInit } from './helpers/factory';
import { AutomationExpressionSetupPayloadInterface, AutomationSetupPayloadInterface } from '../src/routes/interfaces';

const lab = Lab.script();
const { afterEach, beforeEach, before, experiment, test } = lab;
export { lab };

experiment('setup and run automations', () => {
    let server: Server;

    before((async () => {
        process.env.BASE_TOPIC = 'zigbee2mqtt';
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
        factoryInit(server);
    });

    afterEach(async () => {
        await server.stop();
    });

    test('setup and update a new automation', async () => {
        const topic = topicGenerate('');
        const topicId = storeMessage(`zigbee2mqtt/${topic}`, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        const automationReq: AutomationSetupPayloadInterface = {
            id: 0,
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

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `"OFF" == ${topic}.state_bottom`,
                nested_expressions: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message: '{"state":"ON"}'
                }]
            }]
        };
        const res = await server.inject({
            method: 'post',
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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
            payload: { ...automationReq, id: automationId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(updateRes.statusCode).to.equal(200);
    });

    test('setup and get an automation', async () => {
        const topic = topicGenerate();
        const topicId = storeMessage(topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        const automationReq: AutomationSetupPayloadInterface = {
            id: 0,
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

        const { result: baseAutomation }: { result: any; } = automationRes;
        expect(baseAutomation).to.be.object();

        const automationId = Number(baseAutomation.automation_id);
        expect(automationId).to.be.greaterThan(0);

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: 'MONTH == 4 AND bedroom_shade_1.position == 75 AND bedroom_shade_2.position _>[>60] 50',
                conditional_expression_id: 0,
                nested_expressions: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message: '{"state":"ON"}',
                    is_else_step: false
                }]
            }]
        };
        const res = await server.inject({
            method: 'post',
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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

        const getRes = await server.inject({
            method: 'post',
            url: `/api/automation/get`,
            payload: { automation_id: automationId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = getRes;
        expect(automation).to.be.object();
        expect(automation.id).to.equal(automationId);
        expect(automation.trigger).to.equal('time');
        expect(automation.trigger_at).to.equal('03:00');
        expect(automation.sequence).to.be.array();
        expect(automation.sequence.length).to.equal(1);

        const expression = automation.sequence[0];
        expect(expression.id as number).to.be.greaterThan(0);
        expect(expression.kind).to.equal('if');
        expect(expression.nested_expressions).to.be.array();
        expect(expression.nested_expressions.length).to.equal(1);

        const conditionalExpr = expression.nested_expressions[0];
        expect(conditionalExpr.id as number).to.be.greaterThan(0);
        expect(conditionalExpr.kind).to.equal('publish');
        expect(conditionalExpr.topic).to.equal(topic);
        expect(conditionalExpr.is_else_step).to.equal(false);
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
        const topic = topicGenerate();
        const topicId = storeMessage(topic, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationReq: AutomationSetupPayloadInterface = {
            id: 0,
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
        const automationReq: AutomationSetupPayloadInterface = {
            id: 0,
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
        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `'${format(now, 'HH:mm')}' == time`,
                conditional_expression_id: 0,
                nested_expressions: [{
                    kind: 'notify'
                }]
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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
        expect(Number(executableStep.conditional_expression_id)).to.be.greaterThan(0);
    });

    test('running an automation', async () => {
        const topic = topicGenerate('');
        const message = '{"state":"ON"}';
        const topicId = storeMessage(`zigbee2mqtt/${topic}`, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationReq: AutomationSetupPayloadInterface = {
            id: 0,
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

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `'OFF' == ${topic}.state_bottom AND "ON" == ${topic}.state_top`,
                nested_expressions: [{
                    kind: 'publish',
                    topic_id: topicId,
                    message
                }]
            },
            {
                kind: 'if',
                expression: `'OFF' == ${topic}.state_bottom`,
                nested_expressions: [{
                    kind: 'notify'
                }]
            },
            {
                kind: 'wait'
            }]
        };
        const { result }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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
        expect(Number(executableStep1.conditional_expression_id)).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('wait');
        expect(executableStep2.conditional_expression_id).to.equal(0);
    });

    test('getting an automation with else steps', async () => {
        const topic = topicGenerate('');
        const message = '{"state_bottom":"OFF"}';
        const topicId = storeMessage(`zigbee2mqtt/${topic}`, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '11:00'
        });
        expect(automationId).to.be.greaterThan(0);

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `"ON" == ${topic}.state_bottom`,
                nested_expressions: [{
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
            url: `/api/automation/expressions/setup`,
            payload: expressions,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const getRes = await server.inject({
            method: 'post',
            url: `/api/automation/get`,
            payload: { automation_id: automationId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: automation }: { result: any; } = getRes;
        expect(automation).to.be.object();
        expect(automation.id).to.equal(automationId);
        expect(automation.trigger).to.equal('time');
        expect(automation.trigger_at).to.equal('11:00');
        expect(automation.sequence).to.be.array();
        expect(automation.sequence.length).to.equal(2);

        const expression1 = automation.sequence[0];
        expect(expression1.id as number).to.be.greaterThan(0);
        expect(expression1.kind).to.equal('if');
        expect(expression1.nested_expressions).to.be.array();
        expect(expression1.nested_expressions.length).to.equal(2);

        const conditionalExpr1 = expression1.nested_expressions[0];
        expect(conditionalExpr1.id as number).to.be.greaterThan(0);
        expect(conditionalExpr1.kind).to.equal('notify');
        expect(conditionalExpr1.is_else_step).to.equal(false);

        const conditionalExpr2 = expression1.nested_expressions[1];
        expect(conditionalExpr2.id as number).to.be.greaterThan(0);
        expect(conditionalExpr2.kind).to.equal('publish');
        expect(conditionalExpr2.topic).to.equal(`zigbee2mqtt/${topic}`);
        expect(conditionalExpr2.is_else_step).to.equal(true);

        const expression2 = automation.sequence[1];
        expect(expression2.id as number).to.be.greaterThan(0);
        expect(expression2.kind).to.equal('wait');
        expect(expression2.nested_expressions).to.be.array();
        expect(expression2.nested_expressions.length).to.equal(0);
    });

    test('running an automation with else steps', async () => {
        const topic = topicGenerate('');
        const message = '{"state_bottom":"OFF"}';
        const topicId = storeMessage(`zigbee2mqtt/${topic}`, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationReq: AutomationSetupPayloadInterface = {
            id: 0,
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

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `"ON" == ${topic}.state_bottm`,
                nested_expressions: [{
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
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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
        expect(executableStep1.conditional_expression_id as number).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('wait');
        expect(executableStep2.conditional_expression_id as number).to.equal(0);
    });
});