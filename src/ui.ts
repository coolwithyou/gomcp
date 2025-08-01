import inquirer, { Answers } from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { servers } from './servers.js';
import {
  installServers,
  backupConfig,
  backupUserConfig,
  backupProjectConfig,
  restoreConfig,
  restoreUserConfig,
  restoreProjectConfig,
  updateServers,
  verifyInstallations,
  listInstalledServers,
  removeServers,
} from './installer.js';
import { MCPServer, ConfigOption, ServerConfig, InstallScope } from './types.js';
import * as os from 'os';
import * as path from 'path';
import { promptWithEscape, checkboxPromptWithEscape } from './utils/prompt.js';
import { getProjectServers } from './mcp-config.js';
import {
  displayActivationStatus,
  getProjectServersActivationStatus,
  activateServers,
  deactivateServers,
  hasClaudeSettings,
  initializeClaudeSettings,
} from './activation.js';
import { getActivationStatus } from './claude-settings.js';

// Cache for installed servers to avoid repeated expensive calls
interface ServerCache {
  data: { user: Set<string>; project: Set<string> };
  timestamp: number;
}

let installedServersCache: ServerCache | null = null;
const CACHE_TTL = 30000; // 30 seconds cache

// Clear cache when servers are modified
function clearInstalledServersCache() {
  installedServersCache = null;
}

export async function mainMenu(defaultScope: InstallScope = 'user', mode?: string) {
  // If mode is 'remove', go directly to remove flow
  if (mode === 'remove') {
    await removeFlow(defaultScope);
    return;
  }

  const result = await promptWithEscape<{ action: string }>(
    [
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '📦 Install new servers', value: 'install' },
          { name: '📋 List installed servers', value: 'list' },
          { name: '🗑️  Remove servers', value: 'remove' },
          { name: '🔄 Update existing servers', value: 'update' },
          { name: '✅ Verify installations', value: 'verify' },
          { name: '🔌 Manage MCP activation', value: 'activation' },
          { name: '📊 Check activation status', value: 'status' },
          { name: '💾 Backup current configuration', value: 'backup' },
          { name: '📂 Restore from backup', value: 'restore' },
          { name: '❌ Exit', value: 'exit' },
        ],
      },
    ],
    { showEscapeHint: false }
  ); // Don't show escape hint on main menu

  if (!result) {
    // This shouldn't happen on main menu, but handle it
    console.log(chalk.gray('\nGoodbye! 👋\n'));
    process.exit(0);
  }

  const { action } = result;

  switch (action) {
    case 'install':
      await installFlow(defaultScope);
      break;
    case 'list':
      await listInstalledServers('all');
      break;
    case 'remove':
      await removeFlow(defaultScope);
      break;
    case 'update':
      await updateServers();
      break;
    case 'verify':
      await verifyInstallations();
      break;
    case 'activation':
      await activationManagementFlow();
      break;
    case 'status':
      await displayActivationStatus();
      break;
    case 'backup':
      await backupFlow();
      break;
    case 'restore':
      await restoreFlow();
      break;
    case 'exit':
      console.log(chalk.gray('\nGoodbye! 👋\n'));
      process.exit(0);
  }

  // Return to main menu after action
  if (action !== 'exit') {
    console.log(''); // Add spacing
    await mainMenu(defaultScope);
  }
}

async function getInstalledServersByScope(): Promise<{ user: Set<string>; project: Set<string> }> {
  // Check cache first
  if (installedServersCache && Date.now() - installedServersCache.timestamp < CACHE_TTL) {
    return installedServersCache.data;
  }

  const spinner = ora('Checking installed MCP servers...').start();

  const userServers = new Set<string>();
  const projectServers = new Set<string>();

  // Get project servers using our mcp-config module
  try {
    const projectServerIds = await getProjectServers();
    projectServerIds.forEach((id) => projectServers.add(id));
  } catch (error) {
    // No project config or error reading it
  }

  // Then get all servers from claude mcp list
  try {
    spinner.text = 'Connecting to MCP servers (this may take a moment)...';
    const { execa } = await import('execa');
    const { stdout } = await execa('claude', ['mcp', 'list']);

    if (stdout && stdout.includes(':')) {
      // Parse the output to extract server IDs
      const lines = stdout.split('\n');

      for (const line of lines) {
        // Parse server lines like "github: npx -y @modelcontextprotocol/server-github - ✓ Connected"
        const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
        if (match) {
          const serverId = match[1];
          // If it's not in project servers, it must be a user-level server
          if (!projectServers.has(serverId)) {
            userServers.add(serverId);
          }
        }
      }
    }

    spinner.succeed('Found installed servers');
  } catch (error) {
    spinner.warn('Could not connect to Claude MCP (using local config only)');
    // If claude mcp list fails, servers remain empty
  }

  // Cache the result
  const result = { user: userServers, project: projectServers };
  installedServersCache = {
    data: result,
    timestamp: Date.now(),
  };

  return result;
}

