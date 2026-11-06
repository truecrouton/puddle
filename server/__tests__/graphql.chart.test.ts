import { DELETE_CHART, GET_CHARTS, GET_PAIRS, UPSERT_CHART } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createTopicFactory } from './utils/factories';
import { storageInit, storeMessage } from '../src/storage';
import { randAccessory, randNumber, randWord } from '@ngneat/falso';
import { addMinutes, addSeconds, subSeconds } from 'date-fns';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('create, update, and get charts', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"linkquality":59,"humidity":32,"update":"available"}');
    expect(topicId).toBeGreaterThan(0);

    const newChart = {
        id: 0,
        topicId: topicId,
        name: randAccessory(),
        key: randWord(),
        isFavorite: true
    };

    const chartRes = await executeOperation(UPSERT_CHART, { input: newChart });
    expect(chartRes.upsertChart.id).toBeTypeOf('number');
    expect(chartRes.upsertChart.id).toBeGreaterThan(0);
    expect(chartRes.upsertChart.topicId).toEqual(topicId);
    expect(chartRes.upsertChart.name).toEqual(newChart.name);
    expect(chartRes.upsertChart.key).toEqual(newChart.key);
    expect(chartRes.upsertChart.isFavorite).toEqual(true);

    const updatedChart = { ...newChart, id: chartRes.upsertChart.id, name: randAccessory(), key: randWord(), isFavorite: false };
    const updateChartRes = await executeOperation(UPSERT_CHART, { input: updatedChart });
    expect(updateChartRes.upsertChart.id).toBeTypeOf('number');
    expect(updateChartRes.upsertChart.id).toEqual(chartRes.upsertChart.id);
    expect(updateChartRes.upsertChart.topicId).toEqual(topicId);
    expect(updateChartRes.upsertChart.name).toEqual(updatedChart.name);
    expect(updateChartRes.upsertChart.key).toEqual(updatedChart.key);
    expect(updateChartRes.upsertChart.isFavorite).toEqual(false);

    const getChartsRes = await executeOperation(GET_CHARTS);
    expect(getChartsRes.charts).toBeTruthy();
    expect(getChartsRes.charts.length).toBeGreaterThan(0);
    expect(getChartsRes.charts).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: chartRes.upsertChart.id, topicId }),
        ])
    );
});

test('create and delete a chart', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"linkquality":59,"humidity":32,"update":"available"}');
    expect(topicId).toBeGreaterThan(0);

    const newChart = {
        id: 0,
        topicId: topicId,
        name: randAccessory(),
        key: randWord(),
        isFavorite: true
    };

    const chartRes = await executeOperation(UPSERT_CHART, { input: newChart });
    expect(chartRes.upsertChart.id).toBeTypeOf('number');
    expect(chartRes.upsertChart.id).toBeGreaterThan(0);
    expect(chartRes.upsertChart.topicId).toEqual(topicId);
    expect(chartRes.upsertChart.name).toEqual(newChart.name);
    expect(chartRes.upsertChart.key).toEqual(newChart.key);
    expect(chartRes.upsertChart.isFavorite).toEqual(true);

    const deleteChartRes = await executeOperation(DELETE_CHART, { input: { id: chartRes.upsertChart.id } });
    expect(deleteChartRes.deleteChart).toEqual(true);

    const getChartsRes = await executeOperation(GET_CHARTS);
    expect(getChartsRes.charts).toBeTruthy();
    expect(getChartsRes.charts.length).toBeGreaterThan(0);
    expect(getChartsRes.charts).not.toContainEqual({ id: chartRes.upsertChart.id });
});

test('create and get pairs', async ({ executeOperation }) => {
    const now = new Date();
    const start = subSeconds(now, 90);

    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"linkquality":156,"illuminance":0,"state":"OFF"}', now);
    expect(topicId).toBeGreaterThan(0);

    for (let i = 0; i < 9; i++) {
        const message = {
            linkquality: randNumber({ min: 1, max: 200, precision: 1 }),
            illuminance: randNumber({ min: 1, max: 200, precision: 1 }),
            state: randNumber({ min: 1, max: 100, precision: 1 }) > 50 ? 'ON' : 'OFF',
        };
        storeMessage(topic.topic, JSON.stringify(message), addSeconds(start, i * 10));
    }

    const offset = now.getTimezoneOffset();
    const pairsRes = await executeOperation(GET_PAIRS, { topicId, name: 'illuminance', startDate: addMinutes(start, offset).toISOString(), endDate: addMinutes(now, offset + 1).toISOString() });
    expect(pairsRes.pairs).toBeTypeOf('object');
    expect(pairsRes.pairs.length).toEqual(10);
});