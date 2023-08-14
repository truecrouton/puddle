'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { randNumber, randWord } from '@ngneat/falso';
import { addMinutes, addSeconds, subSeconds } from 'date-fns';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('retrieve pairs', () => {
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

    test('get pairs', async () => {
        const topic = `zigbee2mqtt/${randWord().toLowerCase()}`;
        const now = new Date();
        const start = subSeconds(now, 90);

        const topicId = storeMessage(topic, '{"linkquality":156,"illuminance":0,"state":"OFF"}', now);

        for (let i = 0; i < 9; i++) {
            const message = {
                linkquality: randNumber({ min: 1, max: 200, precision: 1 }),
                illuminance: randNumber({ min: 1, max: 200, precision: 1 }),
                state: randNumber({ min: 1, max: 100, precision: 1 }) > 50 ? 'ON' : 'OFF',
            };
            storeMessage(topic, JSON.stringify(message), addSeconds(start, i * 10));
        }

        const offset = now.getTimezoneOffset();
        const res = await server.inject({
            method: 'post',
            url: '/api/pairs/get',
            payload: { topic_id: topicId, name: 'illuminance', start_date: addMinutes(start, offset).toISOString(), end_date: addMinutes(now, offset + 1).toISOString() },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();
        expect(result.pairs).to.be.array();

        const pairs = result.pairs;
        expect(pairs.length).to.be.equal(10);
    });
});