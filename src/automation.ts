import { compareAsc, compareDesc, endOfDay, endOfMonth, format, startOfDay, addMilliseconds, subMilliseconds, parseISO, differenceInSeconds, addMinutes } from 'date-fns';
import { connect } from "mqtt";
import { getTimes } from 'suncalc';
import { AutomationStep, AutomationSteps, Automation, Topic, storageInit } from "./storage";

export const db = storageInit({ fileMustExist: true });
const mqtt = connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);

function checkConditions(stepId: number): boolean {
    const conditions: any[] = db.prepare('SELECT kind, left_operand_kind, left_preset, left_topic_id, left_topic_key, left_value, right_operand_kind, right_preset, right_topic_id, right_topic_key, right_value FROM automation_conditions where step_id=?').all(stepId);

    if (!conditions.length) return false;
    conditions.sort((a, b) => {
        if (a.left_operand_kind === b.left_operand_kind) {
            if (a.right_operand_kind === b.right_operand_kind) {
                if (a.kind === b.kind) return 0;
                else return ["inc", "dec", 'lgt', 'llt', 'leq', 'lneq'].includes(a.kind) ? 1 : -1;
            }
            else return ['preset', 'value'].includes(a.right_operand_kind) ? -1 : 1;
        }
        else return ['preset', 'value'].includes(a.left_operand_kind) ? -1 : 1;
    });

    for (const condition of conditions) {
        let leftOp = '';
        let rightOp = '';
        let rightTimeOp = '';

        if (condition.left_preset) {
            leftOp = presetValue(condition.left_preset);
        }
        else if (condition.left_value) {
            leftOp = condition.left_value;
        }
        else if (condition.left_topic_id) {
            leftOp = topicValue(condition.left_topic_id, condition.left_topic_key);
        }

        if (condition.right_preset) {
            rightOp = presetValue(condition.right_preset);
        }
        else if (condition.right_value) {
            if (['lgt', 'llt', 'leq', 'lneq'].includes(condition.kind)) {
                const values = condition.right_value.split(',');
                if (values.length < 2) return false;

                rightOp = values[0];
                rightTimeOp = values[1];
            }
            else {
                rightOp = condition.right_value;
            }
        }
        else if (condition.right_topic_id) {
            rightOp = topicValue(condition.right_topic_id, condition.right_topic_key);
        }

        let result = false;
        switch (condition.kind) {
            case "and":
                result = leftOp.length > 0 && rightOp.length > 0;
                break;
            case "or":
                result = leftOp.length > 0 || rightOp.length > 0;
                break;
            case "eq":
                result = leftOp == rightOp;
                break;
            case "neq":
                result = leftOp != rightOp;
                break;
            case "gt":
                result = leftOp > rightOp;
                break;
            case "gte":
                result = leftOp >= rightOp;
                break;
            case "leq":
                {
                    const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value=? ORDER BY created_at desc LIMIT 1').all(condition.left_topic_id, condition.left_topic_key, rightOp);

                    result = checkLastCondition(history[0]?.created_at, rightTimeOp);
                }
                break;
            case "lgt":
                {
                    const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value>? ORDER BY created_at desc LIMIT 1').all(condition.left_topic_id, condition.left_topic_key, rightOp);

                    result = checkLastCondition(history[0]?.created_at, rightTimeOp);
                }
                break;
            case "llt":
                {
                    const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value<? ORDER BY created_at desc LIMIT 1').all(condition.left_topic_id, condition.left_topic_key, rightOp);

                    result = checkLastCondition(history[0]?.created_at, rightTimeOp);
                }
                break;
            case "lneq":
                {
                    const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value<>? ORDER BY created_at desc LIMIT 1').all(condition.left_topic_id, condition.left_topic_key, rightOp);

                    result = checkLastCondition(history[0]?.created_at, rightTimeOp);
                }
                break;
            case "lt":
                result = leftOp < rightOp;
                break;
            case "lte":
                result = leftOp <= rightOp;
                break;
            case "inc":
                if (leftOp > rightOp) {
                    const history = <{ value: string; }[]>db.prepare('SELECT value FROM pairs WHERE topic_id=? AND name=? and value<>? ORDER BY created_at desc LIMIT 1').all(condition.left_topic_id, condition.left_topic_key, leftOp);

                    result = history.length > 0 && history[0].value < leftOp && history[0].value <= rightOp;
                }
                break;
            case "dec":
                if (leftOp < rightOp) {
                    const history = <{ value: string; }[]>db.prepare('SELECT value FROM pairs WHERE topic_id=? AND name=? and value<>? ORDER BY created_at desc LIMIT 1').all(condition.left_topic_id, condition.left_topic_key, leftOp);

                    result = history.length > 0 && history[0].value > leftOp && history[0].value >= rightOp;
                }
                break;
        }

        if (!result) return false;
    };

    return true;
}