async function installFlow(defaultScope: InstallScope = 'user') {
  // Ask for installation scope first
  const scopeResult = await promptWithEscape([
    {
      type: 'list',
      name: 'scope',
      message: 'Installation scope:',
      choices: [
        { name: '🌍 User (Available in all projects)', value: 'user' },
        { name: '📁 Project (Current project only)', value: 'project' },
      ],
      default: defaultScope,
    },
  ]);

  if (!scopeResult) {
    // User pressed ESC, go back to main menu
    return;
  }

  const { scope } = scopeResult;

  // Get already installed servers by scope
  const installedServers = await getInstalledServersByScope();

  // Server selection with categories
  const choices = [];
  const categories = [...new Set(servers.map((s) => s.category))];

  for (const category of categories) {
    choices.push(new inquirer.Separator(chalk.yellow(`=== ${category.toUpperCase()} ===`)));

    const categoryServers = servers.filter((s) => s.category === category);
    for (const server of categoryServers) {
      const icon = getServerIcon(server.id);
      const isInstalledInSelectedScope =
        scope === 'user'
          ? installedServers.user.has(server.id)
          : installedServers.project.has(server.id);
      const isInstalledInOtherScope =
        scope === 'user'
          ? installedServers.project.has(server.id)
          : installedServers.user.has(server.id);

      if (isInstalledInSelectedScope) {
        // Already installed in the selected scope - disable it
        choices.push({
          name: chalk.gray(`${icon} ${server.name} (Already installed in ${scope})`),
          value: server.id,
          disabled: true,
        });
      } else {
        const recommended = server.recommended ? chalk.green(' (Recommended)') : '';
        const requiresConfig = server.requiresConfig ? chalk.gray(' - requires config') : '';
        const otherScopeNote = isInstalledInOtherScope
          ? chalk.blue(` (installed in ${scope === 'user' ? 'project' : 'user'})`)
          : '';

        // Show project-only or scope preference indicators
        let scopeIndicator = '';
        if (server.forceProjectScope) {
          scopeIndicator = chalk.red(' 🔒 Project-only');
        } else if (server.preferredScope === 'project') {
          scopeIndicator = chalk.yellow(' 📁 Prefers project');
        } else if (server.preferredScope === 'user') {
          scopeIndicator = chalk.cyan(' 👤 Prefers user');
        }

        choices.push({
          name: `${icon} ${server.name}${recommended}${scopeIndicator}${requiresConfig}${otherScopeNote}`,
          value: server.id,
          checked: server.recommended && !isInstalledInOtherScope,
        });

        // Add detailed description if available
        if (server.detailedDescription && server.detailedDescription.length > 0) {
          server.detailedDescription.forEach((line) => {
            choices.push(new inquirer.Separator(chalk.gray(`   ${line}`)));
          });
          // Add spacing separator after description
          choices.push(new inquirer.Separator(' '));
        }
      }
    }
  }

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'selectedServers',
    message: 'Select MCP servers to install (use space to select, enter to confirm):',
    choices,
    pageSize: 20,
    // validate removed to allow back navigation
  });

  if (!selectionResult) {
    // User chose to go back
    return;
  }

  const { selectedServers } = selectionResult;

  // Check if any servers were selected (excluding the back option)
  if (!selectedServers || selectedServers.length === 0) {
    console.log(
      chalk.yellow('\nNo servers selected. Please select at least one server to install.')
    );
    // Re-run the installation flow
    return installFlow(defaultScope);
  }

  // Collect configurations for selected servers
  const configs: Map<string, ServerConfig> = new Map();

  for (const serverId of selectedServers) {
    const server = servers.find((s) => s.id === serverId);
    if (!server) continue;
    if (server.requiresConfig && server.configOptions) {
      console.log(chalk.cyan(`\n📝 Configure ${server.name}:`));
      const config = await collectServerConfig(server);
      configs.set(serverId, config);
    }
  }

  // Confirm installation
  console.log(chalk.bold('\n📋 Installation Summary:'));
  console.log(chalk.gray(`Scope: ${scope === 'user' ? 'User (Global)' : 'Project'}\n`));
  for (const serverId of selectedServers) {
    const server = servers.find((s) => s.id === serverId);
    if (!server) continue;
    const icon = getServerIcon(serverId);
    console.log(`  ${icon} ${server.name}`);
  }

  const confirmResult = await promptWithEscape([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with installation?',
      default: true,
    },
  ]);

  if (!confirmResult) {
    return; // Go back
  }

  const { confirm } = confirmResult;

  if (confirm) {
    await installServers(selectedServers, configs, scope as InstallScope, false);
    clearInstalledServersCache(); // Clear cache after installation
  } else {
    console.log(chalk.yellow('\nInstallation cancelled.'));
  }
}

