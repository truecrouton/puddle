'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../storage";
import { randVerb, randWord } from '@ngneat/falso';
import { deviceCreate, factoryInit, topicGenerate } from './helpers/factory';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup and get control', () => {
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

    test('getting all controls', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(result.controls).to.be.array();
    });

    test('get positionable control state', async () => {
        const topic = topicGenerate();
        const stateKey = randWord().toLowerCase();
        const topicId1 = storeMessage(topic, `{"linkquality":114,"${stateKey}":"55","state":"OPEN"}`);

        const deviceId = await deviceCreate({
            topic_id: topicId1,
            kind: 'positionable',
            state_key: stateKey,
            set_key: randWord().toLowerCase(),
            set_suffix: randVerb().toLowerCase().replace(' ', '_'),
            value_on: 100,
            value_off: 0,
        });
        expect(Number(deviceId)).to.be.greaterThan(0);

        const res = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result: result1 }: { result: any; } = res;
        expect(result1).to.be.object();
        expect(result1.controls).to.be.array();

        const control1 = result1.controls.find((c: any) => c.topic_id == topicId1);
        expect(control1).to.be.object();
        expect(control1.device_id).to.be.equal(deviceId);
        expect(control1.state).to.equal('middle');

        const topicId2 = storeMessage(topic, `{"linkquality":114,"${stateKey}":"0","state":"OPEN"}`);
        expect(topicId2).to.equal(topicId1);

        const { result: result2 }: { result: any; } = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result2).to.be.object();
        expect(result2.controls).to.be.array();

        const control2 = result2.controls.find((c: any) => c.topic_id == topicId2);
        expect(control2).to.be.object();
        expect(control2.device_id).to.be.equal(deviceId);
        expect(control2.state).to.equal('low');

        const topicId3 = storeMessage(topic, `{"linkquality":114,"${stateKey}":"100","state":"OPEN"}`);
        expect(topicId3).to.equal(topicId1);

        const { result: result3 }: { result: any; } = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result3).to.be.object();
        expect(result3.controls).to.be.array();

        const control3 = result3.controls.find((c: any) => c.topic_id == topicId2);
        expect(control3).to.be.object();
        expect(control3.device_id).to.be.equal(deviceId);
        expect(control3.state).to.equal('high');
    });

    test('get toggleable control state', async () => {
        const topic = topicGenerate();
        const stateKey = randWord().toLowerCase();
        const topicId1 = storeMessage(topic, `{"linkquality":156,"${stateKey}":"OFF","state_top":"OFF","update":{"state":"available"}}`);

        const deviceId = await deviceCreate({
            topic_id: topicId1,
            kind: 'toggleable',
            state_key: stateKey,
            set_key: randWord().toLowerCase(),
            set_suffix: randVerb().toLowerCase().replace(' ', '_'),
            value_on: "ON",
            value_off: "OFF"
        });
        expect(Number(deviceId)).to.be.greaterThan(0);

        const res = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result: result1 }: { result: any; } = res;
        expect(result1).to.be.object();
        expect(result1.controls).to.be.array();

        const control1 = result1.controls.find((c: any) => c.topic_id == topicId1);
        expect(control1).to.be.object();
        expect(control1.device_id).to.be.equal(deviceId);
        expect(control1.state).to.equal('low');

        const topicId2 = storeMessage(topic, `{"linkquality":156,"${stateKey}":"ON","state_top":"OFF","update":{"state":"available"}}`);
        expect(topicId2).to.equal(topicId1);

        const { result: result2 }: { result: any; } = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result2).to.be.object();
        expect(result2.controls).to.be.array();

        const control2 = result2.controls.find((c: any) => c.topic_id == topicId2);
        expect(control2).to.be.object();
        expect(control2.device_id).to.be.equal(deviceId);
        expect(control2.state).to.equal('high');

        const topicId3 = storeMessage(topic, `{"linkquality":156,"${stateKey}":"55","state_top":"OFF","update":{"state":"available"}}`);
        expect(topicId3).to.equal(topicId1);

        const { result: result3 }: { result: any; } = await server.inject({
            method: 'post',
            url: '/api/controls/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(result3).to.be.object();
        expect(result3.controls).to.be.array();

        const control3 = result3.controls.find((c: any) => c.topic_id == topicId2);
        expect(control3).to.be.object();
        expect(control3.device_id).to.be.equal(deviceId);
        expect(control3.state).to.equal('unknown');
    });
});