import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
const CLAUDE_DIR = '.claude';
const SETTINGS_FILE = 'settings.local.json';
function getClaudeDir() {
    return path.join(process.cwd(), CLAUDE_DIR);
}
function getSettingsPath() {
    return path.join(getClaudeDir(), SETTINGS_FILE);
}
async function ensureClaudeDir() {
    const claudeDir = getClaudeDir();
    try {
        await fs.access(claudeDir);
    }
    catch {
        await fs.mkdir(claudeDir, { recursive: true });
    }
}
export async function readClaudeSettings() {
    try {
        const settingsPath = getSettingsPath();
        const content = await fs.readFile(settingsPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return null;
    }
}
export async function writeClaudeSettings(settings) {
    await ensureClaudeDir();
    const settingsPath = getSettingsPath();
    const content = JSON.stringify(settings, null, 2);
    await fs.writeFile(settingsPath, content, 'utf-8');
}
export async function enableAllProjectServers() {
    const settings = (await readClaudeSettings()) || {};
    settings.enableAllProjectMcpServers = true;
    delete settings.enabledMcpjsonServers;
    delete settings.disabledMcpjsonServers;
    await writeClaudeSettings(settings);
    console.log(chalk.green('✓ Enabled all project MCP servers'));
    console.log(chalk.gray('  All servers in .mcp.json will be automatically activated'));
}
export async function enableSpecificServers(serverIds) {
    const settings = (await readClaudeSettings()) || {};
    if (settings.enableAllProjectMcpServers) {
        settings.enableAllProjectMcpServers = false;
    }
    if (!settings.enabledMcpjsonServers) {
        settings.enabledMcpjsonServers = [];
    }
    for (const serverId of serverIds) {
        if (!settings.enabledMcpjsonServers.includes(serverId)) {
            settings.enabledMcpjsonServers.push(serverId);
        }
    }
    if (settings.disabledMcpjsonServers) {
        settings.disabledMcpjsonServers = settings.disabledMcpjsonServers.filter((id) => !serverIds.includes(id));
        if (settings.disabledMcpjsonServers.length === 0) {
            delete settings.disabledMcpjsonServers;
        }
    }
    await writeClaudeSettings(settings);
    console.log(chalk.green(`✓ Enabled ${serverIds.length} specific MCP server(s)`));
}
export async function addPermissions(permissions) {
    const settings = (await readClaudeSettings()) || {};
    if (!settings.permissions) {
        settings.permissions = { allow: [], deny: [] };
    }
    for (const permission of permissions) {
        if (!settings.permissions.allow.includes(permission)) {
            settings.permissions.allow.push(permission);
        }
    }
    await writeClaudeSettings(settings);
    console.log(chalk.green(`✓ Added ${permissions.length} permission(s)`));
}
export async function removePermissions(permissions) {
    const settings = (await readClaudeSettings()) || {};
    if (!settings.permissions) {
        return;
    }
    settings.permissions.allow = settings.permissions.allow.filter((p) => !permissions.includes(p));
    await writeClaudeSettings(settings);
    console.log(chalk.green(`✓ Removed ${permissions.length} permission(s)`));
}
export async function getActivationStatus() {
    const settings = (await readClaudeSettings()) || {};
    return {
        enableAllProjectMcpServers: settings.enableAllProjectMcpServers || false,
        enabledServers: settings.enabledMcpjsonServers || [],
        disabledServers: settings.disabledMcpjsonServers || [],
        permissions: settings.permissions?.allow || [],
    };
}
export async function isServerActivated(serverId) {
    const status = await getActivationStatus();
    if (status.enableAllProjectMcpServers) {
        return !status.disabledServers.includes(serverId);
    }
    if (status.enabledServers.includes(serverId)) {
        return true;
    }
    const wildcardPermission = `mcp__${serverId}__*`;
    if (status.permissions.includes(wildcardPermission)) {
        return true;
    }
    const serverPermissionPrefix = `mcp__${serverId}__`;
    return status.permissions.some((p) => p.startsWith(serverPermissionPrefix));
}
export async function disableSpecificServers(serverIds) {
    const settings = (await readClaudeSettings()) || {};
    if (!settings.disabledMcpjsonServers) {
        settings.disabledMcpjsonServers = [];
    }
    for (const serverId of serverIds) {
        if (!settings.disabledMcpjsonServers.includes(serverId)) {
            settings.disabledMcpjsonServers.push(serverId);
        }
    }
    if (settings.enabledMcpjsonServers) {
        settings.enabledMcpjsonServers = settings.enabledMcpjsonServers.filter((id) => !serverIds.includes(id));
        if (settings.enabledMcpjsonServers.length === 0) {
            delete settings.enabledMcpjsonServers;
        }
    }
    await writeClaudeSettings(settings);
    console.log(chalk.red(`✓ Disabled ${serverIds.length} MCP server(s)`));
}
//# sourceMappingURL=claude-settings.js.map