import chalk from 'chalk';
import {
  createStepProgressBar,
  createIndeterminateProgressBar
} from './utils/progress.js';
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
import { t } from './i18n/index.js';

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
  const steps = [
    { name: 'Getting project servers', weight: 20 },
    { name: 'Fetching activation status', weight: 20 },
    { name: 'Checking server statuses', weight: 60 }
  ];

  const progressBar = createStepProgressBar({ steps });

  try {
    // Get installed project servers
    progressBar.nextStep();
    const projectServerIds = await getProjectServers();

    progressBar.nextStep();
    const activationStatus = await getActivationStatus();

    progressBar.nextStep();
    const statuses: ServerActivationStatus[] = [];
    const totalServers = projectServerIds.length;

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

      // Update progress within the current step
      if (totalServers > 0) {
        // For step progress bars, we don't update individual progress
        // The progress is managed by the step transitions
      }
    }

    progressBar.succeed('Server activation status checked');
    return statuses;
  } catch (error) {
    progressBar.fail('Failed to check activation status');
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
  const progressBar = createIndeterminateProgressBar({
    label: 'Activating servers...'
  });

  try {
    switch (strategy) {
      case 'all':
        await enableAllProjectServers();
        progressBar.succeed('Enabled all project MCP servers');
        break;

      case 'specific':
        await enableSpecificServers(serverIds);
        progressBar.succeed(`Enabled ${serverIds.length} specific server(s)`);
        break;

      case 'permission': {
        const permissions = serverIds.map((id) => `mcp__${id}__*`);
        await addPermissions(permissions);
        progressBar.succeed(`Added wildcard permissions for ${serverIds.length} server(s)`);
        break;
      }
    }
  } catch (error) {
    progressBar.fail('Failed to activate servers');
    throw error;
  }
}

/**
 * Deactivate servers
 */
export async function deactivateServers(serverIds: string[]): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Deactivating servers...'
  });

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

    progressBar.succeed(`Deactivated ${serverIds.length} server(s)`);
  } catch (error) {
    progressBar.fail('Failed to deactivate servers');
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
