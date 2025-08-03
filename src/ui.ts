import inquirer, { Answers } from 'inquirer';
import chalk from 'chalk';
import {
  createIndeterminateProgressBar
} from './utils/progress.js';
import { i18n, t, Language } from './i18n/index.js';
import { getLanguagePreference, setLanguagePreference } from './config.js';
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
  ServerActivationStatus,
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

export async function mainMenu(defaultScope: InstallScope = 'user', mode?: string, showDescriptions?: boolean) {
  // Initialize i18n if not already done
  if (!i18n.getCurrentLanguage()) {
    const savedLanguage = await getLanguagePreference();
    await i18n.initialize(savedLanguage);
  }

  // If mode is 'remove', go directly to remove flow
  if (mode === 'remove') {
    await removeFlow(defaultScope);
    return;
  }

  const currentLang = i18n.getCurrentLanguage();
  const langName = i18n.getAvailableLanguages().find(l => l.code === currentLang)?.name || currentLang;

  const result = await promptWithEscape<{ action: string }>(
    [
      {
        type: 'list',
        name: 'action',
        message: t('mainMenu.title'),
        choices: [
          { name: t('mainMenu.install'), value: 'install' },
          { name: t('mainMenu.list'), value: 'list' },
          { name: t('mainMenu.remove'), value: 'remove' },
          { name: t('mainMenu.update'), value: 'update' },
          { name: t('mainMenu.verify'), value: 'verify' },
          { name: t('mainMenu.activation'), value: 'activation' },
          { name: t('mainMenu.status'), value: 'status' },
          { name: t('mainMenu.backup'), value: 'backup' },
          { name: t('mainMenu.restore'), value: 'restore' },
          { name: `${t('mainMenu.language')} (${langName})`, value: 'language' },
          { name: t('mainMenu.exit'), value: 'exit' },
        ],
      },
    ],
    { showEscapeHint: false }
  ); // Don't show escape hint on main menu

  if (!result) {
    // This shouldn't happen on main menu, but handle it
    console.log(chalk.gray(`\n${t('messages.goodbye')}\n`));
    process.exit(0);
  }

  const { action } = result;

  switch (action) {
    case 'install':
      await installFlow(defaultScope, showDescriptions);
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
    case 'language':
      await languageSelectionFlow();
      break;
    case 'exit':
      console.log(chalk.gray(`\n${t('messages.goodbye')}\n`));
      process.exit(0);
  }

  // Return to main menu after action
  if (action !== 'exit') {
    console.log(''); // Add spacing
    await mainMenu(defaultScope, undefined, showDescriptions);
  }
}

