'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../storage";
import { randWord } from '@ngneat/falso';
import { factoryInit, topicGenerate, automationCreate } from './helpers/factory';
import { AutomationExpressionSetupPayloadInterface } from '../routes/interfaces';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup topics', () => {
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

    test('setup a topic manually', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}/${randWord().toLowerCase()}`;

        const res = await server.inject({
            method: 'post',
            url: '/api/topic/setup',
            payload: { topic },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.topic_id)).to.be.greaterThan(0);

        const topicId = result.topic_id;
        const getRes = await server.inject({
            method: 'post',
            url: '/api/topic/get',
            payload: { topic_id: topicId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: getResult }: { result: any; } = getRes;
        expect(getResult).to.be.object();
        expect(getResult.topic_id).to.be.equal(topicId);
        expect(getResult.topic).to.be.equal(topic);
    });

    test('getting all topics', async () => {
        const getRes = await server.inject({
            method: 'post',
            url: '/api/topics/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result }: { result: any; } = getRes;
        expect(result).to.be.object();
        expect(result.topics).to.be.array();
        expect(Number(result.topics.length)).to.be.greaterThan(0);
    });

    test('get a topic used in an automation', async () => {
        const topicName = topicGenerate('');
        const message = '{"state_bottom":"OFF"}';
        const topicId = storeMessage(`zigbee2mqtt/${topicName}`, '{"linkquality":100,"state_bottom":"OFF","state_top":"OFF"}');

        const automationId = await automationCreate({
            trigger: 'time',
            trigger_at: '11:00'
        });
        expect(automationId).to.be.greaterThan(0);

        const expressions: AutomationExpressionSetupPayloadInterface = {
            automation_id: automationId,
            expressions: [{
                kind: 'if',
                expression: `"ON" == ${topicName}.state_bottom`,
                nested_expressions: [{
                    kind: 'notify',
                    message: '{"host":"http://localhost:5050/discuss_topic", "payload": {"topic":"garage"}}'
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
        const { result: exprs }: { result: any; } = await server.inject({
            method: 'post',
            url: `/api/automation/expressions/setup`,
            payload: expressions,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(exprs.automation_id).to.be.number();
        expect(exprs.automation_id).to.equal(automationId);

        const getRes = await server.inject({
            method: 'post',
            url: `/api/topics/get`,
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result }: { result: any; } = getRes;
        expect(result).to.be.object();
        expect(result.topics).to.be.array();

        const topic = result.topics.find((t: any) => t.topic_id == topicId);
        expect(topic).to.be.object();
        expect(topic.topic_id).to.equal(topicId);
        expect(topic.automations_containing).to.be.array();
        expect(topic.automations_containing.length > 0).to.equal(true);

        const automationContaining = topic.automations_containing[0];
        expect(automationContaining).to.be.object();
        expect(automationContaining.automation_id).to.equal(automationId);
    });
});