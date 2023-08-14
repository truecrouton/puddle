import { Request, ResponseToolkit, ResponseObject, ServerRoute } from "@hapi/hapi";
import { badImplementation, badRequest } from "@hapi/boom";
import Joi from "joi";
import { connect } from "mqtt";
import dotenv from 'dotenv';
import { storageInit, Automation, Device, Pair, Topic, AutomationStep, DeviceStatusKey, User, sqliteDate, Chart } from "../storage";
import { dailySchedulerJob, scheduleSunAutomation, scheduleTimeAutomation } from "../schedule";
import { scheduledJobs } from "node-schedule";
import { parseISO } from "date-fns";
import { runAutomation } from "../automation";
import { celsiusToFahrenheit, hashPassword } from "../helper";
import { randomBytes } from "crypto";

export const db = storageInit({ fileMustExist: true });
const mqtt = connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);

async function automationDelete(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { automation_id: automationId }: any = request.payload;

    const steps = <AutomationStep[]>db.prepare('SELECT id AS step_id from automation_steps where automation_id=?').all(automationId);

    const conditionStmt = db.prepare('DELETE FROM automation_conditions WHERE step_id=?');
    db.transaction(() => {
        steps.forEach(s => {
            conditionStmt.run(s.step_id);
        });
        db.prepare('DELETE FROM automation_steps WHERE automation_id=?').run(automationId);
        db.prepare('DELETE FROM automations WHERE id=?').run(automationId);
    })();

    return h.response({});
}

async function automationGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    const automationId = payload.automation_id;
    const automation = <Automation>db.prepare('SELECT id as automation_id, name, trigger, trigger_at, position, topic_id, trigger_key, trigger_value FROM automations WHERE id=?').get(automationId);

    if (!payload.with_details) return h.response(automation);

    const steps = <AutomationStep[]>db.prepare('SELECT automation_steps.id as step_id, kind, is_else_step, topic_id, topic, message FROM automation_steps LEFT JOIN topics on topics.id=automation_steps.topic_id WHERE conditional_step_id=0 AND automation_id=?').all(automationId);

    const conditionStmt = db.prepare('SELECT id as condition_id, kind, left_operand_kind, left_preset, left_topic_id, left_topic_key, left_value, right_operand_kind, right_preset, right_topic_id, right_topic_key, right_value FROM automation_conditions WHERE step_id=?');
    const conditionalStepsStmt = db.prepare('SELECT automation_steps.id as step_id, kind, is_else_step, topic_id, topic, message FROM automation_steps LEFT JOIN topics on topics.id=automation_steps.topic_id WHERE conditional_step_id=? AND automation_id=?');

    automation.steps = steps.map((step) => {
        const conditions = conditionStmt.all(step.step_id);
        const conditionalSteps = (<AutomationStep[]>conditionalStepsStmt.all(step.step_id, automationId)).map((cStep) => ({ ...cStep, is_else_step: Boolean(cStep.is_else_step) }));
        return { ...step, is_else_step: Boolean(step.is_else_step), conditions, steps: conditionalSteps };
    });

    return h.response(automation);
}

async function automationsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const automations = db.prepare('SELECT id as automation_id, name, trigger FROM automations').all();

    return h.response({ automations });
}

async function automationRun(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { automation_id: automationId }: any = request.payload;

    const automation = <Automation>db.prepare('SELECT trigger FROM automations WHERE id=? AND trigger=\'user\'').get(automationId);
    if (!automation) throw badRequest('Unable to run this automation');

    const executedSteps = runAutomation(automationId);

    if (process.env.NODE_ENV === 'test') return h.response(executedSteps);

    return h.response({});
}