async function getInstalledServersByScope(): Promise<{ user: Set<string>; project: Set<string> }> {
  // Check cache first
  if (installedServersCache && Date.now() - installedServersCache.timestamp < CACHE_TTL) {
    return installedServersCache.data;
  }

  const progressBar = createIndeterminateProgressBar({
    label: t('server.loadingServers')
  });

  const userServers = new Set<string>();
  const projectServers = new Set<string>();

  // Get project servers using our mcp-config module
  try {
    progressBar.updateLabel(t('server.checkingProject'));
    const projectServerIds = await getProjectServers();
    projectServerIds.forEach((id) => projectServers.add(id));
  } catch (error) {
    // No project config or error reading it
  }

  // Then get all servers from claude mcp list
  try {
    progressBar.updateLabel(t('server.connectingMcp'));
    const { execa } = await import('execa');
    const { stdout } = await execa('claude', ['mcp', 'list']);

    progressBar.updateLabel(t('server.parsingServers'));
    // Parse the output to get installed servers
    const lines = stdout.split('\n');
    for (const line of lines) {
      // Skip header and empty lines
      if (line.includes('Checking MCP server health') || line.trim() === '') {
        continue;
      }
      // Parse server lines like "github: npx -y @modelcontextprotocol/server-github - ✓ Connected"
      const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
      if (match) {
        const serverId = match[1];
        const matchingServer = servers.find((s) => s.id === serverId);
        if (matchingServer) {
          // Only add to userServers if it's not already in projectServers
          if (!projectServers.has(matchingServer.id)) {
            userServers.add(matchingServer.id);
          }
        }
      }
    }

    progressBar.succeed(t('server.serverListLoaded'));
  } catch (error) {
    progressBar.fail(t('server.connectionFailed'));
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

async function installFlow(defaultScope: InstallScope = 'user', showDescriptions?: boolean) {
  // Ask for installation scope first
  const scopeResult = await promptWithEscape([
    {
      type: 'list',
      name: 'scope',
      message: t('prompts.installationScope'),
      choices: [
        { name: t('choices.userScope'), value: 'user' },
        { name: t('choices.projectScope'), value: 'project' },
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
    const categoryName = t(`categories.${category}`) || category.toUpperCase();
    choices.push(new inquirer.Separator(chalk.yellow(`=== ${categoryName} ===`)));

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
          name: chalk.gray(`${icon} ${server.name} (${t('server.alreadyInstalled', { scope })})`),
          value: server.id,
          disabled: true,
        });
      } else {
        const recommended = server.recommended ? chalk.green(` ${t('server.recommended')}`) : '';
        const requiresConfig = server.requiresConfig ? chalk.gray(` ${t('server.requiresConfig')}`) : '';
        const otherScopeNote = isInstalledInOtherScope
          ? chalk.blue(` (${t('server.installedIn', { scope: scope === 'user' ? 'project' : 'user' })})`)
          : '';

        // Show project-only or scope preference indicators
        let scopeIndicator = '';
        if (server.forceProjectScope) {
          scopeIndicator = chalk.red(` ${t('server.projectOnly')}`);
        } else if (server.preferredScope === 'project') {
          scopeIndicator = chalk.yellow(` ${t('server.prefersProject')}`);
        } else if (server.preferredScope === 'user') {
          scopeIndicator = chalk.cyan(` ${t('server.prefersUser')}`);
        }

        choices.push({
          name: `${icon} ${server.name}${recommended}${scopeIndicator}${requiresConfig}${otherScopeNote}`,
          value: server.id,
          checked: server.recommended && !isInstalledInOtherScope,
        });

        // Add single-line description only if showDescriptions is true
        if (showDescriptions) {
          choices.push(new inquirer.Separator(chalk.gray(`   ${server.description}`)));
        }
      }
    }
  }

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'selectedServers',
    message: t('prompts.selectServers'),
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
      chalk.yellow(`\n${t('messages.noServersSelected')}`)
    );
    // Re-run the installation flow
    return installFlow(defaultScope, showDescriptions);
  }

  // Collect configurations for selected servers
  const configs: Map<string, ServerConfig> = new Map();

  for (const serverId of selectedServers) {
    const server = servers.find((s) => s.id === serverId);
    if (!server) continue;
    if (server.requiresConfig && server.configOptions) {
      console.log(chalk.cyan(`\n📝 ${t('server.configuring', { serverName: server.name })}:`));
      const config = await collectServerConfig(server);
      configs.set(serverId, config);
    }
  }

  // Confirm installation
  console.log(chalk.bold(`\n📋 ${t('server.installationSummary')}`));
  console.log(chalk.gray(`${t('server.scope', { scope: scope === 'user' ? t('choices.userScope').replace(/[🌍📁] /, '') : t('choices.projectScope').replace(/[🌍📁] /, '') })}\n`));
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
      message: t('prompts.confirmInstallation'),
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
    console.log(chalk.yellow(`\n${t('messages.installationCancelled')}`));
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

