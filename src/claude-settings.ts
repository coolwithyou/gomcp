import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export interface ClaudePermissions {
  allow: string[];
  deny: string[];
}

export interface ClaudeLocalSettings {
  permissions?: ClaudePermissions;
  enableAllProjectMcpServers?: boolean;
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];
}

const CLAUDE_DIR = '.claude';
const SETTINGS_FILE = 'settings.local.json';

/**
 * Get the path to the .claude directory
 */
function getClaudeDir(): string {
  return path.join(process.cwd(), CLAUDE_DIR);
}

/**
 * Get the path to the settings.local.json file
 */
function getSettingsPath(): string {
  return path.join(getClaudeDir(), SETTINGS_FILE);
}

/**
 * Ensure the .claude directory exists
 */
async function ensureClaudeDir(): Promise<void> {
  const claudeDir = getClaudeDir();
  try {
    await fs.access(claudeDir);
  } catch {
    await fs.mkdir(claudeDir, { recursive: true });
  }
}

/**
 * Read the Claude Code local settings
 */
export async function readClaudeSettings(): Promise<ClaudeLocalSettings | null> {
  try {
    const settingsPath = getSettingsPath();
    const content = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(content) as ClaudeLocalSettings;
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Write the Claude Code local settings
 */
export async function writeClaudeSettings(settings: ClaudeLocalSettings): Promise<void> {
  await ensureClaudeDir();
  const settingsPath = getSettingsPath();
  const content = JSON.stringify(settings, null, 2);
  await fs.writeFile(settingsPath, content, 'utf-8');
}

/**
 * Enable all project MCP servers
 */
export async function enableAllProjectServers(): Promise<void> {
  const settings = (await readClaudeSettings()) || {};
  settings.enableAllProjectMcpServers = true;

  // Remove conflicting settings
  delete settings.enabledMcpjsonServers;
  delete settings.disabledMcpjsonServers;

  await writeClaudeSettings(settings);
  console.log(chalk.green('✓ Enabled all project MCP servers'));
  console.log(chalk.gray('  All servers in .mcp.json will be automatically activated'));
}

/**
 * Enable specific project MCP servers
 */
export async function enableSpecificServers(serverIds: string[]): Promise<void> {
  const settings = (await readClaudeSettings()) || {};

  // If enableAllProjectMcpServers is true, we need to switch to specific mode
  if (settings.enableAllProjectMcpServers) {
    settings.enableAllProjectMcpServers = false;
  }

  // Initialize or update enabledMcpjsonServers
  if (!settings.enabledMcpjsonServers) {
    settings.enabledMcpjsonServers = [];
  }

  // Add new servers (avoid duplicates)
  for (const serverId of serverIds) {
    if (!settings.enabledMcpjsonServers.includes(serverId)) {
      settings.enabledMcpjsonServers.push(serverId);
    }
  }

  // Remove from disabled list if present
  if (settings.disabledMcpjsonServers) {
    settings.disabledMcpjsonServers = settings.disabledMcpjsonServers.filter(
      (id) => !serverIds.includes(id)
    );
    if (settings.disabledMcpjsonServers.length === 0) {
      delete settings.disabledMcpjsonServers;
    }
  }

  await writeClaudeSettings(settings);
  console.log(chalk.green(`✓ Enabled ${serverIds.length} specific MCP server(s)`));
}

/**
 * Add permissions for MCP servers
 */
export async function addPermissions(permissions: string[]): Promise<void> {
  const settings = (await readClaudeSettings()) || {};

  // Initialize permissions if not exists
  if (!settings.permissions) {
    settings.permissions = { allow: [], deny: [] };
  }

  // Add new permissions (avoid duplicates)
  for (const permission of permissions) {
    if (!settings.permissions.allow.includes(permission)) {
      settings.permissions.allow.push(permission);
    }
  }

  await writeClaudeSettings(settings);
  console.log(chalk.green(`✓ Added ${permissions.length} permission(s)`));
}

/**
 * Remove permissions for MCP servers
 */
export async function removePermissions(permissions: string[]): Promise<void> {
  const settings = (await readClaudeSettings()) || {};

  if (!settings.permissions) {
    return;
  }

  // Remove permissions
  settings.permissions.allow = settings.permissions.allow.filter((p) => !permissions.includes(p));

  await writeClaudeSettings(settings);
  console.log(chalk.green(`✓ Removed ${permissions.length} permission(s)`));
}

/**
 * Get the activation status for MCP servers
 */
export async function getActivationStatus(): Promise<{
  enableAllProjectMcpServers: boolean;
  enabledServers: string[];
  disabledServers: string[];
  permissions: string[];
}> {
  const settings = (await readClaudeSettings()) || {};

  return {
    enableAllProjectMcpServers: settings.enableAllProjectMcpServers || false,
    enabledServers: settings.enabledMcpjsonServers || [],
    disabledServers: settings.disabledMcpjsonServers || [],
    permissions: settings.permissions?.allow || [],
  };
}

/**
 * Check if a server is activated
 */
export async function isServerActivated(serverId: string): Promise<boolean> {
  const status = await getActivationStatus();

  // If all servers are enabled
  if (status.enableAllProjectMcpServers) {
    return !status.disabledServers.includes(serverId);
  }

  // Check if specifically enabled
  if (status.enabledServers.includes(serverId)) {
    return true;
  }

  // Check if has wildcard permission
  const wildcardPermission = `mcp__${serverId}__*`;
  if (status.permissions.includes(wildcardPermission)) {
    return true;
  }

  // Check if has any specific permission for this server
  const serverPermissionPrefix = `mcp__${serverId}__`;
  return status.permissions.some((p) => p.startsWith(serverPermissionPrefix));
}

/**
 * Disable specific project MCP servers
 */
export async function disableSpecificServers(serverIds: string[]): Promise<void> {
  const settings = (await readClaudeSettings()) || {};

  // Initialize or update disabledMcpjsonServers
  if (!settings.disabledMcpjsonServers) {
    settings.disabledMcpjsonServers = [];
  }

  // Add new servers to disabled list (avoid duplicates)
  for (const serverId of serverIds) {
    if (!settings.disabledMcpjsonServers.includes(serverId)) {
      settings.disabledMcpjsonServers.push(serverId);
    }
  }

  // Remove from enabled list if present
  if (settings.enabledMcpjsonServers) {
    settings.enabledMcpjsonServers = settings.enabledMcpjsonServers.filter(
      (id) => !serverIds.includes(id)
    );
    if (settings.enabledMcpjsonServers.length === 0) {
      delete settings.enabledMcpjsonServers;
    }
  }

  await writeClaudeSettings(settings);
  console.log(chalk.red(`✓ Disabled ${serverIds.length} MCP server(s)`));
}
