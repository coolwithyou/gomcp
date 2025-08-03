import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { MCPServer, ServerConfig } from './types.js';

export interface GomcpConfig {
  version: string;
  installedServers: InstalledServer[];
  presets: Record<string, string[]>;
  lastUpdated: string;
  language?: 'en' | 'ko' | 'zh' | 'es' | 'ja';
}

export interface InstalledServer {
  id: string;
  name: string;
  installedAt: string;
  config?: ServerConfig;
}

const CONFIG_DIR = path.join(process.env.HOME || '', '.gomcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function loadConfig(): Promise<GomcpConfig | null> {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as GomcpConfig;
  } catch (error) {
    return null;
  }
}

export async function saveConfig(config: GomcpConfig): Promise<void> {
  await ensureConfigDir();
  config.lastUpdated = new Date().toISOString();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function addInstalledServer(server: MCPServer, config?: ServerConfig): Promise<void> {
  const gomcpConfig = (await loadConfig()) || {
    version: '1.0.0',
    installedServers: [],
    presets: {},
    lastUpdated: new Date().toISOString(),
  };

  // Remove if already exists (for updates)
  gomcpConfig.installedServers = gomcpConfig.installedServers.filter((s) => s.id !== server.id);

  // Add new entry
  gomcpConfig.installedServers.push({
    id: server.id,
    name: server.name,
    installedAt: new Date().toISOString(),
    config,
  });

  await saveConfig(gomcpConfig);
}

export async function getInstalledServers(): Promise<InstalledServer[]> {
  const config = await loadConfig();
  return config?.installedServers || [];
}

export async function saveCustomPreset(name: string, serverIds: string[]): Promise<void> {
  const config = (await loadConfig()) || {
    version: '1.0.0',
    installedServers: [],
    presets: {},
    lastUpdated: new Date().toISOString(),
  };

  config.presets[name] = serverIds;
  await saveConfig(config);

  console.log(chalk.green(`✓ Saved custom preset '${name}'`));
}

export async function getCustomPresets(): Promise<Record<string, string[]>> {
  const config = await loadConfig();
  return config?.presets || {};
}

export async function exportConfig(outputPath: string): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    throw new Error('No configuration found to export');
  }

  await fs.writeFile(outputPath, JSON.stringify(config, null, 2));
  console.log(chalk.green(`✓ Configuration exported to ${outputPath}`));
}

export async function getLanguagePreference(): Promise<'en' | 'ko' | 'zh' | 'es' | 'ja'> {
  const config = await loadConfig();
  return config?.language || 'en';
}

export async function setLanguagePreference(language: 'en' | 'ko' | 'zh' | 'es' | 'ja'): Promise<void> {
  const config = (await loadConfig()) || {
    version: '1.0.0',
    installedServers: [],
    presets: {},
    lastUpdated: new Date().toISOString(),
  };

  config.language = language;
  await saveConfig(config);
}

export async function importConfig(inputPath: string): Promise<void> {
  const data = await fs.readFile(inputPath, 'utf-8');
  const config = JSON.parse(data) as GomcpConfig;

  // Validate config structure
  if (!config.version || !Array.isArray(config.installedServers)) {
    throw new Error('Invalid configuration file format');
  }

  await saveConfig(config);
  console.log(chalk.green('✓ Configuration imported successfully'));
}