async function collectServerConfig(server: MCPServer): Promise<ServerConfig> {
  const config: ServerConfig = {};

  for (const option of server.configOptions || []) {
    const answer = await promptForOption(option);
    config[option.key] = answer;
  }

  return config;
}

async function promptForOption(option: ConfigOption): Promise<any> {
  const basePrompt: any = {
    name: 'value',
    message: option.label,
    default: option.default,
  };

  if (option.description) {
    basePrompt.message += chalk.gray(` (${option.description})`);
  }

  switch (option.type) {
    case 'password':
      basePrompt.type = 'password';
      basePrompt.mask = '*';
      break;

    case 'paths':
      const _defaultPaths = option.default || [
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'Projects'),
      ];

      const pathsResult = await checkboxPromptWithEscape({
        type: 'checkbox',
        name: 'paths',
        message: option.label,
        choices: [
          { name: '~/Documents', value: path.join(os.homedir(), 'Documents'), checked: true },
          { name: '~/Projects', value: path.join(os.homedir(), 'Projects'), checked: true },
          { name: '~/Desktop', value: path.join(os.homedir(), 'Desktop') },
          { name: '~/Downloads', value: path.join(os.homedir(), 'Downloads') },
          { name: 'Current directory', value: process.cwd() },
          { name: 'Custom path...', value: 'custom' },
        ],
      });

      if (!pathsResult) {
        // If user cancels path selection, return empty array
        return [];
      }

      const { paths } = pathsResult;
      const finalPaths = [...paths];
      if (paths.includes('custom')) {
        const customResult = await promptWithEscape([
          {
            type: 'input',
            name: 'customPath',
            message: 'Enter custom path:',
            validate: (input: any) => {
              try {
                return input.length > 0 || 'Path cannot be empty';
              } catch (error) {
                console.error(chalk.red('Path validation error:'), error);
                return 'Validation failed. Please try again.';
              }
            },
          },
        ]);

        if (!customResult) {
          // Remove 'custom' from the array if user cancels
          return finalPaths.filter((p) => p !== 'custom');
        }

        const { customPath } = customResult;
        finalPaths[finalPaths.indexOf('custom')] = customPath;
      }

      return finalPaths;

    case 'select':
      basePrompt.type = 'list';
      basePrompt.choices = option.choices;
      break;

    case 'boolean':
      basePrompt.type = 'confirm';
      break;

    default:
      basePrompt.type = 'input';
  }

  if (option.validate && typeof option.validate === 'function') {
    // Wrap validate function to ensure proper context and error handling
    basePrompt.validate = (input: string) => {
      try {
        // Call the original validate function with the input
        const validationResult = option.validate!(input);
        return validationResult;
      } catch (error) {
        console.error(chalk.red(`Validation error for ${option.key}:`), error);
        return 'Validation failed. Please try again.';
      }
    };
  }

  const result = await promptWithEscape<Answers>([basePrompt]);

  if (!result) {
    // If user cancels, return default value or empty string
    return option.default || '';
  }

  const { value } = result;
  return value;
}

async function backupFlow() {
  const result = await promptWithEscape([
    {
      type: 'list',
      name: 'backupType',
      message: 'What would you like to backup?',
      choices: [
        { name: '👤 User configuration only', value: 'user' },
        { name: '📁 Project configuration only', value: 'project' },
        { name: '💾 All configurations', value: 'all' },
      ],
    },
  ]);

  if (!result) {
    return; // Go back to main menu
  }

  const { backupType } = result;

  switch (backupType) {
    case 'user':
      await backupUserConfig();
      break;
    case 'project':
      await backupProjectConfig();
      break;
    case 'all':
      await backupConfig();
      break;
  }
}

