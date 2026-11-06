import { test, expect, beforeAll, afterAll } from './utils/fixtures';
import { evaluate } from '../src/expressions';
import { storageInit, storeMessage } from '../src/storage';
import { randWord } from '@ngneat/falso';
import { format, subHours } from 'date-fns';
import { initFastify } from '../src/graphql/server';
import { createTopicFactory } from './utils/factories';

beforeAll(async () => {
    process.env.BASE_TOPIC = 'zigbee2mqtt';
    storageInit('__tests__/puddle_test.sqlite');
});

test('arithmetic evaluations', async () => {
    expect(evaluate('1 + 2')).toEqual(3);
    expect(evaluate('10 - 5')).toEqual(5);
    expect(evaluate('2 * 4')).toEqual(8);
    expect(evaluate('20 / 4')).toEqual(5);

    expect(evaluate('1 + 2 * 3')).toEqual(7);
    expect(evaluate('10 - 4 / 2')).toEqual(8);
    expect(evaluate('5 * 4 + 3 * 2')).toEqual(26);
    expect(evaluate('10 / 2 - 1 * 3')).toEqual(2);

    expect(evaluate('((1 + 2) * 3) + 1')).toEqual(10);
    expect(evaluate('10 / (2 + (1 * 3))')).toEqual(2);
    expect(evaluate('(5 * (4 + (3 - 1))) / 2')).toEqual(15);

    expect(evaluate('10 - 5 - 2')).toEqual(3);
    expect(evaluate('24 / 4 / 2')).toEqual(3);
    expect(evaluate('100 / 10 * 2')).toEqual(20);

    //expect(evaluate('-5 + 10')).toEqual(5);
    expect(evaluate('1+2*3')).toEqual(7);
    expect(evaluate('( 1 + 2 ) * 3')).toEqual(9);
    expect(evaluate('10  +   5 ')).toEqual(15);
});

test('logical operation evaluation', async () => {
    expect(evaluate('1 > 2')).toEqual(false);
    expect(evaluate('10 == 10')).toEqual(true);
    expect(evaluate('5 < 10 AND 2 > 1')).toEqual(true);
    expect(evaluate('1 == 2 OR 3 == 3')).toEqual(true);

    expect(evaluate('1 OR 0 AND 0')).toEqual(1);
    expect(evaluate('0 AND 1 OR 1')).toEqual(1);
    expect(evaluate('0 AND (1 OR 1)')).toEqual(0);

    expect(evaluate('1 + 2 == 3')).toEqual(true);
    expect(evaluate('10 > 5 + 2')).toEqual(true);
    expect(evaluate('1 + 2 * 3 == 7')).toEqual(true);
    expect(evaluate('(1 + 2) * 3 == 9 AND 4 > 2')).toEqual(true);

    expect(evaluate('(1 + 1 == 2) AND (5 * 5 > 20 OR 0)')).toEqual(true);
    //short-circuiting logic, the second half might not even need to be valid
    expect(evaluate('2 + 2 == 4 OR 10 / 0 == 5')).toEqual(true);
});