async function promptForOption(option: ConfigOption): Promise<string | boolean | string[]> {
  const basePrompt: Record<string, unknown> = {
    name: 'value',
    message: option.label,
    default: option.default,
  };

  if (option.description) {
    basePrompt.message = String(basePrompt.message) + chalk.gray(` (${option.description})`);
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
          { name: t('fileSystem.currentDirectory'), value: process.cwd() },
          { name: t('fileSystem.customPath'), value: 'custom' },
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
            message: t('fileSystem.enterCustomPath'),
            validate: (input: string) => {
              try {
                return input.length > 0 || t('validation.pathCannotBeEmpty');
              } catch (error) {
                console.error(chalk.red(t('validation.pathValidationError')), error);
                return t('validation.validationFailed');
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
        const validationResult = option.validate ? option.validate(input) : true;
        return validationResult;
      } catch (error) {
        console.error(chalk.red(t('validation.validationErrorFor', { key: option.key })), error);
        return t('validation.validationFailed');
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
      message: t('prompts.backupType'),
      choices: [
        { name: t('choices.backupUser'), value: 'user' },
        { name: t('choices.backupProject'), value: 'project' },
        { name: t('choices.backupAll'), value: 'all' },
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
      message: t('prompts.restoreType'),
      choices: [
        { name: t('choices.restoreUser'), value: 'user' },
        { name: t('choices.restoreProject'), value: 'project' },
        { name: t('choices.restoreAuto'), value: 'auto' },
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
      message: t('prompts.backupPath'),
      default: defaultPath,
      validate: (input: string) => {
        try {
          return input.length > 0 || t('validation.pathCannotBeEmpty');
        } catch (error) {
          console.error(chalk.red(t('errors.backupPathValidationError')), error);
          return t('validation.validationFailed');
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
  // Show loading progress bar while fetching installed servers
  const progressBar = createIndeterminateProgressBar({
    label: 'Loading installed MCP servers...'
  });

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

  // Stop progress bar before showing results
  progressBar.succeed('Installed servers loaded');

  if (installedServers.length === 0) {
    console.log(chalk.yellow(`\n${t('messages.noServersInstalled')}`));
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
    message: t('prompts.selectServersRemove'),
    choices,
    // validate removed - empty selection is handled after prompt
  });

  if (!selectionResult) {
    return; // Go back
  }

  const { selectedServers } = selectionResult;

  if (selectedServers.length === 0) {
    console.log(chalk.yellow(`\n${t('messages.noServersSelectedRemove')}`));
    return;
  }

  // Confirm removal
  const confirmResult = await promptWithEscape([
    {
      type: 'confirm',
      name: 'confirm',
      message: t('prompts.confirmRemoval', { count: selectedServers.length }),
      default: false,
    },
  ]);

  if (!confirmResult) {
    return; // Go back
  }

  const { confirm } = confirmResult;

  if (!confirm) {
    console.log(chalk.yellow(`\n${t('messages.removalCancelled')}`));
    return;
  }

  // Group by scope for removal
  const userServers = selectedServers.filter((s: { scope: string }) => s.scope === 'user').map((s: { id: string }) => s.id);
  const projectServers = selectedServers
    .filter((s: { scope: string }) => s.scope === 'project')
    .map((s: { id: string }) => s.id);

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
        message: t('prompts.createClaudeSettings'),
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
    console.log(chalk.yellow(`\n${t('messages.noProjectServers')}`));
    console.log(chalk.gray(t('messages.installServersFirst')));
    return;
  }

  // Show current status
  console.log(chalk.bold(`\n📊 ${t('server.currentActivationStatus')}\n`));
  console.log(
    `${t('messages.allProjectServersEnabled')}: ${
      status.enableAllProjectMcpServers ? chalk.green('✓ Yes') : chalk.red('✗ No')
    }`
  );

  // Show activation strategy options
  const strategyResult = await promptWithEscape([
    {
      type: 'list',
      name: 'strategy',
      message: t('prompts.activationStrategy'),
      choices: [
        {
          name: t('choices.activateAll'),
          value: 'all',
          disabled: status.enableAllProjectMcpServers ? 'Already enabled' : false,
        },
        { name: t('choices.activateSpecific'), value: 'specific' },
        { name: t('choices.managePermissions'), value: 'permissions' },
        { name: t('choices.deactivateServers'), value: 'deactivate' },
        { name: t('choices.back'), value: 'back' },
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
      console.log(chalk.green(`\n✓ ${t('messages.selectedServersActivated')}`));
      console.log(chalk.gray(t('messages.restartClaude')));
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

async function specificServerActivationFlow(serverStatuses: ServerActivationStatus[]) {
  const inactiveServers = serverStatuses.filter((s) => !s.isActivated);

  if (inactiveServers.length === 0) {
    console.log(chalk.yellow(`\n${t('messages.allServersActivated')}`));
    return;
  }

  const choices = inactiveServers.map((server) => ({
    name: `${getServerIcon(server.id)} ${server.name}`,
    value: server.id,
  }));

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'servers',
    message: t('prompts.selectServersActivate'),
    choices,
  });

  if (!selectionResult || selectionResult.servers.length === 0) {
    return;
  }

  await activateServers(selectionResult.servers, 'specific');
  console.log(chalk.green(`\n✓ ${t('messages.selectedServersActivated')}`));
  console.log(chalk.gray(t('messages.restartClaude')));
}

async function permissionsManagementFlow(serverStatuses: ServerActivationStatus[]) {
  const actionResult = await promptWithEscape([
    {
      type: 'list',
      name: 'action',
      message: t('prompts.permissionManagement'),
      choices: [
        { name: t('choices.addPermissions'), value: 'add' },
        { name: t('choices.removePermissions'), value: 'remove' },
        { name: t('choices.viewPermissions'), value: 'view' },
        { name: t('choices.back'), value: 'back' },
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
        console.log(chalk.yellow(`\n${t('messages.allServersHavePermissions')}`));
        return;
      }

      const addChoices = serversWithoutWildcard.map((server) => ({
        name: `${getServerIcon(server.id)} ${server.name}`,
        value: server.id,
      }));

      const addResult = await checkboxPromptWithEscape({
        type: 'checkbox',
        name: 'servers',
        message: t('prompts.selectPermissionsAdd'),
        choices: addChoices,
      });

      if (addResult && addResult.servers.length > 0) {
        await activateServers(addResult.servers, 'permission');
        console.log(chalk.green(`\n✓ ${t('messages.permissionsAdded')}`));
        console.log(chalk.gray(t('messages.restartClaude')));
      }
      break;

    case 'remove':
      const serverPermissions = status.permissions.filter((p) => p.startsWith('mcp__'));

      if (serverPermissions.length === 0) {
        console.log(chalk.yellow(`\n${t('messages.noPermissionsToRemove')}`));
        return;
      }

      const removeChoices = serverPermissions.map((permission) => ({
        name: permission,
        value: permission,
      }));

      const removeResult = await checkboxPromptWithEscape({
        type: 'checkbox',
        name: 'permissions',
        message: t('prompts.selectPermissionsRemove'),
        choices: removeChoices,
      });

      if (removeResult && removeResult.permissions.length > 0) {
        const { removePermissions } = await import('./claude-settings.js');
        await removePermissions(removeResult.permissions);
        console.log(chalk.green(`\n✓ ${t('messages.permissionsRemoved')}`));
        console.log(chalk.gray(t('messages.restartClaude')));
      }
      break;

    case 'view':
      console.log(chalk.bold(`\n🔑 ${t('server.currentPermissions')}\n`));
      const currentServerPermissions = status.permissions.filter((p) => p.startsWith('mcp__'));

      if (currentServerPermissions.length === 0) {
        console.log(chalk.gray(t('messages.noPermissionsConfigured')));
      } else {
        for (const permission of currentServerPermissions) {
          console.log(`  ${chalk.cyan(permission)}`);
        }
      }
      break;
  }
}

async function deactivationFlow(serverStatuses: ServerActivationStatus[]) {
  const activeServers = serverStatuses.filter((s) => s.isActivated);

  if (activeServers.length === 0) {
    console.log(chalk.yellow(`\n${t('messages.noServersActive')}`));
    return;
  }

  const choices = activeServers.map((server) => ({
    name: `${getServerIcon(server.id)} ${server.name}${server.activationType ? ` (${server.activationType})` : ''}`,
    value: server.id,
  }));

  const selectionResult = await checkboxPromptWithEscape({
    type: 'checkbox',
    name: 'servers',
    message: t('prompts.selectServersDeactivate'),
    choices,
  });

  if (!selectionResult || selectionResult.servers.length === 0) {
    return;
  }

  const confirmResult = await promptWithEscape([
    {
      type: 'confirm',
      name: 'confirm',
      message: t('prompts.confirmDeactivation', { count: selectionResult.servers.length }),
      default: false,
    },
  ]);

  if (!confirmResult || !confirmResult.confirm) {
    return;
  }

  await deactivateServers(selectionResult.servers);
  console.log(chalk.green(`\n✓ ${t('messages.serversDeactivated')}`));
  console.log(chalk.gray(t('messages.restartClaude')));
}

async function languageSelectionFlow(): Promise<void> {
  const currentLang = i18n.getCurrentLanguage();
  const languages = i18n.getAvailableLanguages();
  
  console.log(chalk.cyan(`\n${t('messages.currentLanguage', { language: languages.find(l => l.code === currentLang)?.name || currentLang })}\n`));

  const choices = languages.map(lang => ({
    name: lang.name + (lang.code === currentLang ? ' ✓' : ''),
    value: lang.code,
  }));

  const result = await promptWithEscape<{ language: Language }>([
    {
      type: 'list',
      name: 'language',
      message: t('prompts.selectLanguage'),
      choices,
    },
  ]);

  if (!result) {
    return;
  }

  const { language } = result;
  
  if (language === currentLang) {
    return; // No change needed
  }

  // Change language
  i18n.setLanguage(language);
  await setLanguagePreference(language);
  
  const newLangName = languages.find(l => l.code === language)?.name || language;
  console.log(chalk.green(`\n✓ ${t('messages.languageChanged', { language: newLangName })}\n`));
}