async function restoreFlow() {
  const result = await promptWithEscape([
    {
      type: 'list',
      name: 'restoreType',
      message: 'What type of backup would you like to restore?',
      choices: [
        { name: '👤 User configuration backup', value: 'user' },
        { name: '📁 Project configuration backup', value: 'project' },
        { name: '💾 Full backup (auto-detect)', value: 'auto' },
      ],
    },
  ]);

  if (!result) {
    return; // Go back to main menu
  }

  const { restoreType } = result;

  let defaultPath = './mcp-backup.json';
  if (restoreType === 'user') {
    defaultPath = './mcp-user-backup.json';
  } else if (restoreType === 'project') {
    defaultPath = './mcp-project-backup.json';
  }

  const pathResult = await promptWithEscape([
    {
      type: 'input',
      name: 'backupPath',
      message: 'Enter backup file path:',
      default: defaultPath,
      validate: (input: any) => {
        try {
          return input.length > 0 || 'Path cannot be empty';
        } catch (error) {
          console.error(chalk.red('Backup path validation error:'), error);
          return 'Validation failed. Please try again.';
        }
      },
    },
  ]);

  if (!pathResult) {
    return; // Go back
  }

  const { backupPath } = pathResult;

  switch (restoreType) {
    case 'user':
      await restoreUserConfig(backupPath);
      break;
    case 'project':
      await restoreProjectConfig(backupPath);
      break;
    case 'auto':
      await restoreConfig(backupPath);
      break;
  }
}

