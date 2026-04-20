'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { runAutomation } from "../src/automation";
import { automationCreate, factoryInit, topicGenerate } from './helpers/factory';
import { format, subSeconds } from 'date-fns';
import { AutomationExpressionSetupPayloadInterface } from '../src/routes/interfaces';

const lab = Lab.script();
const { afterEach, beforeEach, before, experiment, test } = lab;
export { lab };

experiment('run automations with preset conditions', () => {
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

    test('generate accurate preset values', async () => {
        const topic = topicGenerate('');
        const message = '{"state":"ON"}';
        const today = new Date();
        const topicId = storeMessage(`zigbee2mqtt/${topic}`, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '12:00'
        });

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `date == "${format(today, 'yyyy-MM-dd')}"`,
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
                kind: 'if',
                expression: `month == ${format(today, 'L')}`,
                nested_expressions: [{
                    kind: 'notify'
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
        expect(result.automation_id).to.be.number();
        expect(result.automation_id).to.equal(automationId);

        const runRes = runAutomation(automationId);
        expect(runRes).to.be.array();
        expect(runRes.length).to.equal(2);

        const executableStep1 = runRes[0];
        expect(executableStep1.kind).to.equal('notify');
        expect(executableStep1.conditional_expression_id as number).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('notify');
        expect(executableStep2.conditional_expression_id as number).to.be.greaterThan(0);
    });

    test('detect increasing and decreasing values', async () => {
        const topicDec = topicGenerate('');
        const topicInc = topicGenerate('');
        const message = '{"state":"ON"}';

        const now = new Date();
        const start = subSeconds(now, 1);

        const decTopicId = storeMessage(`zigbee2mqtt/${topicDec}`, JSON.stringify({ linkquality: 100, illuminance: 66 }), start);
        const incTopicId = storeMessage(`zigbee2mqtt/${topicInc}`, JSON.stringify({ linkquality: 100, illuminance: 66 }), start);
        storeMessage(`zigbee2mqtt/${topicDec}`, JSON.stringify({ linkquality: 100, illuminance: 33 }), now);
        storeMessage(`zigbee2mqtt/${topicInc}`, JSON.stringify({ linkquality: 100, illuminance: 88 }), now);

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '12:00'
        });

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `${topicInc}.illuminance >> 77 AND ${topicDec}.illuminance << 55`,
                nested_expressions: [{
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
                expression: `${topicInc}.illuminance << 22`,
                nested_expressions: [{
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
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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
        expect(executableStep1.conditional_expression_id as number).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('publish');
        expect(executableStep2.conditional_expression_id as number).to.be.greaterThan(0);
    });

    test('detect last values', async () => {
        const topic1 = topicGenerate('');
        const topic2 = topicGenerate('');
        const message = '{"state":"ON"}';

        const now = new Date();
        const start = subSeconds(now, 60);

        const topicId1 = storeMessage(`zigbee2mqtt/${topic1}`, JSON.stringify({ linkquality: 100, occupancy: 0 }), start);
        const topicId2 = storeMessage(`zigbee2mqtt/${topic2}`, JSON.stringify({ linkquality: 100, occupancy: 1 }), start);
        storeMessage(`zigbee2mqtt/${topic1}`, JSON.stringify({ linkquality: 100, occupancy: 1 }), now);
        storeMessage(`zigbee2mqtt/${topic2}`, JSON.stringify({ linkquality: 100, occupancy: 0 }), now);

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '12:00'
        });

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `${topic2}.occupancy _>[>30] 0 AND ${topic2}.occupancy _=[<1] 0`,
                nested_expressions: [{
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
                expression: `${topic1}.occupancy _<[>30] 1`,
                nested_expressions: [{
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
            url: `/api/automation/expressions/setup`,
            payload: expressions,
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
        expect(executableStep1.conditional_expression_id as number).to.be.greaterThan(0);

        const executableStep2 = runRes[1];
        expect(executableStep2.kind).to.equal('publish');
        expect(executableStep2.conditional_expression_id as number).to.be.greaterThan(0);
    });
});