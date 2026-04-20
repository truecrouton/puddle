import Wemo from "./wemo-client/index.js";
import { readFileSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { IPlugin, PluginContext } from "../../src/plugin";

const WemoPlugin: IPlugin = {
  name: 'WemoPlugin',
  version: '1.0.0',
  onLoad: (ctx: PluginContext) => {
    ctx.logger.log(`[${WemoPlugin.name}] initialized on version ${ctx.version}`);

    const wemo = new Wemo();
    let devices: Record<string, any>[];

    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      const devicesFile = readFileSync(`${__dirname}/devices.json`, 'utf-8');
      devices = JSON.parse(devicesFile);
    } catch (error) {
      ctx.logger.error("Failed to read devices.json:", error);
      return;
    }

    if (!devices?.length) {
      ctx.logger.error('No devices in devices.json');
      return;
    }

    const wemoDevices = devices.map((device) => {
      device.client = {};

      wemo.load(device.setupUrl).then((deviceInfo) => {
        ctx.logger.log("Wemo Device Found: %s (%s)", deviceInfo.friendlyName, device.topic);

        device.client = wemo.client(deviceInfo);

        device.client.on("binaryState", (value: string) => {
          const message = { state: value === "1" ? device.valueOn : device.valueOff };
          ctx.mqttClient.publish(device.topic, JSON.stringify(message));
        });
      });
      return device;
    });

    ctx.mqttClient.on("message", function (topic, message) {
      const device = wemoDevices.find((wemo) => `${wemo.topic}/${wemo.setSuffix}` === topic);

      if (device) {
        const parsed = JSON.parse(message.toString());
        device.client.setBinaryState(parsed.state === device.valueOn ? 1 : 0);
      }
    });
  }
};

export default WemoPlugin;