async function removeFlow(_defaultScope: InstallScope = 'user') {
  // Show loading spinner while fetching installed servers
  const spinner = ora('Loading installed MCP servers...').start();

  // First get list of installed servers
  const installedServers: { id: string; name: string; scope: 'user' | 'project' }[] = [];

  // First, try to get all servers from claude mcp list
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('claude', ['mcp', 'list']);

    if (stdout && stdout.includes(':')) {
      // Parse the output to extract server IDs
      const lines = stdout.split('\n');
      const projectServerIds = new Set<string>();

      // Check project config to identify project-level servers
      try {
        const fs = await import('fs/promises');
        const projectConfigPath = path.join(process.cwd(), '.mcp.json');
        const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));

        if (projectConfig.mcpServers) {
          Object.keys(projectConfig.mcpServers).forEach((id) => projectServerIds.add(id));
        }
      } catch (error) {
        // No project config
      }

      for (const line of lines) {
        // Parse server lines like "github: npx -y @modelcontextprotocol/server-github - ✓ Connected"
        const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
        if (match) {
          const serverId = match[1];
          const server = servers.find((s) => s.id === serverId);
          const scope = projectServerIds.has(serverId) ? 'project' : 'user';

          installedServers.push({
            id: serverId,
            name: server ? server.name : serverId,
            scope: scope,
          });
        }
      }
    }
  } catch (error) {
    // If claude mcp list fails, fall back to checking config files

    // Check project config
    try {
      const fs = await import('fs/promises');
      const projectConfigPath = path.join(process.cwd(), '.mcp.json');
      const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));

      if (projectConfig.mcpServers) {
        for (const serverId of Object.keys(projectConfig.mcpServers)) {
          const server = servers.find((s) => s.id === serverId);
          installedServers.push({
            id: serverId,
            name: server ? server.name : serverId,
            scope: 'project',
          });
        }
      }
    } catch (error) {
      // No project config
    }
  }

  // Stop spinner before showing results
  spinner.stop();

  if (installedServers.length === 0) {
    console.log(chalk.yellow('\nNo MCP servers installed.'));
    return;
  }

  // Show servers to remove
  const choices = installedServers.map((server) => ({
    name: `${getServerIcon(server.id)} ${server.name} (${server.scope})`,
    value: { id: server.id, scope: server.scope },
  }));

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'selectedServers',
    message: 'Select MCP servers to remove:',
    choices,
    // validate removed - empty selection is handled after prompt
  });

  if (!selectionResult) {
    return; // Go back
  }

  const { selectedServers } = selectionResult;

  if (selectedServers.length === 0) {
    console.log(chalk.yellow('\nNo servers selected for removal.'));
    return;
  }

  // Confirm removal
  const confirmResult = await promptWithEscape([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove ${selectedServers.length} server(s)?`,
      default: false,
    },
  ]);

  if (!confirmResult) {
    return; // Go back
  }

  const { confirm } = confirmResult;

  if (!confirm) {
    console.log(chalk.yellow('\nRemoval cancelled.'));
    return;
  }

  // Group by scope for removal
  const userServers = selectedServers.filter((s: any) => s.scope === 'user').map((s: any) => s.id);
  const projectServers = selectedServers
    .filter((s: any) => s.scope === 'project')
    .map((s: any) => s.id);

  if (userServers.length > 0) {
    await removeServers(userServers, 'user');
  }

  if (projectServers.length > 0) {
    await removeServers(projectServers, 'project');
  }

  clearInstalledServersCache(); // Clear cache after removal
}

function getServerIcon(serverId: string): string {
  const icons: Record<string, string> = {
    github: '🐙',
    filesystem: '📁',
    'sequential-thinking': '🧠',
    postgresql: '🐘',
    puppeteer: '🌐',
    docker: '🐳',
    slack: '💬',
    notion: '📝',
    memory: '💾',
    jupyter: '📊',
    duckduckgo: '🦆',
    zapier: '⚡',
    stripe: '💳',
    discord: '🎮',
    email: '📧',
    figma: '🎨',
    supabase: '⚡',
    'brave-search': '🦁',
    gsuite: '📋',
    excel: '📈',
    context7: '📚',
    sourcegraph: '🔍',
    scipy: '🔬',
    serena: '🤖',
    playwright: '🎭',
    'browser-tools': '🔧',
    chrome: '🌏',
    youtube: '📺',
  };

  return icons[serverId] || '📦';
}

async function activationManagementFlow() {
  // Check if Claude settings exist
  const hasSettings = await hasClaudeSettings();
  if (!hasSettings) {
    const createResult = await promptWithEscape([
      {
        type: 'confirm',
        name: 'create',
        message: 'Claude Code settings not found. Create default settings?',
        default: true,
      },
    ]);

    if (!createResult || !createResult.create) {
      return;
    }

    await initializeClaudeSettings();
  }

  // Get current status
  const status = await getActivationStatus();
  const serverStatuses = await getProjectServersActivationStatus();

  if (serverStatuses.length === 0) {
    console.log(chalk.yellow('\nNo MCP servers installed in this project.'));
    console.log(chalk.gray('Install servers first using the "Install new servers" option.'));
    return;
  }

  // Show current status
  console.log(chalk.bold('\n📊 Current Activation Status:\n'));
  console.log(
    `All project servers enabled: ${
      status.enableAllProjectMcpServers ? chalk.green('✓ Yes') : chalk.red('✗ No')
    }`
  );

  // Show activation strategy options
  const strategyResult = await promptWithEscape([
    {
      type: 'list',
      name: 'strategy',
      message: 'Choose activation strategy:',
      choices: [
        {
          name: '🌍 Enable all project servers (Recommended)',
          value: 'all',
          disabled: status.enableAllProjectMcpServers ? 'Already enabled' : false,
        },
        { name: '📦 Select specific servers to enable', value: 'specific' },
        { name: '🔑 Manage server permissions', value: 'permissions' },
        { name: '🗑️  Deactivate servers', value: 'deactivate' },
        { name: '← Back', value: 'back' },
      ],
    },
  ]);

  if (!strategyResult || strategyResult.strategy === 'back') {
    return;
  }

  const { strategy } = strategyResult;

  switch (strategy) {
    case 'all':
      await activateServers([], 'all');
      console.log(chalk.green('\n✓ All project MCP servers are now activated!'));
      console.log(chalk.gray('Restart Claude Code for changes to take effect.'));
      break;

    case 'specific':
      await specificServerActivationFlow(serverStatuses);
      break;

    case 'permissions':
      await permissionsManagementFlow(serverStatuses);
      break;

    case 'deactivate':
      await deactivationFlow(serverStatuses);
      break;
  }
}

async function specificServerActivationFlow(serverStatuses: any[]) {
  const inactiveServers = serverStatuses.filter((s) => !s.isActivated);

  if (inactiveServers.length === 0) {
    console.log(chalk.yellow('\nAll servers are already activated.'));
    return;
  }

  const choices = inactiveServers.map((server) => ({
    name: `${getServerIcon(server.id)} ${server.name}`,
    value: server.id,
  }));

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'servers',
    message: 'Select servers to activate:',
    choices,
  });

  if (!selectionResult || selectionResult.servers.length === 0) {
    return;
  }

  await activateServers(selectionResult.servers, 'specific');
  console.log(chalk.green('\n✓ Selected servers activated!'));
  console.log(chalk.gray('Restart Claude Code for changes to take effect.'));
}

async function permissionsManagementFlow(serverStatuses: any[]) {
  const actionResult = await promptWithEscape([
    {
      type: 'list',
      name: 'action',
      message: 'Permission management:',
      choices: [
        { name: '➕ Add wildcard permissions for servers', value: 'add' },
        { name: '➖ Remove server permissions', value: 'remove' },
        { name: '👁️  View current permissions', value: 'view' },
        { name: '← Back', value: 'back' },
      ],
    },
  ]);

  if (!actionResult || actionResult.action === 'back') {
    return;
  }

  const { action } = actionResult;
  const status = await getActivationStatus();

  switch (action) {
    case 'add':
      const serversWithoutWildcard = serverStatuses.filter(
        (s) => !status.permissions.includes(`mcp__${s.id}__*`)
      );

      if (serversWithoutWildcard.length === 0) {
        console.log(chalk.yellow('\nAll servers already have wildcard permissions.'));
        return;
      }

      const addChoices = serversWithoutWildcard.map((server) => ({
        name: `${getServerIcon(server.id)} ${server.name}`,
        value: server.id,
      }));

      const addResult = await checkboxPromptWithEscape({
        type: 'checkbox',
        name: 'servers',
        message: 'Select servers to add wildcard permissions:',
        choices: addChoices,
      });

      if (addResult && addResult.servers.length > 0) {
        await activateServers(addResult.servers, 'permission');
        console.log(chalk.green('\n✓ Wildcard permissions added!'));
        console.log(chalk.gray('Restart Claude Code for changes to take effect.'));
      }
      break;

    case 'remove':
      const serverPermissions = status.permissions.filter((p) => p.startsWith('mcp__'));

      if (serverPermissions.length === 0) {
        console.log(chalk.yellow('\nNo server permissions to remove.'));
        return;
      }

      const removeChoices = serverPermissions.map((permission) => ({
        name: permission,
        value: permission,
      }));

      const removeResult = await checkboxPromptWithEscape({
        type: 'checkbox',
        name: 'permissions',
        message: 'Select permissions to remove:',
        choices: removeChoices,
      });

      if (removeResult && removeResult.permissions.length > 0) {
        const { removePermissions } = await import('./claude-settings.js');
        await removePermissions(removeResult.permissions);
        console.log(chalk.green('\n✓ Permissions removed!'));
        console.log(chalk.gray('Restart Claude Code for changes to take effect.'));
      }
      break;

    case 'view':
      console.log(chalk.bold('\n🔑 Current Server Permissions:\n'));
      const currentServerPermissions = status.permissions.filter((p) => p.startsWith('mcp__'));

      if (currentServerPermissions.length === 0) {
        console.log(chalk.gray('No server permissions configured.'));
      } else {
        for (const permission of currentServerPermissions) {
          console.log(`  ${chalk.cyan(permission)}`);
        }
      }
      break;
  }
}

async function deactivationFlow(serverStatuses: any[]) {
  const activeServers = serverStatuses.filter((s) => s.isActivated);

  if (activeServers.length === 0) {
    console.log(chalk.yellow('\nNo servers are currently activated.'));
    return;
  }

  const choices = activeServers.map((server) => ({
    name: `${getServerIcon(server.id)} ${server.name} (${server.activationType})`,
    value: server.id,
  }));

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'servers',
    message: 'Select servers to deactivate:',
    choices,
  });

  if (!selectionResult || selectionResult.servers.length === 0) {
    return;
  }

  const confirmResult = await promptWithEscape([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Deactivate ${selectionResult.servers.length} server(s)?`,
      default: false,
    },
  ]);

  if (!confirmResult || !confirmResult.confirm) {
    return;
  }

  await deactivateServers(selectionResult.servers);
  console.log(chalk.green('\n✓ Selected servers deactivated!'));
  console.log(chalk.gray('Restart Claude Code for changes to take effect.'));
}
