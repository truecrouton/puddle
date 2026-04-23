/*
Puddle
Copyright 2026 Pin Tan

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

import dotenv from 'dotenv';
import * as mqtt from "mqtt";
import { init, start } from "./server";
import { cacheInit, storageInit, storeMessage } from "./storage";
import { startScheduler } from "./schedule";
import { gracefulShutdown } from "node-schedule";
import { triggerTopicAutomations } from "./automation";
import { loadPlugins } from "./plugin";
import { puddlePathRoot } from './path-anchor';

const puddleInit = async () => {
    dotenv.config({ path: `${puddlePathRoot}/../puddle.env` });

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

    const pluginDirs = (process.env.PLUGINS || 'wemo')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    loadPlugins(`${puddlePathRoot}/plugin/`, pluginDirs, { logger: console, mqttClient: client });

    init().then(() => start());
};

puddleInit();