test('topic parameter logical evaluation', async () => {
    const device = `${randWord().toLowerCase()}_${randWord().toLowerCase()}`;
    const topic = `${process.env.BASE_TOPIC}/${device}`;

    const topicId = storeMessage(topic, '{"humidity":88,"state":"OFF","update":{"state":"available"}}');
    expect(topicId).to.be.greaterThan(0);

    expect(evaluate(`${device}.state == 'OFF'`)).toEqual(true);
    expect(evaluate(`'OFF' == ${device}.state`)).toEqual(true);
    expect(evaluate(`${device}.state != 'OFF'`)).toEqual(false);
    expect(evaluate(`${device}.state > 'OFF'`)).toEqual(false);
    expect(evaluate(`${device}.state > 'AAA'`)).toEqual(true);
    expect(evaluate(`${device}.state < 'OFF'`)).toEqual(false);
    expect(evaluate(`${device}.state < 'ZZZ'`)).toEqual(true);

    expect(evaluate(`${device}.humidity == 88`)).toEqual(true);
    expect(evaluate(`${device}.humidity != 87`)).toEqual(true);
    expect(evaluate(`${device}.humidity != 88`)).toEqual(false);
    expect(evaluate(`${device}.humidity >= 87`)).toEqual(true);
    expect(evaluate(`${device}.humidity >= 88`)).toEqual(true);
    expect(evaluate(`${device}.humidity <= 89`)).toEqual(true);
    expect(evaluate(`${device}.humidity <= 88`)).toEqual(true);
    expect(evaluate(`${device}.humidity > 87`)).toEqual(true);
    expect(evaluate(`${device}.humidity < 89`)).toEqual(true);

    expect(evaluate(`${device}.humidity _![<10] 88`)).toEqual(false);
    expect(evaluate(`${device}.humidity _![<10] 92`)).toEqual(true);
    expect(evaluate(`${device}.humidity _![>10] 88`)).toEqual(false);

    storeMessage(topic, '{"humidity":92,"state":"ON","update":{"state":"available"}}');

    expect(evaluate(`${device}.state == "ON"`)).toEqual(true);

    expect(evaluate(`${device}.humidity >> 90`)).toEqual(true);
    expect(evaluate(`${device}.humidity >> 95`)).toEqual(false);
    expect(evaluate(`${device}.humidity >> 92`)).toEqual(false);

    expect(evaluate(`${device}.humidity _=[<10] 88`)).toEqual(true);
    expect(evaluate(`${device}.humidity _=[<10] 92`)).toEqual(true);
    expect(evaluate(`${device}.humidity _=[>10] 88`)).toEqual(false);
    expect(evaluate(`${device}.humidity _=[<10] 70`)).toEqual(false);

    expect(evaluate(`${device}.humidity _![>10] 88`)).toEqual(false);
    expect(evaluate(`${device}.humidity _![>10] 92`)).toEqual(false);
    expect(evaluate(`${device}.humidity _![>10] 55`)).toEqual(false);

    expect(evaluate(`${device}.humidity _>[<10] 92`)).toEqual(false);
    expect(evaluate(`${device}.humidity _>[<10] 91`)).toEqual(true);
    expect(evaluate(`${device}.humidity _>[>10] 91`)).toEqual(false);

    expect(evaluate(`${device}.humidity _<[<10] 92`)).toEqual(true);
    expect(evaluate(`${device}.humidity _<[<10] 91`)).toEqual(true);
    expect(evaluate(`${device}.humidity _<[>10] 91`)).toEqual(false);

    storeMessage(topic, '{"humidity":76.6,"state":"OFF","update":{"state":"available"}}');
    expect(evaluate(`${device}.humidity == 76.6`)).toEqual(true);
    expect(evaluate(`${device}.humidity <= 76.6`)).toEqual(true);
    expect(evaluate(`${device}.humidity >= 76.6`)).toEqual(true);
    expect(evaluate(`${device}.humidity < 76.7`)).toEqual(true);
    expect(evaluate(`${device}.humidity > 76.5`)).toEqual(true);
    expect(evaluate(`${device}.humidity << 77`)).toEqual(true);
    expect(evaluate(`${device}.humidity << 75`)).toEqual(false);
    expect(evaluate(`${device}.humidity << 76`)).toEqual(false);
});

test('preset evaluation', async () => {
    const today = new Date();
    const todayDate = format(today, 'yyyy-MM-dd');
    const time = format(today, 'HH:mm');
    const month = format(today, 'L');

    expect(evaluate(`date == '${todayDate}'`)).toEqual(true);
    expect(evaluate(`date == "${todayDate}"`)).toEqual(true);
    expect(evaluate(`time == '${time}'`)).toEqual(true);
    expect(evaluate(`time <= '${time}'`)).toEqual(true);
    expect(evaluate(`time >= '${time}'`)).toEqual(true);
    expect(evaluate(`month == ${month}`)).toEqual(true);

    const lastHour = format(subHours(today, 1), 'HH:mm');
    expect(evaluate(`time == '${lastHour}'`)).toEqual(false);
    expect(evaluate(`time < '${lastHour}'`)).toEqual(false);
    expect(evaluate(`time <= '${lastHour}'`)).toEqual(false);
    expect(evaluate(`time > '${lastHour}'`)).toEqual(true);
    expect(evaluate(`time >= '${lastHour}'`)).toEqual(true);
});

test('function evaluation', async () => {
    expect(evaluate('34 < toCelsius(95)')).toEqual(true);
    expect(evaluate('36 > toCelsius(95)')).toEqual(true);

    const topic = createTopicFactory();
    const topicId = storeMessage(topic.topic, '{"temperature":35,"humidity":32,"update":"available"}');
    expect(topicId).toBeGreaterThan(0);

    const subTopic = topic.topic.split('/')[1];
    expect(evaluate(`toCelsius(94) < ${subTopic}.temperature`)).toEqual(true);
    expect(evaluate(`toCelsius(96) > ${subTopic}.temperature`)).toEqual(true);

    storeMessage(topic.topic, '{"temperature":38,"humidity":32,"update":"available"}');
    expect(evaluate(`${subTopic}.temperature >> toCelsius(99)`)).toEqual(true);
    expect(evaluate(`${subTopic}.temperature >> toCelsius(100)`)).toEqual(true);
    expect(evaluate(`${subTopic}.temperature >> toCelsius(101)`)).toEqual(false);
});