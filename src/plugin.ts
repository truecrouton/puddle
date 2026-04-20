import fs from 'fs';
import { MqttClient } from 'mqtt';
import path from 'path';

export interface PluginContext {
  logger: typeof console;
  mqttClient: MqttClient;
  version?: string;
}

export interface IPlugin {
  name: string;
  version: string;
  // Lifecycle hooks
  onLoad: (ctx: PluginContext) => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
}

export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();

  async loadFromDirectory(dirPath: string, context: PluginContext) {
    const fullPath = path.resolve(dirPath, 'index.ts');
    if (!fs.existsSync(fullPath)) {
      console.log('Could not find plugin');
      return;
    }

    // Dynamic import (works in ESM and CommonJS)
    const module = await import(fullPath);

    // Plugins should use 'export default' or 'export const plugin'
    const plugin: IPlugin = module.default || module.plugin;

    if (plugin && plugin.onLoad) {
      console.log(`Loading plugin: ${plugin.name}`);
      await plugin.onLoad(context);
      this.plugins.set(plugin.name, plugin);
    }

  }
}

export async function loadPlugins(pluginPath: string, pluginDirs: string[], context: PluginContext) {
  const manager = new PluginManager();

  for (const dir of pluginDirs) {
    const dirPath = path.resolve(pluginPath, dir);
    await manager.loadFromDirectory(dirPath, context);
  }
}