'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit } from "../src/storage";
import { randWord } from '@ngneat/falso';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup topics', () => {
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
});