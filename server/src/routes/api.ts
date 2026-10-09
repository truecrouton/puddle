import { Request, ResponseToolkit, ResponseObject, ServerRoute } from "@hapi/hapi";
import { badImplementation, badRequest } from "@hapi/boom";
import Joi from "joi";
import { connect } from "mqtt";
import dotenv from 'dotenv';
import { db, Automation, Pair, Topic, AutomationStep, DeviceStatusKey, User, sqliteDate, Chart, cacheGet, cachePairsGet } from "../storage";
import { dailySchedulerJob, scheduleSunAutomation, scheduleTimeAutomation } from "../schedule";
import { scheduledJobs } from "node-schedule";
import { parseISO } from "date-fns";
import { runAutomation } from "../automation";
import { celsiusToFahrenheit, hashPassword } from "../helper";
import { puddlePathRoot } from "../path-anchor";
import { randomBytes } from "crypto";
import { AutomationDeletePayloadSchema, AutomationExpressionSetupPayloadSchema, AutomationGetPayloadSchema, AutomationRunPayloadSchema, AutomationSetupPayloadSchema, AutomationsGetPayloadSchema } from "./schemas/automation.schema";
import { AutomationGetPayloadInterface, AutomationRunPayloadInterface, AutomationDeletePayloadInterface, AutomationExpressionSetupPayloadInterface, AutomationExpressionInterface, AutomationIdInterface, DeviceInterface } from './interfaces';
import { getTopicIds } from "../expressions";
import { DeviceGetPayloadSchema, DeviceSetPayloadSchema, DeviceSetupPayloadSchema, DevicesGetPayloadSchema, DeviceStatusGetPayloadSchema, DeviceStatusSetupPayloadSchema } from "./schemas/device.schema";

const mqtt = connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);

async function automationDelete(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { automation_id: automationId } = <AutomationDeletePayloadInterface>request.payload;

    db.transaction(() => {
        db.prepare('DELETE FROM automation_expressions WHERE automation_id=?').run(automationId);
        db.prepare('DELETE FROM automation_topics WHERE automation_id=?').run(automationId);
        db.prepare('DELETE FROM automations WHERE id=?').run(automationId);
    })();

    return h.response({});
}

async function automationGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    interface Expression extends AutomationExpressionInterface {
        automation_id: number,
        topic: string;
    }

    const payload = <AutomationGetPayloadInterface>request.payload;
    const automationId = payload.automation_id;
    const automation = <AutomationIdInterface>db.prepare('SELECT id, name, trigger, trigger_at, position, topic_id, trigger_key, trigger_value FROM automations WHERE id=?').get(automationId);

    if (!payload.with_details) return h.response(automation);

    const expressions = <Expression[]>db.prepare('SELECT automation_expressions.id, automation_expressions.kind, expression, is_else_step, automation_expressions.topic_id, topic, message, device_id, devices.name as device_name, state FROM automation_expressions LEFT JOIN topics on topics.id=automation_expressions.topic_id LEFT JOIN devices on devices.id=automation_expressions.device_id WHERE conditional_expression_id=0 AND automation_id=?').all(automationId);

    const conditionalExprsStmt = db.prepare('SELECT automation_expressions.id, automation_expressions.kind, is_else_step, automation_expressions.topic_id, topic, message, device_id, devices.name as device_name, state FROM automation_expressions LEFT JOIN topics on topics.id=automation_expressions.topic_id LEFT JOIN devices on devices.id=automation_expressions.device_id WHERE conditional_expression_id=? AND automation_id=?');

    const sequence = expressions.map((expr) => {
        const conditionalSteps = (<Expression[]>conditionalExprsStmt.all(expr.id, automationId)).map((cStep) => ({ ...cStep, is_else_step: Boolean(cStep.is_else_step) }));
        return { ...expr, is_else_step: Boolean(expr.is_else_step), nested_expressions: conditionalSteps };
    });

    return h.response({ ...automation, sequence });
}

async function automationsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const automations = db.prepare('SELECT id as automation_id, name, trigger FROM automations').all();

    return h.response({ automations });
}