async function automationSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    let automationId = payload.automation_id ? payload.automation_id : 0;

    const automationRes = automationId > 0 ?
        db.prepare('UPDATE automations SET name=?, trigger=?, trigger_at=?, position=?, topic_id=?, trigger_key=?, trigger_value=?, is_control_shown=? WHERE id=?').run(payload.name, payload.trigger, payload.trigger_at, payload.position, payload.topic_id, payload.trigger_key, payload.trigger_value, payload.is_control_shown ? 1 : 0, automationId) :
        db.prepare('INSERT INTO automations (name, trigger, trigger_at, position, topic_id, trigger_key, trigger_value, is_control_shown) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(payload.name, payload.trigger, payload.trigger_at, payload.position, payload.topic_id, payload.trigger_key, payload.trigger_value, payload.is_control_shown ? 1 : 0);
    automationId = automationId ? automationId : automationRes.lastInsertRowid;

    if (payload.trigger === "sun") {
        scheduleSunAutomation(payload.position);
    }
    else if (payload.trigger === "time") {
        scheduleTimeAutomation(payload.trigger_at);
    }

    return h.response({ automation_id: automationId });
}

async function automationStepsSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    let automationId = payload.automation_id;

    function storeStep(step: any, automationId: number, parentStepId: number) {
        const isElseStep = step.is_else_step ? 1 : 0;
        const stepRes = db.prepare('INSERT INTO automation_steps (automation_id, kind, conditional_step_id, is_else_step, topic_id, message) VALUES(?, ?, ?, ?, ?, ?)').run(automationId, step.kind, parentStepId, isElseStep, step.topic_id, step.message);

        const insertedStepId = <number>stepRes.lastInsertRowid;

        if (step.steps?.length && !parentStepId) step.steps.forEach((nestedStep: any) => storeStep(nestedStep, automationId, insertedStepId));

        return insertedStepId;
    }

    db.transaction(() => {
        const existingAutomations = db.prepare('SELECT automation_steps.id as automation_step_id, automation_conditions.id as automation_condition_id FROM automation_steps LEFT JOIN automation_conditions ON automation_conditions.step_id=automation_steps.id WHERE automation_steps.automation_id=?').all(automationId);
        existingAutomations.forEach((row: any) => {
            db.prepare('DELETE FROM automation_steps where id=?').run(row.automation_step_id);
            db.prepare('DELETE FROM automation_conditions where id=?').run(row.automation_condition_id);
        });

        const conditionStmt = db.prepare('INSERT INTO automation_conditions (step_id, kind, left_operand_kind, left_preset, left_topic_id, left_topic_key, left_value, right_operand_kind, right_preset, right_topic_id, right_topic_key, right_value) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        payload.steps?.forEach((step: any) => {
            const stepId = storeStep(step, automationId, 0);

            step.conditions?.forEach((condition: any) => {
                conditionStmt.run(stepId, condition.kind, condition.left_operand_kind, condition.left_preset, condition.left_topic_id, condition.left_topic_key, condition.left_value, condition.right_operand_kind, condition.right_preset, condition.right_topic_id, condition.right_topic_key, condition.right_value);
            });
        });
    })();

    return h.response({ automation_id: automationId });
}

async function chartDelete(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { chart_id: chartId }: any = request.payload;

    db.prepare('DELETE FROM charts WHERE id=?').run(chartId);

    return h.response({});
}

async function chartGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { chart_id: chartId }: any = request.payload;

    const chart = <Chart>db.prepare('SELECT name, topic_id, key, is_favorite FROM charts WHERE id=?').get(chartId);

    return h.response(chart);
}

async function chartsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const charts = <Chart[]>db.prepare('SELECT id as chart_id, name, topic_id, key FROM charts').all();

    return h.response({ charts });
}

async function chartSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { chart_id: chartId, topic_id: topicId, name, key, is_favorite: isFavorite }: any = request.payload;

    const chartRes = chartId > 0 ?
        db.prepare('UPDATE charts SET topic_id=?, name=?, key=?, is_favorite=? WHERE id=?').run(topicId, name, key, isFavorite ? 1 : 0, chartId) :
        db.prepare('INSERT INTO charts (topic_id, name, key, is_favorite) VALUES(?, ?, ?, ?)').run(topicId, name, key, isFavorite ? 1 : 0);

    return h.response({ chart_id: chartId ? chartId : chartRes.lastInsertRowid });
}

