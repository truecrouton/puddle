'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { deviceCreate, factoryInit } from './helpers/factory';
import { randLastName, randWord } from '@ngneat/falso';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup devices', () => {
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

    test('setup device status', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        const deviceId = await deviceCreate({
            topic_id: topicId
        });

        const status = {
            status_key_id: 0,
            device_id: deviceId,
            name: randLastName(),
            status_key: randWord().toLowerCase(),
            is_shown: true
        };

        const res = await server.inject({
            method: 'post',
            url: '/api/device/status/setup',
            payload: status,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(result.status_key_id).to.be.number();

        const statusKeyId = Number(result.status_key_id);
        expect(statusKeyId).to.be.greaterThan(0);

        const getRes = await server.inject({
            method: 'post',
            url: '/api/device/status/get',
            payload: { device_id: deviceId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: statusResult }: { result: any; } = getRes;
        expect(statusResult).to.be.object();
        expect(statusResult.status).to.be.array();
        expect(statusResult.status.length).to.equal(1);

        const getStatus = statusResult.status[0];
        expect(getStatus.status_key_id).to.equal(statusKeyId);
        expect(getStatus.name).to.equal(status.name);
        expect(getStatus.status_key).to.equal(status.status_key);
        expect(getStatus.is_shown).to.equal(1);
    });
});