async function automationRun(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { automation_id: automationId } = <AutomationRunPayloadInterface>request.payload;

    const automation = <Automation>db.prepare('SELECT trigger FROM automations WHERE trigger=\'user\' AND id=?').get(automationId);
    if (!automation) throw badRequest('Unable to run this automation');

    const executedSteps = await runAutomation(automationId);

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

async function automationExpressionSetup(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload = <AutomationExpressionSetupPayloadInterface>request.payload;
    let automationId = payload.automation_id;
    type Expression = AutomationExpressionSetupPayloadInterface['expressions'][number];

    const stepStmt = db.prepare('INSERT INTO automation_expressions (automation_id, kind, expression, conditional_expression_id, topic_id, message, device_id, state, is_else_step) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const topicStmt = db.prepare('INSERT INTO automation_topics (automation_id, topic_id) VALUES (?, ?)');

    function storeExpression(expression: Expression, automationId: number, parentExpressionId: number) {
        const isElseStep = expression.is_else_step ? 1 : 0;
        const stepRes = stepStmt.run(automationId, expression.kind, expression.expression, parentExpressionId, expression.topic_id, expression.message, expression.device_id, expression.state, isElseStep);

        const insertedStepId = <number>stepRes.lastInsertRowid;

        if (expression.kind == 'if' && typeof expression.expression == 'string') {
            try {
                const topicIds = getTopicIds(expression.expression);
                topicIds.forEach((topicId) => topicStmt.run(automationId, topicId));
            }
            catch (error: unknown) {
                if (error instanceof Error) {
                    throw badRequest(error.message);
                }
                else {
                    badRequest('An unexpected error occurred.');
                }
            }
        }

        if (expression.nested_expressions?.length && !parentExpressionId) expression.nested_expressions.forEach((nestedExpression: any) => storeExpression(nestedExpression, automationId, insertedStepId));

        return insertedStepId;
    }

    db.transaction(() => {
        db.prepare('DELETE FROM automation_expressions WHERE automation_id=?').run(automationId);
        db.prepare('DELETE FROM automation_topics WHERE automation_id=?').run(automationId);
        payload.expressions?.forEach((expr) => {
            storeExpression(expr, automationId, 0);
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
    const rootDevices = <DeviceInterface[]>db.prepare('SELECT id as device_id, topic_id, name, kind, set_key, state_key, value_on, value_off FROM devices WHERE kind IN (\'dimmable\', \'positionable\', \'toggleable\')').all();

    const middleDevices = ['dimmable', 'positionable'];

    const devices = rootDevices.map((d) => {
        const value = cacheGet(d.topic_id, d.state_key ?? '');

        let state: string = 'unknown';
        if (value == d.value_on) state = 'high';
        else if (value == d.value_off) state = 'low';
        else if (middleDevices.includes(d.kind) && !isNaN(Number(value))) state = 'middle';

        return { ...d, state };
    });

    const automations = db.prepare('SELECT id as automation_id, name, trigger FROM automations WHERE trigger=\'user\' and is_control_shown=1').all();

    return h.response({ controls: [...devices, ...automations] });
}

async function deviceGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const payload: any = request.payload;
    const deviceId = payload.device_id;
    const device = <DeviceInterface>db.prepare('SELECT id as device_id, topic_id, name, kind, set_key, set_suffix, state_key, value_on, value_off FROM devices WHERE id=?').get(payload.device_id);

    if (!device) return h.response({});

    const cachedPairs = cachePairsGet(device.topic_id);
    const allStatus = <DeviceStatusKey[]>db.prepare('SELECT id as status_key_id, status_key, name, is_shown FROM device_status_keys WHERE device_id=?').all(deviceId);

    const pairs = cachedPairs.reduce((pairs: { [key: string]: {}; }, p) => {
        p.pairId == 0 ? pairs[p.name] = { value: p.value } : pairs;
        return pairs;
    }, {});
    const status = allStatus.reduce((status: { [key: string]: {}; }, s) => {
        status[s.status_key] = s;
        return status;
    }, {});

    const keys = new Set([...cachedPairs.map((p) => p.name), ...allStatus.map((s) => s.status_key)]);
    const combinedStatus = [...keys].map((k) => ({
        ...pairs[k],
        ...status[k],
        status_key: k
    }));

    return h.response({ ...device, status: combinedStatus });
}

async function devicesGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const devices = <DeviceInterface[]>db.prepare('SELECT id as device_id, topic_id, name, kind, set_key FROM devices').all();

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

    const displayFarenheit = process.env.TEMPERATURE_CONVERT_TO === 'F';
    const states = charts.map((c) => {
        const value = cacheGet(c.topic_id, c.key);

        return {
            ...c,
            state: displayFarenheit && c.key === 'temperature' ? celsiusToFahrenheit(value) : value
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

    const pairs = <Pair[]>db.prepare('SELECT value, created_at FROM pairs where topic_id=? AND pair_id=0 AND is_object=0 AND name=? AND created_at>=? AND created_at<=?').all(topicId, name, utcStart, utcEnd);

    const displayFarenheit = name === 'temperature' && process.env.TEMPERATURE_CONVERT_TO === 'F';
    const convertedPairs = pairs.map((p) => displayFarenheit ? { ...p, value: celsiusToFahrenheit(p.value) } : p);

    return h.response({ pairs: convertedPairs });
}

async function passwordReset(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { username, new_password: newPassword, auth_phrase: authPhrase }: any = request.payload;

    const secret: any = {};
    dotenv.config({ path: `${puddlePathRoot}/../secret.env`, processEnv: secret });
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
    }], <{ name: string, runs_at: Date | null; }[]>[]);

    return h.response({ schedule });
}

async function topicGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const { topic_id: topicId }: any = request.payload;

    const topic = <Topic>db.prepare('SELECT id as topic_id, topic from topics where id=?').get(topicId);
    const cachedPairs = cachePairsGet(topicId);

    return h.response({ ...topic, status: cachedPairs.filter(p => p.pairId == 0) });
}

async function topicsGet(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
    const baseTopics = <Topic[]>db.prepare('SELECT id as topic_id, topic from topics').all();

    if (baseTopics.length === 0) return h.response([]);

    const deviceStmt = db.prepare('SELECT id as device_id, name, kind FROM devices where topic_id=?');
    const automationStmt = db.prepare('SELECT id as automation_id, name, trigger FROM automations WHERE trigger=\'topic\' AND topic_id=?');
    const expressionStmt = db.prepare('SELECT automation_id, name, trigger FROM automation_expressions LEFT JOIN automations on automations.id=automation_expressions.automation_id WHERE automation_expressions.topic_id=?');
    const conditionalStmt = db.prepare('SELECT automation_id, name, trigger FROM automation_topics LEFT JOIN automations ON automations.id=automation_topics.automation_id WHERE automation_topics.topic_id=?');
    const topics = baseTopics.map((t) => {
        const usedIn = new Map();
        expressionStmt.all(t.topic_id).forEach((e: any) => usedIn.set(e.automation_id, e));
        conditionalStmt.all(t.topic_id).forEach((c: any) => usedIn.set(c.automation_id, c));

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
    dotenv.config({ path: `${puddlePathRoot}/../secret.env`, processEnv: secret });
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
        options: {
            handler: automationDelete,
            validate: {
                payload: AutomationDeletePayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/get",
        options: {
            handler: automationGet,
            validate: {
                payload: AutomationGetPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/run",
        options: {
            handler: automationRun,
            validate: {
                payload: AutomationRunPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/setup",
        options: {
            handler: automationSetup,
            validate: {
                payload: AutomationSetupPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/automation/expressions/setup",
        options: {
            handler: automationExpressionSetup,
            validate: {
                payload: AutomationExpressionSetupPayloadSchema,
                failAction: (request, h, err) => {
                    // err.details will now contain an ARRAY of every failing field
                    console.error(err);
                    throw err;
                }
            }
        }
    },
    {
        method: "POST",
        path: "/api/automations/get",
        options: {
            handler: automationsGet,
            validate: {
                payload: AutomationsGetPayloadSchema
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
                payload: DeviceGetPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/set",
        handler: deviceSet,
        options: {
            validate: {
                payload: DeviceSetPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/setup",
        handler: deviceSetup,
        options: {
            validate: {
                payload: DeviceSetupPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/status/get",
        handler: deviceStatusGet,
        options: {
            validate: {
                payload: DeviceStatusGetPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/device/status/setup",
        handler: deviceStatusSetup,
        options: {
            validate: {
                payload: DeviceStatusSetupPayloadSchema
            }
        }
    },
    {
        method: "POST",
        path: "/api/devices/get",
        handler: devicesGet,
        options: {
            validate: {
                payload: DevicesGetPayloadSchema
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