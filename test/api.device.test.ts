'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { randAccessory, randVerb, randWord } from '@ngneat/falso';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup and control devices', () => {
    let server: Server;

    before((async () => {
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    test('setup and update a toggleable device', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        const device = {
            device_id: 0,
            topic_id: topicId,
            kind: 'toggleable',
            name: randAccessory(),
            state_key: randWord().toLowerCase(),
            set_key: randWord().toLowerCase(),
            set_suffix: randVerb().toLowerCase().replace(' ', '_'),
            value_on: 'ON',
            value_off: 'OFF'
        };
        const res = await server.inject({
            method: 'post',
            url: '/api/device/setup',
            payload: device,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.device_id)).to.be.greaterThan(0);

        const deviceId = result.device_id;

        const getRes = await server.inject({
            method: 'post',
            url: '/api/device/get',
            payload: { device_id: deviceId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: getResult }: { result: any; } = getRes;
        expect(getResult).to.be.object();
        expect(getResult.device_id).to.be.equal(deviceId);
        expect(getResult.name).to.be.equal(device.name);
        expect(getResult.kind).to.be.equal(device.kind);
        expect(getResult.state_key).to.be.equal(device.state_key);
        expect(getResult.set_key).to.be.equal(device.set_key);
        expect(getResult.set_suffix).to.be.equal(device.set_suffix);

        expect(getResult.status).to.be.array();
        expect(Number(getResult.status.length)).to.be.greaterThan(0);

        const linkQuality = getResult.status.find((s) => s.status_key === 'linkquality');
        const stateTop = getResult.status.find((s) => s.status_key === 'state_top');
        const stateBottom = getResult.status.find((s) => s.status_key === 'state_bottom');
        expect(linkQuality.value).to.equal(156);
        expect(stateTop.value).to.equal("OFF");
        expect(stateBottom.value).to.equal("OFF");

        const deviceUpdate = {
            device_id: deviceId,
            topic_id: topicId,
            kind: 'toggleable',
            name: randAccessory(),
            state_key: randWord().toLowerCase(),
            set_key: randWord().toLowerCase(),
            set_suffix: randVerb().toLowerCase().replace(' ', '_'),
            value_on: 'ON',
            value_off: 'OFF'
        };

        const updateRes = await server.inject({
            method: 'post',
            url: '/api/device/setup',
            payload: deviceUpdate,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(updateRes.statusCode).to.equal(200);

        const getUpdateRes = await server.inject({
            method: 'post',
            url: '/api/device/get',
            payload: { device_id: deviceId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getUpdateRes.statusCode).to.equal(200);

        const { result: getUpdate }: { result: any; } = getUpdateRes;
        expect(getUpdate).to.be.object();
        expect(getUpdate.device_id).to.be.equal(deviceId);
        expect(getUpdate.name).to.be.equal(deviceUpdate.name);
        expect(getUpdate.kind).to.be.equal(deviceUpdate.kind);
        expect(getUpdate.state_key).to.be.equal(deviceUpdate.state_key);
        expect(getUpdate.set_key).to.be.equal(deviceUpdate.set_key);
        expect(getUpdate.set_suffix).to.be.equal(deviceUpdate.set_suffix);
    });

    test('setup a positionable device', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":76,"position":"55","update":{"state":"available"}}');

        const device = {
            device_id: 0,
            topic_id: topicId,
            kind: 'positionable',
            name: randAccessory(),
            state_key: randWord().toLowerCase(),
            set_key: randWord().toLowerCase(),
            set_suffix: randVerb().toLowerCase().replace(' ', '_'),
            value_on: 100,
            value_off: 0,
        };
        const res = await server.inject({
            method: 'post',
            url: '/api/device/setup',
            payload: device,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.device_id)).to.be.greaterThan(0);

        const deviceId = result.device_id;

        const getRes = await server.inject({
            method: 'post',
            url: '/api/device/get',
            payload: { device_id: deviceId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: getResult }: { result: any; } = getRes;
        expect(getResult).to.be.object();
        expect(getResult.device_id).to.be.equal(deviceId);
        expect(getResult.name).to.be.equal(device.name);
        expect(getResult.kind).to.be.equal(device.kind);
        expect(getResult.state_key).to.be.equal(device.state_key);
        expect(getResult.set_key).to.be.equal(device.set_key);
        expect(getResult.set_suffix).to.be.equal(device.set_suffix);
        expect(getResult.value_on).to.be.equal(device.value_on);
        expect(getResult.value_off).to.be.equal(device.value_off);
    });

    test('getting all devices', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/api/devices/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(result.devices).to.be.array();
        expect(Array(result.devices).length).to.be.greaterThan(0);
    });

    test('setting a device', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":156,"state_bottom":"OFF","state_top":"OFF","update":{"state":"available"}}');

        const device = {
            device_id: 0,
            topic_id: topicId,
            kind: 'toggleable',
            name: randAccessory(),
            state_key: randWord().toLowerCase(),
            set_key: randWord().toLowerCase(),
            set_suffix: randVerb().toLowerCase().replace(' ', '_'),
            value_on: "ON",
            value_off: "OFF"
        };

        const res = await server.inject({
            method: 'post',
            url: '/api/device/setup',
            payload: device,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.device_id)).to.be.greaterThan(0);

        const deviceId = result.device_id;

        const setRes = await server.inject({
            method: 'post',
            url: '/api/device/set',
            payload: { device_id: deviceId, state: 1 },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(setRes.statusCode).to.equal(200);

        const { result: setResult }: { result: any; } = setRes;
        expect(setResult).to.be.object();
        expect(setResult.topic).to.equal(`${topic}/${device.set_suffix}`);
        expect(setResult.message).to.equal({ [`${device.set_key}`]: 'ON' });
    });
});