async function controlsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const rootDevices = <Device[]>db.prepare('SELECT id as device_id, topic_id, name, kind, set_key, state_key, value_on, value_off FROM devices WHERE kind IN (\'dimmable\', \'positionable\', \'toggleable\')').all();

    const stateStmt = db.prepare('SELECT value FROM pairs WHERE topic_id=? AND is_latest=1 AND name=?');
    const devices = rootDevices.map((d) => {
        const pair = <Pair>stateStmt.get(d.topic_id, d.state_key);

        let state: string = 'unknown';
        if (pair) {
            if (pair.value === d.value_on) state = 'high';
            else if (pair.value === d.value_off) state = 'low';
            else state = 'middle';
        }

        return { ...d, state };
    });

    const automations = db.prepare('SELECT id as automation_id, name, trigger FROM automations WHERE trigger=\'user\' and is_control_shown=1').all();

    return h.response({ controls: [...devices, ...automations] });
}

async function deviceGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    const deviceId = payload.device_id;
    const device = <Device>db.prepare('SELECT id as device_id, topic_id, name, kind, set_key, set_suffix, state_key, value_on, value_off FROM devices WHERE id=?').get(payload.device_id);

    if (!device) return h.response({});

    const allPairs = <Pair[]>db.prepare('SELECT name, value FROM pairs WHERE topic_id=? AND is_latest=1 AND pair_id=0 AND is_object=0').all(device.topic_id);
    const allStatus = <DeviceStatusKey[]>db.prepare('SELECT id as status_key_id, status_key, name, is_shown FROM device_status_keys WHERE device_id=?').all(deviceId);

    const pairs = allPairs.reduce((pairs: { [key: string]: {}; }, p) => {
        pairs[p.name] = { value: p.value };
        return pairs;
    }, {});
    const status = allStatus.reduce((status: { [key: string]: {}; }, s) => {
        status[s.status_key] = s;
        return status;
    }, {});

    const keys = new Set([...allPairs.map((p) => p.name), ...allStatus.map((s) => s.status_key)]);
    const combinedStatus = [...keys].map((k) => ({
        ...pairs[k],
        ...status[k],
        status_key: k
    }));

    return h.response({ ...device, status: combinedStatus });
}

async function devicesGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const devices = <Device[]>db.prepare('SELECT id as device_id, topic_id, name, kind, set_key FROM devices').all();

    return h.response({ devices });
}

async function deviceSet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    const device: any = db
        .prepare('SELECT topic, kind, set_key, set_suffix, value_on, value_off FROM devices LEFT JOIN topics on topics.id=devices.topic_id WHERE devices.id=?')
        .get(payload.device_id);

    let message;
    switch (device.kind) {
        case "toggleable":
            message = { [device.set_key]: payload.state > 0 ? device.value_on : device.value_off };
            break;
        case "dimmable":
        case "positionable":
            message = { [device.set_key]: payload.state };
            break;
    }

    const topic = [device.topic, device.set_suffix].join('/');

    if (process.env.NODE_ENV === 'test') return h.response({ topic, message });

    mqtt.publish(topic, JSON.stringify(message));

    return h.response({});
}

async function deviceSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    const deviceId = payload.device_id ? payload.device_id : 0;
    const setSuffix = payload.set_suffix ? payload.set_suffix : 'set';

    const deviceRes = deviceId > 0 ?
        db.prepare('UPDATE devices SET topic_id=?, name=?, kind=?, set_key=?, state_key=?, set_suffix=?, value_on=?, value_off=? WHERE id=?').run(payload.topic_id, payload.name, payload.kind, payload.set_key, payload.state_key, payload.set_suffix, payload.value_on, payload.value_off, deviceId) :
        db.prepare('INSERT INTO devices (topic_id, name, kind, set_key, state_key, set_suffix, value_on, value_off) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(payload.topic_id, payload.name, payload.kind, payload.set_key, payload.state_key, setSuffix, payload.value_on, payload.value_off);

    return h.response({ device_id: deviceId ? deviceId : deviceRes.lastInsertRowid });
}

async function deviceStatusGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;

    const status = db.prepare('SELECT id as status_key_id, name, status_key, is_shown FROM device_status_keys WHERE device_id=?').all(payload.device_id);

    return h.response({ status });
}