function checkLastCondition(createdAt: string | undefined, rightTimeOp: string) {
    if (!createdAt) return false;

    const lastTime = parseISO(createdAt);
    const now = new Date();
    const seconds = differenceInSeconds(addMinutes(now, now.getTimezoneOffset()), lastTime);
    const rightTimeValue = Number(rightTimeOp.replace('>', '').replace('<', '').replace('=', ''));

    if (rightTimeOp.includes('>')) return seconds > rightTimeValue;
    else if (rightTimeOp.includes('<')) return seconds < rightTimeValue;
    else return seconds === rightTimeValue;
}

function presetValue(preset: string): string {
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

function topicValue(topicId: number, key: string): string {
    const pair: any = db.prepare('SELECT value FROM pairs WHERE is_latest=? AND is_object=? AND name=? AND topic_id=?').get(1, 0, key, topicId);

    return pair?.value ?? '';
}

export function savedAutomations(): Automation[] {
    const automations = <Automation[]>db.prepare('SELECT id, trigger, trigger_at, position FROM automations WHERE trigger IN (?, ?)').all('sun', 'time');

    return automations;
}

export function runAutomation(automationId: number): AutomationStep[] {
    const steps = <AutomationStep[]>db.prepare('SELECT id as step_id, kind, conditional_step_id, is_else_step, topic_id, message FROM automation_steps where automation_id=?').all(automationId);
    const topicStmt = db.prepare('SELECT topic FROM topics where id=?');

    if (!steps.length) return [];

    const conditionalSteps = ['if'];
    const conditionalResults = steps.reduce((res, step) => conditionalSteps.includes(step.kind) && checkConditions(step.step_id) ? [...res, step.step_id] : res, <number[]>[]);

    const executableSteps: AutomationStep[] = [];
    for (const step of steps.filter((step) => !conditionalSteps.includes(step.kind))) {
        if (step.conditional_step_id && (!step.is_else_step && !conditionalResults.includes(step.conditional_step_id)) || (step.is_else_step && conditionalResults.includes(step.conditional_step_id))) {
            continue;
        }
        executableSteps.push(step);

        if (process.env.NODE_ENV === 'test') continue;

        switch (step.kind) {
            case 'notify':
                break;
            case 'publish':
                const topic = <Topic>topicStmt.get(step.topic_id);
                mqtt.publish(topic.topic, step.message);
                break;
            case 'wait':
                break;
            default:
                break;
        }
    };

    return executableSteps;
}

export function triggerTopicAutomations(topic: string, jsonString: string): AutomationSteps[] {
    const automations = <Automation[]>db.prepare('SELECT automations.id, trigger_key, trigger_value FROM topics LEFT JOIN automations ON automations.topic_id=topics.id WHERE trigger=? and topic=?').all('topic', topic);

    const json = JSON.parse(jsonString);
    const triggerAutomations = automations.filter((a) => {
        if (a.trigger_key?.length > 0 && (Number(a.trigger_value) > 0 || a.trigger_value?.length > 0)) {
            return ((!isNaN(Number(json[a.trigger_key])) && Number(json[a.trigger_key]) === Number(a.trigger_value)) || json[a.trigger_key] === a.trigger_value);
        }
        return true;
    });

    return triggerAutomations.map((a) => ({
        automation_id: a.id,
        result: runAutomation(a.id)
    }));
}

export function triggerSunAutomations(position: string): AutomationSteps[] {
    const automations = <Automation[]>db.prepare('SELECT id FROM automations WHERE trigger=? and position=?').all('sun', position);

    return automations.map((a) => ({
        automation_id: a.id,
        result: runAutomation(a.id)
    }));
}

export function triggerTimeAutomations(time: string): AutomationSteps[] {
    const automations = <Automation[]>db.prepare('SELECT id FROM automations WHERE trigger=? and trigger_at=?').all('time', time);

    return automations.map((a) => ({
        automation_id: a.id,
        result: runAutomation(a.id)
    }));
}