import chalk from 'chalk';
import ora from 'ora';
import { getProjectServers } from './mcp-config.js';
import {
  readClaudeSettings,
  isServerActivated,
  getActivationStatus,
  enableAllProjectServers,
  enableSpecificServers,
  disableSpecificServers,
  addPermissions,
  removePermissions,
} from './claude-settings.js';
import { servers } from './servers.js';

export interface ServerActivationStatus {
  id: string;
  name: string;
  isInstalled: boolean;
  isActivated: boolean;
  activationType?: 'all' | 'specific' | 'permission' | 'none';
}

/**
 * Get activation status for all project servers
 */
export async function getProjectServersActivationStatus(): Promise<ServerActivationStatus[]> {
  const spinner = ora('Checking server activation status...').start();

  try {
    // Get installed project servers
    const projectServerIds = await getProjectServers();
    const activationStatus = await getActivationStatus();

    const statuses: ServerActivationStatus[] = [];

    for (const serverId of projectServerIds) {
      const server = servers.find((s) => s.id === serverId);
      const isActivated = await isServerActivated(serverId);

      let activationType: ServerActivationStatus['activationType'] = 'none';

      if (isActivated) {
        if (activationStatus.enableAllProjectMcpServers) {
          activationType = 'all';
        } else if (activationStatus.enabledServers.includes(serverId)) {
          activationType = 'specific';
        } else if (
          activationStatus.permissions.some(
            (p) => p.startsWith(`mcp__${serverId}__`) || p === `mcp__${serverId}__*`
          )
        ) {
          activationType = 'permission';
        }
      }

      statuses.push({
        id: serverId,
        name: server?.name || serverId,
        isInstalled: true,
        isActivated,
        activationType,
      });
    }

    spinner.succeed('Server activation status checked');
    return statuses;
  } catch (error) {
    spinner.fail('Failed to check activation status');
    throw error;
  }
}

/**
 * Display activation status summary
 */
export async function displayActivationStatus(): Promise<void> {
  console.log(chalk.bold('\n📊 MCP Server Activation Status\n'));

  await readClaudeSettings();
  const status = await getActivationStatus();
  const serverStatuses = await getProjectServersActivationStatus();

  // Display global settings
  console.log(chalk.yellow('Global Settings:'));
  console.log(
    `  Enable all project servers: ${
      status.enableAllProjectMcpServers ? chalk.green('✓ Yes') : chalk.red('✗ No')
    }`
  );

  if (status.enabledServers.length > 0) {
    console.log(`  Specifically enabled servers: ${chalk.cyan(status.enabledServers.join(', '))}`);
  }

  if (status.disabledServers.length > 0) {
    console.log(`  Disabled servers: ${chalk.red(status.disabledServers.join(', '))}`);
  }

  // Display project servers
  console.log(chalk.yellow('\nProject Servers (.mcp.json):'));

  if (serverStatuses.length === 0) {
    console.log(chalk.gray('  No servers installed in project'));
  } else {
    for (const server of serverStatuses) {
      const icon = server.isActivated ? '✓' : '✗';
      const color = server.isActivated ? chalk.green : chalk.red;
      const typeInfo =
        server.activationType !== 'none' ? chalk.gray(` (${server.activationType})`) : '';

      console.log(`  ${color(icon)} ${server.name}${typeInfo}`);
    }
  }

  // Display permissions
  const serverPermissions = status.permissions.filter((p) => p.startsWith('mcp__'));
  if (serverPermissions.length > 0) {
    console.log(chalk.yellow('\nServer Permissions:'));
    for (const permission of serverPermissions) {
      console.log(`  ${chalk.cyan(permission)}`);
    }
  }

  // Display recommendations
  if (serverStatuses.some((s) => !s.isActivated)) {
    console.log(chalk.gray('\n💡 Tip: Use "Manage MCP activation" to activate servers'));
  }
}

/**
 * Activate servers with different strategies
 */
export async function activateServers(
  serverIds: string[],
  strategy: 'all' | 'specific' | 'permission'
): Promise<void> {
  const spinner = ora('Activating servers...').start();

  try {
    switch (strategy) {
      case 'all':
        await enableAllProjectServers();
        spinner.succeed('Enabled all project MCP servers');
        break;

      case 'specific':
        await enableSpecificServers(serverIds);
        spinner.succeed(`Enabled ${serverIds.length} specific server(s)`);
        break;

      case 'permission': {
        const permissions = serverIds.map((id) => `mcp__${id}__*`);
        await addPermissions(permissions);
        spinner.succeed(`Added wildcard permissions for ${serverIds.length} server(s)`);
        break;
      }
    }
  } catch (error) {
    spinner.fail('Failed to activate servers');
    throw error;
  }
}

/**
 * Deactivate servers
 */
export async function deactivateServers(serverIds: string[]): Promise<void> {
  const spinner = ora('Deactivating servers...').start();

  try {
    // Disable in enabledMcpjsonServers
    await disableSpecificServers(serverIds);

    // Remove permissions
    const permissions = [];
    const status = await getActivationStatus();

    for (const serverId of serverIds) {
      // Find all permissions for this server
      const serverPermissions = status.permissions.filter((p) =>
        p.startsWith(`mcp__${serverId}__`)
      );
      permissions.push(...serverPermissions);
    }

    if (permissions.length > 0) {
      await removePermissions(permissions);
    }

    spinner.succeed(`Deactivated ${serverIds.length} server(s)`);
  } catch (error) {
    spinner.fail('Failed to deactivate servers');
    throw error;
  }
}

/**
 * Check if Claude Code settings exist
 */
export async function hasClaudeSettings(): Promise<boolean> {
  const settings = await readClaudeSettings();
  return settings !== null;
}

/**
 * Initialize Claude Code settings if not exists
 */
export async function initializeClaudeSettings(): Promise<void> {
  const settings = await readClaudeSettings();

  if (!settings) {
    // Create default settings
    await enableAllProjectServers();
    console.log(chalk.green('✓ Created .claude/settings.local.json with default settings'));
  }
}
