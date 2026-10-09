import { compareAsc, compareDesc, endOfDay, endOfMonth, format, startOfDay, addMilliseconds, subMilliseconds, parseISO, differenceInSeconds, addMinutes } from 'date-fns';
import { connect } from "mqtt";
import { getTimes } from 'suncalc';
import { db, Automation, Topic, cacheGet } from "./storage";
import { AutomationExpressionInterface, DeviceInterface } from './routes/interfaces';
import { evaluate } from './expressions';
import { setTimeout } from 'timers/promises';
import { request, RequestOptions } from 'http';
import { object } from 'joi';
import { URL } from 'url';

interface AutomationExpressions { automation_id: number, result: AutomationExpressionInterface[]; }

const mqtt = connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);

export function checkLastCondition(createdAt: string | undefined, rightTimeOp: string) {
    if (!createdAt) return false;

    const lastTime = parseISO(createdAt);
    const now = new Date();
    const seconds = differenceInSeconds(addMinutes(now, now.getTimezoneOffset()), lastTime);
    const rightTimeValue = Number(rightTimeOp.replace('>', '').replace('<', '').replace('=', ''));

    if (rightTimeOp.includes('>')) return seconds > rightTimeValue;
    else if (rightTimeOp.includes('<')) return seconds < rightTimeValue;
    else return seconds === rightTimeValue;
}

export function presetValue(preset: string): string {
    let value = '';
    const today = new Date();
    const year = today.getFullYear();

    switch (preset) {
        case "date":
            value = format(today, 'yyyy-MM-dd');
            break;
        case "time":
            value = format(today, 'HH:mm');
            break;
        case "month":
            value = format(today, 'L');
            break;
        case "day":
            value = format(today, 'EEEE');
            break;
        case "season_northern":
            const seasonsNorthern = [
                { name: "spring", start: new Date(year, 2, 1), end: new Date(year, 4, 31) },
                { name: "summer", start: new Date(year, 5, 1), end: new Date(year, 7, 31) },
                { name: "fall", start: new Date(year, 8, 1), end: new Date(year, 10, 30) },
                { name: "winter", start: new Date(year, 11, 1), end: endOfMonth(new Date(year, 1, 10)) }
            ];

            for (const season of seasonsNorthern) {
                if (compareAsc(today, season.start) > -1 && compareDesc(today, season.end) > -1) {
                    value = season.name;
                    break;
                }
            }
            break;
        case "season_southern":
            const seasonsSouthern = [
                { name: "fall", start: new Date(year, 2, 1), end: new Date(year, 4, 31) },
                { name: "winter", start: new Date(year, 5, 1), end: new Date(year, 7, 31) },
                { name: "spring", start: new Date(year, 8, 1), end: new Date(year, 10, 30) },
                { name: "summer", start: new Date(year, 11, 1), end: endOfMonth(new Date(year, 1, 10)) }
            ];

            for (const season of seasonsSouthern) {
                if (compareAsc(today, season.start) > -1 && compareDesc(today, season.end) > -1) {
                    value = season.name;
                    break;
                }
            }
            break;
        case "sun_position":
            const sun = getTimes(today, Number(process.env.LOCATION_LATITUDE), Number(process.env.LOCATION_LONGITUDE));
            const positions = [
                { name: "day", start: sun.sunrise, end: sun.sunset },
                { name: "night", start: addMilliseconds(sun.sunset, 1), end: endOfDay(today) },
                { name: "night", start: startOfDay(today), end: subMilliseconds(sun.sunrise, 1) }
            ];

            for (const position of positions) {
                if (compareAsc(today, position.start) > -1 && compareDesc(today, position.end) > -1) {
                    value = position.name;
                    break;
                }
            }
            break;
    }

    return value;
}

export function savedAutomations(): Automation[] {
    const automations = <Automation[]>db.prepare('SELECT id, trigger, trigger_at, position FROM automations WHERE trigger IN (?, ?)').all('sun', 'time');

    return automations;
}

