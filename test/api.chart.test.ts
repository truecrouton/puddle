'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { randAccessory, randWord } from '@ngneat/falso';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup charts', () => {
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

    test('setup and update a chart', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":59,"humidity":32,"update":"available"}');

        const chart = {
            chart_id: 0,
            topic_id: topicId,
            name: randAccessory(),
            key: 'linkquality',
            is_favorite: true
        };
        const res = await server.inject({
            method: 'post',
            url: '/api/chart/setup',
            payload: chart,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.chart_id)).to.be.greaterThan(0);

        const chartId = result.chart_id;

        const getRes = await server.inject({
            method: 'post',
            url: '/api/chart/get',
            payload: { chart_id: chartId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: getResult }: { result: any; } = getRes;
        expect(getResult).to.be.object();
        expect(getResult.topic_id).to.be.equal(topicId);
        expect(getResult.name).to.be.equal(chart.name);
        expect(getResult.key).to.be.equal(chart.key);

        const chartUpdate = {
            chart_id: chartId,
            topic_id: topicId,
            name: randAccessory(),
            key: 'humidity',
            is_favorite: false
        };

        const updateRes = await server.inject({
            method: 'post',
            url: '/api/chart/setup',
            payload: chartUpdate,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(updateRes.statusCode).to.equal(200);

        const getUpdateRes = await server.inject({
            method: 'post',
            url: '/api/chart/get',
            payload: { chart_id: chartId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getUpdateRes.statusCode).to.equal(200);

        const { result: getUpdate }: { result: any; } = getUpdateRes;
        expect(getUpdate).to.be.object();
        expect(getUpdate.topic_id).to.be.equal(topicId);
        expect(getUpdate.name).to.be.equal(chartUpdate.name);
        expect(getUpdate.key).to.be.equal(chartUpdate.key);
    });

    test('setup and get all charts', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":59,"humidity":32,"update":"available"}');

        const chart = {
            chart_id: 0,
            topic_id: topicId,
            name: randAccessory(),
            key: 'linkquality',
            is_favorite: false
        };
        const res = await server.inject({
            method: 'post',
            url: '/api/chart/setup',
            payload: chart,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.chart_id)).to.be.greaterThan(0);

        const chartId = result.chart_id;

        const getRes = await server.inject({
            method: 'post',
            url: '/api/charts/get',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(getRes.statusCode).to.equal(200);

        const { result: getResult }: { result: any; } = getRes;
        expect(getResult).to.be.object();
        expect(getResult.charts).to.be.array();

        const charts: [] = getResult.charts;
        expect(charts.length).to.be.greaterThan(0);
    });

    test('setup and delete a chart', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const topicId = storeMessage(topic, '{"linkquality":12,"humidity":32,"update":"available"}');

        const chart = {
            chart_id: 0,
            topic_id: topicId,
            name: randAccessory(),
            key: 'linkquality',
            is_favorite: false
        };
        const res = await server.inject({
            method: 'post',
            url: '/api/chart/setup',
            payload: chart,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(Number(result.chart_id)).to.be.greaterThan(0);

        const chartId = result.chart_id;

        const deleteRes = await server.inject({
            method: 'post',
            url: '/api/chart/delete',
            payload: { chart_id: chartId },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(deleteRes.statusCode).to.equal(200);
    });
});