async function deviceStatusSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    const statusId = payload.status_key_id ? payload.status_key_id : 0;

    const statusRes = statusId > 0 ?
        db.prepare('UPDATE device_status_keys SET device_id=?, name=?, status_key=?, is_shown=? WHERE id=?').run(payload.device_id, payload.name, payload.status_key, payload.is_shown, statusId) :
        db.prepare('INSERT INTO device_status_keys (device_id, name, status_key, is_shown) VALUES(?, ?, ?, ?)').run(payload.device_id, payload.name, payload.status_key, payload.is_shown ? 1 : 0);

    return h.response({ status_key_id: statusId ? statusId : statusRes.lastInsertRowid });
}

async function favoriteStatesGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const charts = <Chart[]>db.prepare('SELECT name, topic_id, key FROM charts WHERE is_favorite=1').all();

    const stateStmt = db.prepare('SELECT value FROM pairs WHERE topic_id=? AND is_latest=1 AND name=?');

    const displayFarenheit = process.env.TEMPERATURE_CONVERT_TO === 'F';
    const states = charts.map((c) => {
        const pair = <Pair>stateStmt.get(c.topic_id, c.key);

        return {
            ...c,
            state: displayFarenheit && c.key === 'temperature' ? celsiusToFahrenheit(pair.value) : pair.value
        };
    });

    return h.response({ states });
}

async function index(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    return h.response({ authenticated: request.auth?.isAuthenticated ?? false });
}

async function pairsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { topic_id: topicId, name, start_date: startDate, end_date: endDate }: any = request.payload;

    const utcStart = sqliteDate(false, parseISO(startDate));
    const utcEnd = sqliteDate(false, parseISO(endDate));

    const pairs = <Pair[]>db.prepare('SELECT value, created_at FROM pairs where pair_id=0 AND is_object=0 AND topic_id=? AND name=? AND created_at>=? AND created_at<=?').all(topicId, name, utcStart, utcEnd);

    const displayFarenheit = name === 'temperature' && process.env.TEMPERATURE_CONVERT_TO === 'F';
    const convertedPairs = pairs.map((p) => displayFarenheit ? { ...p, value: celsiusToFahrenheit(p.value) } : p);

    return h.response({ pairs: convertedPairs });
}

async function passwordReset(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { username, new_password: newPassword, auth_phrase: authPhrase }: any = request.payload;

    const secret: any = {};
    dotenv.config({ path: './secret.env', processEnv: secret });
    if (authPhrase !== secret.AUTH_PHRASE) throw badRequest('The authorization phrase is invalid or disabled');

    const user = <User>db.prepare('SELECT id as user_id FROM users where username=?').get(username);
    if (!user) throw badRequest(`Unable to reset the password for ${username}`);


    const passwordRes = db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(newPassword), user.user_id);

    if (passwordRes.changes === 0) throw badRequest('The password could not be updated ensure the new password is new');

    return h.response({});
}

async function scheduleGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const automationStmt = db.prepare("SELECT id as automation_id, name, trigger FROM automations WHERE trigger IN ('sun', 'time') AND (position=? OR trigger_at=?)");

    const schedule = Object.keys(scheduledJobs).reduce((jobs, job) => job === dailySchedulerJob ? jobs : [...jobs, {
        name: scheduledJobs[job].name,
        runs_at: scheduledJobs[job].nextInvocation(),
        automations: automationStmt.all(job, job)
    }], <{ name: string, runs_at: Date; }[]>[]);

    return h.response({ schedule });
}

async function topicGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { topic_id: topicId }: any = request.payload;

    const topic = <Topic>db.prepare('SELECT id as topic_id, topic from topics where id=?').get(topicId);

    const pairs = <Pair[]>db.prepare('SELECT name, value FROM pairs WHERE is_latest=1 AND pair_id=0 AND is_object=0 AND topic_id=?').all(topicId);

    return h.response({ ...topic, status: pairs });
}

