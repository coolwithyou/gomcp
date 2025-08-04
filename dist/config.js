import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
const CONFIG_DIR = path.join(process.env.HOME || '', '.gomcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
export async function ensureConfigDir() {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    }
    catch (error) {
    }
}
export async function loadConfig() {
    try {
        await ensureConfigDir();
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        return null;
    }
}
export async function saveConfig(config) {
    await ensureConfigDir();
    config.lastUpdated = new Date().toISOString();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
export async function addInstalledServer(server, config) {
    const gomcpConfig = (await loadConfig()) || {
        version: '1.0.0',
        installedServers: [],
        presets: {},
        lastUpdated: new Date().toISOString(),
    };
    gomcpConfig.installedServers = gomcpConfig.installedServers.filter((s) => s.id !== server.id);
    gomcpConfig.installedServers.push({
        id: server.id,
        name: server.name,
        installedAt: new Date().toISOString(),
        config,
    });
    await saveConfig(gomcpConfig);
}
export async function getInstalledServers() {
    const config = await loadConfig();
    return config?.installedServers || [];
}
export async function saveCustomPreset(name, serverIds) {
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
export async function getCustomPresets() {
    const config = await loadConfig();
    return config?.presets || {};
}
export async function exportConfig(outputPath) {
    const config = await loadConfig();
    if (!config) {
        throw new Error('No configuration found to export');
    }
    await fs.writeFile(outputPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✓ Configuration exported to ${outputPath}`));
}
export async function getLanguagePreference() {
    const config = await loadConfig();
    return config?.language || 'en';
}
export async function setLanguagePreference(language) {
    const config = (await loadConfig()) || {
        version: '1.0.0',
        installedServers: [],
        presets: {},
        lastUpdated: new Date().toISOString(),
    };
    config.language = language;
    await saveConfig(config);
}
export async function importConfig(inputPath) {
    const data = await fs.readFile(inputPath, 'utf-8');
    const config = JSON.parse(data);
    if (!config.version || !Array.isArray(config.installedServers)) {
        throw new Error('Invalid configuration file format');
    }
    await saveConfig(config);
    console.log(chalk.green('✓ Configuration imported successfully'));
}
//# sourceMappingURL=config.js.map