export async function runAutomation(automationId: number): Promise<AutomationExpressionInterface[]> {
    const exprs = <AutomationExpressionInterface[]>db.prepare('SELECT id, kind, expression, conditional_expression_id, is_else_step, topic_id, message, device_id, state FROM automation_expressions where automation_id=?').all(automationId);
    const topicStmt = db.prepare('SELECT topic FROM topics where id=?');

    if (!exprs.length) return [];

    const conditionalSteps = ['if'];
    const conditionalResults = exprs.reduce((res, expr) => conditionalSteps.includes(expr.kind) && evaluate(expr.expression) ? [...res, expr.id!] : res, <number[]>[]);

    const executableSteps: AutomationExpressionInterface[] = [];
    for (const expr of exprs.filter((e) => !conditionalSteps.includes(e.kind))) {
        if (expr.conditional_expression_id && (!expr.is_else_step && !conditionalResults.includes(expr.conditional_expression_id)) || (expr.is_else_step && conditionalResults.includes(expr.conditional_expression_id || 0))) {
            continue;
        }
        executableSteps.push(expr);

        if (process.env.NODE_ENV == 'test') continue;

        if (expr.kind == 'notify') {
            const validEndpoints = ["/discuss_topic", "/stash_content"];
            let messageObj: { host: string; payload: object; };

            try {
                if (typeof expr.message == 'string') messageObj = JSON.parse(expr.message);
                else break;

                const url = new URL(messageObj.host);

                if (
                    !validEndpoints.includes(url.pathname) ||
                    typeof messageObj.payload !== 'object' ||
                    typeof messageObj.host !== 'string'
                ) {
                    console.error('Invalid message structure');
                    break;
                }

                const reqOptions: RequestOptions = {
                    hostname: url.hostname,
                    port: url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname,
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                };

                const req = request(reqOptions, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        console.log('Response:', res.statusCode, data);
                    });
                });

                req.on('error', (e) => { console.error('Request error:', e); });

                req.on('timeout', () => {
                    req.destroy();
                    console.error('Request timed out');
                });

                if (process.env.NODE_ENV != 'test') {
                    req.write(JSON.stringify(messageObj.payload));
                    req.end();
                }
            } catch (error) {
                console.error('Notification error:', expr.message, error);
                break;
            }
        }
        else if (expr.kind == 'device') {
            const device = <DeviceInterface>db.prepare('SELECT id, kind, topic_id, set_key, state_key, set_suffix, value_on, value_off FROM devices where id=?').get(expr.device_id);
            const topic = <Topic>topicStmt.get(device.topic_id);

            const currentValue = cacheGet(device.topic_id, device.state_key);
            if (expr.state != currentValue) {
                let message;
                switch (device.kind) {
                    case "toggleable":
                        message = { [device.set_key!]: expr.state! > 0 ? device.value_on : device.value_off };
                        break;
                    case "dimmable":
                    case "positionable":
                        message = { [device.set_key!]: expr.state };
                        break;
                }

                const setTopic = [topic.topic, device.set_suffix].join('/');
                mqtt.publish(setTopic, JSON.stringify(message));
            }
        }
        else if (expr.kind == 'publish') {
            const topic = <Topic>topicStmt.get(expr.topic_id);
            try {
                JSON.parse(expr.message!);
            }
            catch (error) {
                console.error(expr.message, error);
            }
            mqtt.publish(topic.topic, expr.message!);
        }
        //else if (expr.kind == 'wait') await setTimeout(50);
    }

    return executableSteps;
}

export async function triggerTopicAutomations(topic: string, jsonString: string): Promise<AutomationExpressions[]> {
    const automations = <Automation[]>db.prepare('SELECT automations.id, trigger_key, trigger_value FROM topics LEFT JOIN automations ON automations.topic_id=topics.id WHERE trigger=? and topic=?').all('topic', topic);

    const json = JSON.parse(jsonString);
    const triggerAutomations = automations.filter((a) => {
        if (a.trigger_key?.length > 0 && (Number(a.trigger_value) > 0 || a.trigger_value?.length > 0)) {
            return ((!isNaN(Number(json[a.trigger_key])) && Number(json[a.trigger_key]) === Number(a.trigger_value)) || json[a.trigger_key] === a.trigger_value);
        }
        return true;
    });

    return Promise.all(triggerAutomations.map((ta) => runAutomation(ta.id).then(
        (results) => ({ automation_id: ta.id, result: results })
    )));
}

export async function triggerSunAutomations(position: string): Promise<AutomationExpressions[]> {
    const automations = <Automation[]>db.prepare('SELECT id FROM automations WHERE trigger=? and position=?').all('sun', position);

    return Promise.all(automations.map((a) => runAutomation(a.id).then(
        (results) => ({ automation_id: a.id, result: results })
    )));
}

export async function triggerTimeAutomations(time: string): Promise<AutomationExpressions[]> {
    const automations = <Automation[]>db.prepare('SELECT id FROM automations WHERE trigger=? and trigger_at=?').all('time', time);

    return Promise.all(automations.map((a) => runAutomation(a.id).then(
        (results) => ({ automation_id: a.id, result: results })
    )));
}