async function topicsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const baseTopics = <Topic[]>db.prepare('SELECT id as topic_id, topic from topics').all();

    if (baseTopics.length === 0) return h.response([]);

    const deviceStmt = db.prepare('SELECT id as device_id, name, kind FROM devices where topic_id=?');
    const automationStmt = db.prepare('SELECT id as automation_id, name, trigger FROM automations WHERE trigger=\'topic\' AND topic_id=?');
    const stepStmt = db.prepare('SELECT automation_id, name, trigger FROM automation_steps LEFT JOIN automations on automations.id=automation_steps.automation_id WHERE automation_steps.topic_id=?');
    const conditionStmt = db.prepare('SELECT automation_id, name, trigger FROM automation_conditions LEFT JOIN automation_steps on automation_steps.id=automation_conditions.step_id LEFT JOIN automations ON automations.id=automation_steps.automation_id WHERE automation_conditions.left_topic_id=? OR automation_conditions.right_topic_id=?');
    const topics = baseTopics.map((t) => {
        const usedIn = new Map();
        stepStmt.all(t.topic_id).forEach((s: any) => usedIn.set(s.automation_id, s));
        conditionStmt.all(t.topic_id, t.topic_id).forEach((c: any) => usedIn.set(c.automation_id, c));

        return {
            ...t,
            devices: deviceStmt.all(t.topic_id),
            automations: automationStmt.all(t.topic_id),
            automations_containing: [...usedIn.values()]
        };
    });

    return h.response({ topics });
}

async function topicSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { topic }: any = request.payload;

    const topicRes = db.prepare('INSERT OR IGNORE INTO topics (topic) VALUES(?)').run(topic);
    if (topicRes.changes === 0) throw badRequest('This topic already exists');

    return h.response({ topic_id: topicRes.lastInsertRowid });
}

async function userAdd(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { username, password, name, is_admin: isAdmin, auth_phrase: authPhrase }: any = request.payload;

    const secret: any = {};
    dotenv.config({ path: './secret.env', processEnv: secret });
    if (authPhrase !== secret.AUTH_PHRASE) throw badRequest('The authorization phrase is invalid or disabled');

    const userRes = db.prepare('INSERT INTO USERS (username, password, name, is_admin) VALUES(?, ?, ?, ?)').run(username, hashPassword(password), name, isAdmin ? 1 : 0);

    if (userRes.changes === 0) throw badRequest('The username is already in use');

    return h.response({});
}

async function userLogin(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { username, password }: any = request.payload;

    const user = <User>db.prepare('SELECT id as user_id, is_admin FROM users WHERE username=? and password=?').get(username, hashPassword(password));
    if (!user) throw badRequest('Invalid username or password');

    const sessionId = randomBytes(32).toString('base64');
    const { changes } = db.prepare('UPDATE users SET session_id=?, session_created_at=DATETIME() WHERE id=?').run(sessionId, user.user_id);
    if (changes === 0) throw badImplementation('A session creation error occurred');

    request.cookieAuth.set({ session_id: sessionId, is_admin: user.is_admin });
    return h.response({});
}

async function userLogout(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { userId } = request.auth.credentials;

    const sessionId = randomBytes(16).toString('hex');
    db.prepare('UPDATE users SET session_id=?, session_created_at=NULL WHERE id=?').run(sessionId, userId);

    request.cookieAuth.clear();

    return h.response({});
}

