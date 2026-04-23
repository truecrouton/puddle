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

  async importPlugin(path: string) {
    let mod = await import(path);

    // Plugins should use 'export default' or 'export const plugin'
    // Keep drilling down if the object has a 'default' property 
    // and we haven't reached a function or non-object yet
    while (mod && mod.default && typeof mod.default === 'object' && 'default' in mod.default) {
      mod = mod.default;
    }

    // Final check: return the top-level default if it exists, otherwise the module
    return mod.default || mod;
  }

  async loadFromDirectory(dirPath: string, context: PluginContext) {
    const fullPath = path.join(dirPath, 'index.js');

    try {
      // Dynamic import (works in ESM and CommonJS)
      const plugin = await this.importPlugin(fullPath);

      if (plugin && plugin.onLoad) {
        console.log(`Loading plugin: ${plugin.name}`);
        await plugin.onLoad(context);
        this.plugins.set(plugin.name, plugin);
      }
    }
    catch (error) {
      console.error(`❌ Failed to initialize plugin at ${fullPath}:`, error);
      return;
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