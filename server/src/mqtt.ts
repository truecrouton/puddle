import * as mqtt from "mqtt";

export const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || '127.0.0.1'}`);