export const routesApi: ServerRoute[] = [
    {
        method: "POST",
        path: "/api",
        handler: index,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            },
            auth: {
                mode: 'try'
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/delete",
        handler: automationDelete,
        options: {
            validate: {
                payload: Joi.object({
                    automation_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/get",
        handler: automationGet,
        options: {
            validate: {
                payload: Joi.object({
                    automation_id: Joi.number().integer().min(1).required(),
                    with_details: Joi.bool().default(true)
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/run",
        handler: automationRun,
        options: {
            validate: {
                payload: Joi.object({
                    automation_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/setup",
        handler: automationSetup,
        options: {
            validate: {
                payload: Joi.object({
                    automation_id: Joi.number().integer().min(0).required(),
                    name: Joi.string().max(100).required(),
                    trigger: Joi.string().valid("time", "sun", "topic", "user").required(),
                    trigger_at: Joi.when('trigger', { is: 'time', then: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required() }),
                    position: Joi.when('trigger', { is: 'sun', then: Joi.string().valid("solarNoon", "nadir", "sunrise", "sunset", "sunriseEnd", "sunsetStart", "dawn", "dusk", "nauticalDawn", "nauticalDusk", "nightEnd", "night", "goldenHourEnd", "goldenHour", "morning", "afternoon", "lateMorning", "evening").required() }),
                    topic_id: Joi.when('trigger', { is: 'topic', then: Joi.number().integer().min(1).required(), }),
                    trigger_key: Joi.when('trigger', { is: 'topic', then: Joi.string().min(0).max(100) }),
                    trigger_value: Joi.when('trigger', { is: 'topic', then: Joi.string().min(0).max(100) }),
                    is_control_shown: Joi.when('trigger', { is: 'user', then: Joi.boolean().required() })
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/steps/setup",
        handler: automationStepsSetup,
        options: {
            validate: {
                payload: Joi.object({
                    automation_id: Joi.number().integer().min(1).required(),
                    steps: Joi.array().items(
                        Joi.object({
                            kind: Joi.string().valid("else", "if", "notify", "publish", "wait").required(),
                            topic_id: Joi.when('kind', { is: 'publish', then: Joi.number().integer().min(1).required() }),
                            message: Joi.when('kind', { is: 'publish', then: Joi.string().max(100).required() }),
                            conditions: Joi.array().items(Joi.object({
                                kind: Joi.string().valid("and", "eq", "or", "gt", "gte", "lt", "lte", "neq", "inc", "dec", 'lgt', 'llt', 'leq', 'lneq').required(),
                                left_operand_kind: Joi.string().valid("preset", "topic", "value").required(),
                                left_preset: Joi.when('left_operand_kind', { is: 'preset', then: Joi.string().valid("date", "time", "month", "day", "season_northern", "season_southern", "sun_position").required() }),
                                left_topic_id: Joi.when('left_operand_kind', { is: 'topic', then: Joi.number().integer().min(1).required() }),
                                left_topic_key: Joi.when('left_operand_kind', { is: 'topic', then: Joi.string().max(100).required() }),
                                left_value: Joi.when('left_operand_kind', { is: 'value', then: Joi.alternatives().try(Joi.string().min(1).max(100), Joi.number()).required() }),
                                right_operand_kind: Joi.string().valid("preset", "topic", "value").required(),
                                right_preset: Joi.when('right_operand_kind', { is: 'preset', then: Joi.string().valid("date", "time", "month", "day", "season_northern", "season_southern", "sun_position").required() }),
                                right_topic_id: Joi.when('right_operand_kind', { is: 'topic', then: Joi.number().integer().min(1).required() }),
                                right_topic_key: Joi.when('right_operand_kind', { is: 'topic', then: Joi.string().max(100).required() }),
                                right_value: Joi.when('right_operand_kind', { is: 'value', then: Joi.any().required() })
                            }).when(Joi.object({ kind: Joi.string().valid('lgt', 'llt', 'leq', 'lneq') }).unknown(), { then: Joi.object({ right_value: Joi.string().pattern(/^\d{1,5}\s*,\s*[><]\s*\d{1,5}$/).trim() }), otherwise: { right_value: Joi.alternatives(Joi.string().min(1).max(100), Joi.number()) } })),
                            steps: Joi.array().items(Joi.link('#step')),
                            is_else_step: Joi.boolean()
                        }).id('step')
                    )
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/automations/get",
        handler: automationsGet,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            }
        }
    },
    {
        method: "POST",
        path: "/api/chart/delete",
        handler: chartDelete,
        options: {
            validate: {
                payload: Joi.object({
                    chart_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/chart/get",
        handler: chartGet,
        options: {
            validate: {
                payload: Joi.object({
                    chart_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/chart/setup",
        handler: chartSetup,
        options: {
            validate: {
                payload: Joi.object({
                    chart_id: Joi.number().integer().min(0).required(),
                    name: Joi.string().min(1).max(100).required(),
                    topic_id: Joi.number().integer().min(1).required(),
                    key: Joi.string().min(1).max(100).required(),
                    is_favorite: Joi.boolean().required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/charts/get",
        handler: chartsGet,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            }
        }
    },
    {
        method: "POST",
        path: "/api/controls/get",
        handler: controlsGet,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/get",
        handler: deviceGet,
        options: {
            validate: {
                payload: Joi.object({
                    device_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/set",
        handler: deviceSet,
        options: {
            validate: {
                payload: Joi.object({
                    device_id: Joi.number().integer().min(1).required(),
                    state: Joi.number().min(0).max(100).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/setup",
        handler: deviceSetup,
        options: {
            validate: {
                payload: Joi.object({
                    device_id: Joi.number().integer().min(0).required(),
                    topic_id: Joi.number().integer().min(1).required(),
                    kind: Joi.string().valid("controlling", "dimmable", "informational", "positionable", "toggleable").required(),
                    name: Joi.string().max(100).required(),
                    set_key: Joi.string().token().max(100).empty(''),
                    state_key: Joi.string().token().max(100).required(),
                    set_suffix: Joi.string().token().max(100).empty(''),
                    value_off: Joi.alternatives().try(Joi.number(), Joi.string().token().max(100).empty('')),
                    value_on: Joi.alternatives().try(Joi.number(), Joi.string().token().max(100).empty(''))
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/status/get",
        handler: deviceStatusGet,
        options: {
            validate: {
                payload: Joi.object({
                    device_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/status/setup",
        handler: deviceStatusSetup,
        options: {
            validate: {
                payload: Joi.object({
                    status_key_id: Joi.number().integer().min(0).required(),
                    device_id: Joi.number().integer().min(1).required(),
                    name: Joi.string().max(100).required(),
                    status_key: Joi.string().token().max(100).required(),
                    is_shown: Joi.boolean().required(),
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/devices/get",
        handler: devicesGet,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            }
        }
    },
    {
        method: "POST",
        path: "/api/favorite/states/get",
        handler: favoriteStatesGet,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            },
            auth: false
        }
    },
    {
        method: "POST",
        path: "/api/pairs/get",
        handler: pairsGet,
        options: {
            validate: {
                payload: Joi.object({
                    topic_id: Joi.number().integer().min(1).required(),
                    name: Joi.string().token().min(1).max(100).required(),
                    start_date: Joi.string().isoDate().required(),
                    end_date: Joi.string().isoDate().required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/password/reset",
        handler: passwordReset,
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string().min(1).max(30).required(),
                    new_password: Joi.string().min(8).max(30).required(),
                    auth_phrase: Joi.string().min(1).max(30).required(),
                })
            },
            auth: false
        }
    },
    {
        method: "POST",
        path: "/api/schedule/get",
        handler: scheduleGet,
        options: {
            validate: {
                payload: Joi.object({
                    date: Joi.date()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/topic/get",
        handler: topicGet,
        options: {
            validate: {
                payload: Joi.object({
                    topic_id: Joi.number().integer().min(1).required()
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/topic/setup",
        handler: topicSetup,
        options: {
            validate: {
                payload: Joi.object({
                    topic: Joi.string().min(1).max(100)
                })
            }
        }
    },
    {
        method: "POST",
        path: "/api/topics/get",
        handler: topicsGet,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            }
        }
    },
    {
        method: "POST",
        path: "/api/user/setup",
        handler: userAdd,
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string().min(1).max(30).required(),
                    password: Joi.string().min(8).max(30).required(),
                    name: Joi.string().min(1).max(50).required(),
                    auth_phrase: Joi.string().min(1).max(30).required(),
                    is_admin: Joi.boolean().required()
                })
            },
            auth: false
        }
    },
    {
        method: "POST",
        path: "/api/user/login",
        handler: userLogin,
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string().min(1).max(30).required(),
                    password: Joi.string().min(8).max(30).required()
                })
            },
            auth: false
        }
    },
    {
        method: "POST",
        path: "/api/user/logout",
        handler: userLogout,
        options: {
            validate: {
                payload: Joi.object().valid({}).required()
            }
        }
    }
];