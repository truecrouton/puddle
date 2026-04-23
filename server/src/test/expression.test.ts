'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../storage";
import { evaluate } from "../expressions";
import { randWord } from '@ngneat/falso';
import { format, subHours } from 'date-fns';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, test } = lab;
export { lab };

experiment('evaluate expressions', () => {
    let server: Server;

    before((async () => {
        process.env.BASE_TOPIC = 'zigbee2mqtt';
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    test('arithmetic evaluation', async () => {
        expect(evaluate('1 + 2')).to.equal(3);
        expect(evaluate('10 - 5')).to.equal(5);
        expect(evaluate('2 * 4')).to.equal(8);
        expect(evaluate('20 / 4')).to.equal(5);

        expect(evaluate('1 + 2 * 3')).to.equal(7);
        expect(evaluate('10 - 4 / 2')).to.equal(8);
        expect(evaluate('5 * 4 + 3 * 2')).to.equal(26);
        expect(evaluate('10 / 2 - 1 * 3')).to.equal(2);

        expect(evaluate('((1 + 2) * 3) + 1')).to.equal(10);
        expect(evaluate('10 / (2 + (1 * 3))')).to.equal(2);
        expect(evaluate('(5 * (4 + (3 - 1))) / 2')).to.equal(15);

        expect(evaluate('10 - 5 - 2')).to.equal(3);
        expect(evaluate('24 / 4 / 2')).to.equal(3);
        expect(evaluate('100 / 10 * 2')).to.equal(20);

        //expect(evaluate('-5 + 10')).to.equal(5);
        expect(evaluate('1+2*3')).to.equal(7);
        expect(evaluate('( 1 + 2 ) * 3')).to.equal(9);
        expect(evaluate('10  +   5 ')).to.equal(15);
    });

    test('logical operation evaluation', async () => {
        expect(evaluate('1 > 2')).to.equal(false);
        expect(evaluate('10 == 10')).to.equal(true);
        expect(evaluate('5 < 10 AND 2 > 1')).to.equal(true);
        expect(evaluate('1 == 2 OR 3 == 3')).to.equal(true);

        expect(evaluate('1 OR 0 AND 0')).to.equal(1);
        expect(evaluate('0 AND 1 OR 1')).to.equal(1);
        expect(evaluate('0 AND (1 OR 1)')).to.equal(0);

        expect(evaluate('1 + 2 == 3')).to.equal(true);
        expect(evaluate('10 > 5 + 2')).to.equal(true);
        expect(evaluate('1 + 2 * 3 == 7')).to.equal(true);
        expect(evaluate('(1 + 2) * 3 == 9 AND 4 > 2')).to.equal(true);

        expect(evaluate('(1 + 1 == 2) AND (5 * 5 > 20 OR 0)')).to.equal(true);
        //short-circuiting logic, the second half might not even need to be valid
        expect(evaluate('2 + 2 == 4 OR 10 / 0 == 5')).to.equal(true);
    });

    test('topic parameter logical evaluation', async () => {
        const device = `${randWord().toLowerCase()}_${randWord().toLowerCase()}`;
        const topic = `${process.env.BASE_TOPIC}/${device}`;

        const topicId = storeMessage(topic, '{"humidity":88,"state":"OFF","update":{"state":"available"}}');
        expect(topicId).to.be.greaterThan(0);

        expect(evaluate(`${device}.state == 'OFF'`)).to.equal(true);
        expect(evaluate(`'OFF' == ${device}.state`)).to.equal(true);
        expect(evaluate(`${device}.state != 'OFF'`)).to.equal(false);
        expect(evaluate(`${device}.state > 'OFF'`)).to.equal(false);
        expect(evaluate(`${device}.state > 'AAA'`)).to.equal(true);
        expect(evaluate(`${device}.state < 'OFF'`)).to.equal(false);
        expect(evaluate(`${device}.state < 'ZZZ'`)).to.equal(true);

        expect(evaluate(`${device}.humidity == 88`)).to.equal(true);
        expect(evaluate(`${device}.humidity != 87`)).to.equal(true);
        expect(evaluate(`${device}.humidity != 88`)).to.equal(false);
        expect(evaluate(`${device}.humidity >= 87`)).to.equal(true);
        expect(evaluate(`${device}.humidity >= 88`)).to.equal(true);
        expect(evaluate(`${device}.humidity <= 89`)).to.equal(true);
        expect(evaluate(`${device}.humidity <= 88`)).to.equal(true);
        expect(evaluate(`${device}.humidity > 87`)).to.equal(true);
        expect(evaluate(`${device}.humidity < 89`)).to.equal(true);

        expect(evaluate(`${device}.humidity _![<10] 88`)).to.equal(false);
        expect(evaluate(`${device}.humidity _![<10] 92`)).to.equal(true);
        expect(evaluate(`${device}.humidity _![>10] 88`)).to.equal(false);

        storeMessage(topic, '{"humidity":92,"state":"ON","update":{"state":"available"}}');

        expect(evaluate(`${device}.state == "ON"`)).to.equal(true);

        expect(evaluate(`${device}.humidity >> 90`)).to.equal(true);
        expect(evaluate(`${device}.humidity >> 95`)).to.equal(false);
        expect(evaluate(`${device}.humidity >> 92`)).to.equal(false);

        expect(evaluate(`${device}.humidity _=[<10] 88`)).to.equal(true);
        expect(evaluate(`${device}.humidity _=[<10] 92`)).to.equal(true);
        expect(evaluate(`${device}.humidity _=[>10] 88`)).to.equal(false);
        expect(evaluate(`${device}.humidity _=[<10] 70`)).to.equal(false);

        expect(evaluate(`${device}.humidity _![>10] 88`)).to.equal(false);
        expect(evaluate(`${device}.humidity _![>10] 92`)).to.equal(false);
        expect(evaluate(`${device}.humidity _![>10] 55`)).to.equal(false);

        expect(evaluate(`${device}.humidity _>[<10] 92`)).to.equal(false);
        expect(evaluate(`${device}.humidity _>[<10] 91`)).to.equal(true);
        expect(evaluate(`${device}.humidity _>[>10] 91`)).to.equal(false);

        expect(evaluate(`${device}.humidity _<[<10] 92`)).to.equal(true);
        expect(evaluate(`${device}.humidity _<[<10] 91`)).to.equal(true);
        expect(evaluate(`${device}.humidity _<[>10] 91`)).to.equal(false);

        storeMessage(topic, '{"humidity":76.6,"state":"OFF","update":{"state":"available"}}');
        expect(evaluate(`${device}.humidity == 76.6`)).to.equal(true);
        expect(evaluate(`${device}.humidity <= 76.6`)).to.equal(true);
        expect(evaluate(`${device}.humidity >= 76.6`)).to.equal(true);
        expect(evaluate(`${device}.humidity < 76.7`)).to.equal(true);
        expect(evaluate(`${device}.humidity > 76.5`)).to.equal(true);
        expect(evaluate(`${device}.humidity << 77`)).to.equal(true);
        expect(evaluate(`${device}.humidity << 75`)).to.equal(false);
        expect(evaluate(`${device}.humidity << 76`)).to.equal(false);
    });

    test('preset evaluation', async () => {
        const today = new Date();
        const todayDate = format(today, 'yyyy-MM-dd');
        const time = format(today, 'HH:mm');
        const month = format(today, 'L');

        expect(evaluate(`date == '${todayDate}'`)).to.equal(true);
        expect(evaluate(`date == "${todayDate}"`)).to.equal(true);
        expect(evaluate(`time == '${time}'`)).to.equal(true);
        expect(evaluate(`time <= '${time}'`)).to.equal(true);
        expect(evaluate(`time >= '${time}'`)).to.equal(true);
        expect(evaluate(`month == ${month}`)).to.equal(true);

        const lastHour = format(subHours(today, 1), 'HH:mm');
        expect(evaluate(`time == '${lastHour}'`)).to.equal(false);
        expect(evaluate(`time < '${lastHour}'`)).to.equal(false);
        expect(evaluate(`time <= '${lastHour}'`)).to.equal(false);
        expect(evaluate(`time > '${lastHour}'`)).to.equal(true);
        expect(evaluate(`time >= '${lastHour}'`)).to.equal(true);
    });
});