import dotenv from 'dotenv';
import * as mqtt from "mqtt";
import { init, start } from "./server";
import { cacheInit, storageInit, storeMessage } from "./storage";
import { startScheduler } from "./schedule";
import { gracefulShutdown } from "node-schedule";
import { triggerTopicAutomations } from "./automation";
import { loadPlugins } from "./plugin";

const puddleInit = async () => {
    dotenv.config({ path: `${__dirname}/../puddle.env` });

    storageInit({ fileMustExist: true });
    cacheInit();

    const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);
    process.env.BASE_TOPIC = process.env.BASE_TOPIC || 'zigbee2mqtt';

    process.on('SIGINT', function () {
        gracefulShutdown()
            .then(() => process.exit(0));
    });

    client.on('connect', function () {
        client.subscribe(`${process.env.BASE_TOPIC}/#`, function (err) {
            if (err) {
                console.error('Could not connect', err);
            }
        });
    });

    client.on('message', function (topic, message) {
        const messageString = message.toString();
        storeMessage(topic, messageString);
        triggerTopicAutomations(topic, messageString);
    });

    startScheduler();

    const pluginDirs = (process.env.PLUGINS || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    loadPlugins(`${__dirname}/../plugin/`, pluginDirs, { logger: console, mqttClient: client });

    init().then(() => start());
};

puddleInit();