import dotenv from 'dotenv';
import * as mqtt from "mqtt";
import { init, start } from "./server";
import { storageInit, storeMessage } from "./storage";
import { startScheduler } from "./schedule";
import { gracefulShutdown } from "node-schedule";
import { triggerTopicAutomations } from "./automation";

dotenv.config({ path: './puddle.env' });

storageInit({ fileMustExist: true });

const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);

process.on('SIGINT', function () {
    gracefulShutdown()
        .then(() => process.exit(0));
});

client.on('connect', function () {
    client.subscribe('zigbee2mqtt/#', function (err) {
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

init().then(() => start());
