import { execa } from 'execa';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  createIndeterminateProgressBar,
  IndeterminateProgressBar
} from './utils/progress.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { servers, presets } from './servers.js';
import { MCPServer, ServerConfig, InstallResult, InstallScope } from './types.js';
import { removeProjectServer } from './mcp-config.js';
import { t } from './i18n/index.js';
import { ChromeExtensionInstaller } from './utils/chrome-extension-installer.js';
import { ChromeAutomation } from './utils/chrome-automation.js';

export async function installServers(
  serverIds: string[],
  configs: Map<string, ServerConfig>,
  scope: InstallScope = 'user',
  _force: boolean = false,
  targetTool?: unknown
): Promise<void> {
  console.log(chalk.bold(`\n🚀 ${t('server.installing')}\n`));

  const results: InstallResult[] = [];

  for (const serverId of serverIds) {
    const server = servers.find((s) => s.id === serverId);
    if (!server) {
      console.error(chalk.red(t('errors.serverNotFound', { serverId })));
      continue;
    }



    const progressBar = createIndeterminateProgressBar({
      label: `Installing ${server.name}...`
    });

    try {
      const config = configs.get(serverId);
      await installServer(server, config, scope, progressBar, targetTool);

      progressBar.succeed(chalk.green(`${server.name} ${t('messages.installedSuccessfully')}`));
      results.push({ server, success: true });
    } catch (error) {
      progressBar.fail(chalk.red(t('errors.installationFailed', { serverName: server.name })));
      console.error(chalk.gray(`  ${t('errors.errorDetails', { error: String(error) })}`));
      if (error instanceof Error && error.stack) {
        console.error(chalk.gray(`  ${t('errors.stackTrace', { stack: error.stack })}`));
      }
      results.push({ server, success: false, error: String(error) });
    }
  }

  // Summary
  console.log(chalk.bold(`\n📊 ${t('server.installationSummary')}\n`));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    console.log(chalk.green(`✓ Successfully installed (${successful.length}):`));
    successful.forEach((r) => console.log(`  - ${r.server.name}`));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`\n✗ Failed to install (${failed.length}):`));
    failed.forEach((r) => console.log(`  - ${r.server.name}: ${r.error}`));
  }

  // Next steps
  console.log(chalk.cyan('\n🎉 Setup complete!'));

  // Check if any servers were installed at project scope
  const projectServers = results.filter((r) => r.success && scope === 'project');
  if (projectServers.length > 0) {
    console.log(chalk.yellow('\n📁 Project Server Notes:'));
    console.log('• A .mcp.json file has been created/updated for team sharing');
    console.log('• The servers are also activated in your Claude Code immediately');
    console.log('• Team members can use this file after cloning the project');
    console.log(
      `• To reset project server approvals: ${chalk.bold('claude mcp reset-project-choices')}`
    );
  }

  console.log(`
Run ${chalk.bold('claude')} to start using Claude Code with your new MCP servers`);
  console.log(`Use ${chalk.bold('/mcp')} in Claude Code to check server status
`);

  // Ask if user wants to activate servers now (only for project scope)
  if (scope === 'project' && successful.length > 0) {
    const shouldActivate = await promptForActivation(scope, true);
    if (shouldActivate) {
      // Dynamic import to avoid circular dependency
      const { activationManagementFlow } = await import('./ui.js');
      await activationManagementFlow();
    }
  }
}

async function promptForActivation(scope: InstallScope, projectServersInstalled: boolean): Promise<boolean> {
  // Only prompt for activation if project servers were installed
  if (scope !== 'project' || !projectServersInstalled) {
    return false;
  }

  try {
    const response = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'activate',
        message: 'Would you like to activate the installed MCP servers now?',
        default: true,
      },
    ]);

    return response.activate;
  } catch (error) {
    // User pressed Ctrl+C or ESC, treat as "No"
    return false;
  }
}



async function installServerViaClaude(
  server: MCPServer,
  config?: ServerConfig,
  scope: InstallScope = 'user',
  progressBar?: IndeterminateProgressBar
): Promise<void> {
  const args = ['mcp', 'add', server.id];

  // Add scope flag
  if (scope === 'user') {
    args.push('-s', 'user');
  } else if (scope === 'project') {
    args.push('-s', 'project');
  }
  // Note: local scope is the default, so no -s flag needed

  // Build the command arguments
  let commandArgs: string[];

  if (server.command) {
    // Use custom command if specified
    commandArgs = ['--', server.command];
    if (server.args) {
      commandArgs.push(...server.args);
    }
  } else {
    // Default to npx
    commandArgs = ['--', 'npx', '-y', server.package];

    // Add any additional arguments from server definition
    if (server.args) {
      commandArgs.push(...server.args);
    }
  }

  // Handle filesystem server special case - add paths as arguments
  if (server.id === 'filesystem' && config?.paths) {
    commandArgs.push(...(config.paths as string[]));
  }

  args.push(...commandArgs);

  // Build environment variables
  const env: Record<string, string> = {};

  // Copy existing env vars
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  if (config) {
    for (const [key, value] of Object.entries(config)) {
      if (key !== 'paths') {
        // Skip paths as they're handled as arguments
        env[key] = String(value);
      }
    }
  }

  // Execute the claude mcp add command with real-time output
  if (progressBar) {
    progressBar.updateLabel(`Installing ${server.name}: Downloading package...`);
  }

  const childProcess = execa('claude', args, { env });

  // Capture stdout
  if (childProcess.stdout) {
    childProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString().trim();
      if (text && progressBar) {
        // Extract meaningful status from output
        if (text.includes('Downloading')) {
          progressBar.updateLabel(`Installing ${server.name}: Downloading...`);
        } else if (text.includes('Installing')) {
          progressBar.updateLabel(`Installing ${server.name}: Installing dependencies...`);
        } else if (text.includes('Building')) {
          progressBar.updateLabel(`Installing ${server.name}: Building...`);
        } else if (text.includes('Configuring')) {
          progressBar.updateLabel(`Installing ${server.name}: Configuring...`);
        } else if (text.includes('Complete') || text.includes('Success')) {
          progressBar.updateLabel(`Installing ${server.name}: Finalizing...`);
        }
      }
    });
  }

  // Capture stderr for additional status
  if (childProcess.stderr) {
    childProcess.stderr.on('data', (data: Buffer) => {
      const text = data.toString().trim();
      if (text && progressBar && !text.toLowerCase().includes('error')) {
        // Sometimes status messages come through stderr
        if (text.includes('npm')) {
          progressBar.updateLabel(`Installing ${server.name}: Setting up npm packages...`);
        }
      }
    });
  }

  await childProcess;
}

async function installServer(
  server: MCPServer,
  config?: ServerConfig,
  scope: InstallScope = 'user',
  progressBar?: IndeterminateProgressBar,
  targetTool?: unknown
): Promise<void> {
  // Import config manager
  const { addServerToTool } = await import('./config-manager.js');
  const { ToolType } = await import('./tool-detector.js');

  const tool = targetTool as typeof ToolType[keyof typeof ToolType] | undefined || ToolType.CLAUDE;

  // Special handling for Chrome MCP server
  if (server.id === 'chrome') {
    await installChromeServer(server, config, scope, progressBar, tool);
    return;
  }

  // Use new config manager for installation
  await addServerToTool(tool, scope, server, config);

  // For backward compatibility with Claude Code, also use claude mcp add for immediate activation
  if (tool === ToolType.CLAUDE || tool === ToolType.BOTH) {
    if (scope === 'project') {
      // Also use claude mcp add for immediate activation
      try {
        await installServerViaClaude(server, config, 'project', progressBar);
      } catch (error) {
        // If already installed, that's fine
        console.log(chalk.gray('Note: Server may already be active in Claude Code'));
      }
    } else {
      await installServerViaClaude(server, config, scope, progressBar);
    }
  }
}

/**
 * Chrome MCP 서버 특별 설치 프로세스
 * 1. npm 패키지 설치 (mcp-chrome-bridge)
 * 2. Chrome 확장 자동 다운로드 및 설치
 * 3. 사용자 가이드 표시
 */
async function installChromeServer(
  server: MCPServer,
  config?: ServerConfig,
  scope: InstallScope = 'user',
  progressBar?: IndeterminateProgressBar,
  tool?: unknown
): Promise<void> {
  const { addServerToTool } = await import('./config-manager.js');
  const { ToolType } = await import('./tool-detector.js');

  const targetTool = tool as typeof ToolType[keyof typeof ToolType] | undefined || ToolType.CLAUDE;

  try {
    // Step 1: Install npm package (mcp-chrome-bridge)
    progressBar?.updateLabel('📦 Installing Chrome MCP bridge package...');
    await addServerToTool(targetTool, scope, server, config);

    // Step 2: Check if Chrome extension is already installed
    const isExtensionInstalled = await ChromeExtensionInstaller.isExtensionInstalled();

    if (!isExtensionInstalled) {
      // Download and install Chrome extension
      progressBar?.updateLabel('🌏 Installing Chrome extension...');
      const extensionPath = await ChromeExtensionInstaller.installChromeExtension(progressBar);

      // Show installation guide
      console.log(''); // Add spacing
      ChromeExtensionInstaller.showInstallationGuide(extensionPath);
    } else {
      // Extension already exists
      progressBar?.updateLabel('✅ Chrome extension already installed');
      console.log(chalk.yellow('\n🌏 Chrome extension is already installed!'));
      console.log(chalk.gray(`   Location: ${ChromeExtensionInstaller.getExtensionPath()}`));
      console.log(chalk.gray('   Make sure it\'s enabled in Chrome at chrome://extensions/'));
    }

    // Step 3: Install via Claude for immediate activation (if needed)
    if (targetTool === ToolType.CLAUDE || targetTool === ToolType.BOTH) {
      if (scope === 'project') {
        try {
          await installServerViaClaude(server, config, 'project', progressBar);
        } catch (error) {
          console.log(chalk.gray('Note: Chrome MCP server may already be active in Claude Code'));
        }
      } else {
        await installServerViaClaude(server, config, scope, progressBar);
      }
    }

    // Step 4: Check connection status and provide specific guidance
    const connectionType = config?.CONNECTION_TYPE || 'http';
    progressBar?.updateLabel('🔍 Checking Chrome MCP connection status...');

    const diagnostics = await ChromeExtensionInstaller.getDiagnosticInfo();

    console.log(chalk.cyan('\n📋 Chrome MCP Setup Status'));
    console.log(chalk.cyan('═'.repeat(50)));

    console.log(`🌏 Chrome Extension: ${diagnostics.extensionInstalled ? chalk.green('✓ Installed') : chalk.red('✗ Not Found')}`);
    console.log(`🔗 HTTP Server: ${diagnostics.httpServerRunning ? chalk.green('✓ Running') : chalk.red('✗ Not Connected')}`);
    console.log(`📡 Connection: ${connectionType === 'http' ? chalk.blue('HTTP (Port 12306)') : chalk.yellow('STDIO')}`);

    if (connectionType === 'http' && !diagnostics.httpServerRunning) {
      console.log(chalk.yellow('\n⚠️  HTTP Connection Issues Detected'));
      console.log(chalk.gray('The Chrome extension may not be properly connected.'));
    }

    if (diagnostics.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      diagnostics.recommendations.forEach((rec, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${rec}`));
      });
    }

    if (diagnostics.extensionInstalled && diagnostics.httpServerRunning) {
      console.log(chalk.green('\n🎉 Chrome MCP is ready to use!'));
      console.log(chalk.gray('• Run Claude Code and check /mcp status'));
      console.log(chalk.gray('• Start automating your browser workflows!'));
    } else {
      console.log(chalk.yellow('\n⚡ Next Steps:'));
      console.log('1. Complete the Chrome extension setup as guided above');
      console.log('2. Ensure the extension shows "Connected" status');
      console.log('3. Test connection with: gomcp --verify');

      // 자동화 옵션 제공
      console.log(chalk.cyan('\n🤖 Automation Options:'));
      console.log('━'.repeat(50));

      // 원클릭 명령어 제공
      const oneClickCommand = ChromeAutomation.generateOneClickCommand();
      console.log(chalk.blue('🚀 Quick Launch (Chrome with extension):'));
      console.log(chalk.gray(`   ${oneClickCommand}`));

      console.log(chalk.blue('\n🔄 Full Automation (attempt auto-install):'));
      console.log(chalk.gray('   gomcp --auto-chrome'));

      console.log(chalk.yellow('\n💡 Copy and run the Quick Launch command to start Chrome with the extension automatically!'));
    }

  } catch (error) {
    throw new Error(`Chrome MCP installation failed: ${error}`);
  }
}

export async function installPreset(
  presetName: string,
  scope: InstallScope = 'user',
  force: boolean = false,
  _targetTool?: unknown
): Promise<void> {
  const serverIds = presets[presetName];
  if (!serverIds) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  console.log(chalk.cyan(`\n📦 Installing ${presetName} preset...\n`));
  console.log(chalk.gray(`Scope: ${scope === 'user' ? 'User (Global)' : 'Project'}\n`));
  console.log('Servers to install:');
  serverIds.forEach((id) => {
    const server = servers.find((s) => s.id === id);
    if (server) {
      console.log(`  - ${server.name}`);
    }
  });

  console.log(''); // Add spacing

  // Collect configs for servers that need them
  const configs: Map<string, ServerConfig> = new Map();

  for (const serverId of serverIds) {
    const server = servers.find((s) => s.id === serverId);
    if (server?.requiresConfig && server.configOptions) {
      console.log(chalk.cyan(`\n📝 Configure ${server.name}:`));

      // For presets, we'll use default values where available
      const config: ServerConfig = {};
      for (const option of server.configOptions) {
        if (option.default !== undefined) {
          config[option.key] = option.default;
        } else {
          // For required fields without defaults, prompt user
          console.log(chalk.yellow(`  ${option.label} is required but has no default value.`));
          console.log(chalk.gray("  Please configure this server manually using 'gomcp'."));
        }
      }

      if (Object.keys(config).length > 0) {
        configs.set(serverId, config);
      }
    }
  }

  await installServers(serverIds, configs, scope, force);
}

export async function verifyInstallations(): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Checking MCP server status...'
  });

  try {
    // Get server status from claude mcp list
    const serversStatus: Map<string, { command: string; connected: boolean }> = new Map();

    try {
      const { stdout } = await execa('claude', ['mcp', 'list']);

      if (stdout && stdout.includes(':')) {
        const lines = stdout.split('\n');

        for (const line of lines) {
          if (line.includes('Checking MCP server health') || line.trim() === '') {
            continue;
          }

          // Parse server lines like "github: npx -y @modelcontextprotocol/server-github - ✓ Connected"
          const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
          if (match) {
            const serverId = match[1];
            const command = match[2];
            const connected = match[3] === '✓';

            serversStatus.set(serverId, { command, connected });
          }
        }
      }
    } catch (error) {
      progressBar.fail('Failed to get MCP server status');
      console.log(chalk.yellow('\n⚠️  Could not run "claude mcp list" command'));
      console.log(chalk.gray('Make sure Claude Code is installed and accessible'));
      return;
    }

    if (serversStatus.size === 0) {
      progressBar.fail('No MCP servers found');
      console.log(chalk.yellow('\nNo MCP servers are currently configured.'));
      console.log(chalk.gray('Install some servers first with "gomcp"'));
      return;
    }

    progressBar.stop();

    console.log(chalk.bold('\n📊 MCP Server Status Report\n'));

    let allHealthy = true;
    const failedServers: string[] = [];

    // Check each server
    for (const [serverId, status] of serversStatus) {
      const serverDef = servers.find(s => s.id === serverId);
      const serverName = serverDef?.name || serverId;

      if (status.connected) {
        console.log(`${chalk.green('✓')} ${chalk.bold(serverName)} - Connected`);

        // Check if server requires config but might be missing it
        if (serverDef?.requiresConfig) {
          // Check project config for required settings
          try {
            const projectConfigPath = path.join(process.cwd(), '.mcp.json');
            const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));

            if (projectConfig.mcpServers?.[serverId]) {
              const serverConfig = projectConfig.mcpServers[serverId];
              if (serverConfig.env) {
                const envVars = Object.keys(serverConfig.env);
                if (envVars.length > 0) {
                  console.log(chalk.gray(`  └─ Environment variables configured: ${envVars.join(', ')}`));
                }
              }
            }
          } catch {
            // Project config not available or server not in it
          }
        }
      } else {
        console.log(`${chalk.red('✗')} ${chalk.bold(serverName)} - ${chalk.red('Failed to connect')}`);
        failedServers.push(serverName);
        allHealthy = false;

        // Provide troubleshooting tips based on server type
        if (serverDef) {
          console.log(chalk.yellow('  └─ Troubleshooting tips:'));

          if (serverDef.requiresConfig && serverDef.configOptions) {
            console.log(chalk.gray(`     • Check required configuration: ${serverDef.configOptions.map(opt => opt.key).join(', ')}`));
          }

          // Server-specific tips
          switch (serverId) {
            case 'github':
              console.log(chalk.gray('     • Ensure GITHUB_TOKEN environment variable is set'));
              break;
            case 'postgresql':
              console.log(chalk.gray('     • Verify database connection string'));
              console.log(chalk.gray('     • Check if PostgreSQL server is running'));
              break;
            case 'filesystem':
              console.log(chalk.gray('     • Verify configured paths exist and are accessible'));
              break;
            case 'docker':
              console.log(chalk.gray('     • Ensure Docker daemon is running'));
              console.log(chalk.gray('     • Check Docker permissions'));
              break;
            case 'slack':
              console.log(chalk.gray('     • Verify Slack app token and permissions'));
              break;
          }

          console.log(chalk.gray('     • Try reinstalling with: gomcp'));
          console.log(chalk.gray(`     • Check logs: claude mcp logs ${serverId}`));
        }
      }
    }

    // Summary
    console.log(''); // Empty line
    if (allHealthy) {
      console.log(chalk.green('✅ All MCP servers are connected and healthy!'));
    } else {
      console.log(chalk.yellow(`⚠️  ${failedServers.length} server(s) failed to connect`));
      console.log(chalk.gray('\nUse the troubleshooting tips above to resolve connection issues.'));

      // Try to run claude /mcp for additional diagnostics
      console.log(chalk.gray('\nTrying to get additional diagnostics...'));
      try {
        const { stdout } = await execa('claude', ['/mcp'], { timeout: 5000 });
        if (stdout) {
          console.log(chalk.gray('\nAdditional MCP status from Claude:'));
          console.log(stdout);
        }
      } catch {
        // Claude /mcp command failed or timed out - that's okay
      }
    }

  } catch (error) {
    progressBar.fail('Failed to verify installations');
    console.error(chalk.red('Error:'), error);
  }
}

export async function listInstalledServers(
  scope: InstallScope | 'all' = 'user',
  _targetTool?: unknown
): Promise<void> {
  console.log(chalk.bold('\n📋 Installed MCP Servers\n'));

  const progressBar = createIndeterminateProgressBar({
    label: 'Loading installed servers...'
  });

  try {
    let hasServers = false;

    // First, try to get all servers from claude mcp list
    try {
      const { stdout } = await execa('claude', ['mcp', 'list']);

      if (stdout && stdout.includes(':')) {
        hasServers = true;
        progressBar.stop();

        // Parse the output
        const lines = stdout.split('\n');
        const _isCheckingPhase = true;
        const userServers: string[] = [];
        const projectServers: string[] = [];

        for (const line of lines) {
          if (line.includes('Checking MCP server health')) {
            continue;
          }

          if (line.trim() === '') {
            continue;
          }

          // Parse server lines like "github: npx -y @modelcontextprotocol/server-github - ✓ Connected"
          const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
          if (match) {
            const serverId = match[1];
            const _command = match[2];
            const _status = match[3] === '✓' ? 'Connected' : 'Failed';

            // Determine scope based on project .mcp.json
            let isProjectLevel = false;
            try {
              const projectConfig = await fs.readFile(
                path.join(process.cwd(), '.mcp.json'),
                'utf-8'
              );
              const config = JSON.parse(projectConfig);
              if (config.mcpServers && config.mcpServers[serverId]) {
                isProjectLevel = true;
                projectServers.push(serverId);
              }
            } catch {
              // Not in project config, so it's user level
            }

            if (!isProjectLevel) {
              userServers.push(serverId);
            }
          }
        }

        // Display based on scope filter
        if ((scope === 'user' || scope === 'all') && userServers.length > 0) {
          console.log(chalk.cyan('User Level (Global):'));
          console.log('');
          for (const serverId of userServers) {
            const server = servers.find((s) => s.id === serverId);
            const icon = server ? getServerIcon(serverId) : '📦';
            const name = server ? server.name : serverId;
            console.log(`  ${icon} ${chalk.bold(name)} (${serverId})`);
          }
          console.log('');
        }

        if ((scope === 'project' || scope === 'all') && projectServers.length > 0) {
          console.log(chalk.cyan(`Project Level (${path.join(process.cwd(), '.mcp.json')}):`));
          console.log('');
          for (const serverId of projectServers) {
            const server = servers.find((s) => s.id === serverId);
            const icon = server ? getServerIcon(serverId) : '📦';
            const name = server ? server.name : serverId;
            console.log(`  ${icon} ${chalk.bold(name)} (${serverId})`);
          }
          console.log('');
        }
      }
    } catch (error) {
      // If claude mcp list fails, fall back to checking .mcp.json files
      // Check project config
      if (scope === 'project' || scope === 'user') {
        try {
          const configData = await fs.readFile(path.join(process.cwd(), '.mcp.json'), 'utf-8');
          const mcpConfig = JSON.parse(configData);

          if (mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0) {
            hasServers = true;
            progressBar.stop();

            console.log(chalk.cyan(`Project Level (${path.join(process.cwd(), '.mcp.json')}):`));
            console.log('');

            for (const [serverId, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
              const server = servers.find((s) => s.id === serverId);
              const icon = server ? getServerIcon(serverId) : '📦';
              const name = server ? server.name : serverId;

              console.log(`  ${icon} ${chalk.bold(name)} (${serverId})`);

              // Show configuration details if available
              if (typeof serverConfig === 'object' && serverConfig !== null) {
                const cfg = serverConfig as Record<string, unknown>;
                if (cfg.command) {
                  console.log(chalk.gray(`     Command: ${String(cfg.command)}`));
                }
                if (cfg.args && Array.isArray(cfg.args)) {
                  console.log(chalk.gray(`     Args: ${cfg.args.join(' ')}`));
                }
              }
            }
            console.log('');
          }
        } catch (error) {
          // Project config doesn't exist or is invalid
        }
      }
    }

    if (!hasServers) {
      progressBar.fail('No MCP servers installed');
      console.log(chalk.yellow('Install some servers first with gomcp'));
    } else {
      progressBar.stop();
    }
  } catch (error) {
    progressBar.fail('Failed to list installed servers');
    console.error(chalk.red('Error:'), error);
  }
}

function getServerIcon(serverId: string): string {
  const icons: Record<string, string> = {
    github: '🐙',
    filesystem: '📁',
    'sequential-thinking': '🧠',
    postgresql: '🐘',
    puppeteer: '🌐',
    playwright: '🎭',
    'browser-tools': '🔧',
    chrome: '🌏',
    docker: '🐳',
    serena: '🤖',
    slack: '💬',
    notion: '📝',
    memory: '💾',
    jupyter: '📊',
    duckduckgo: '🦆',
    zapier: '⚡',
    stripe: '💳',
    discord: '🎮',
    email: '📧',
    youtube: '📺',
    figma: '🎨',
    supabase: '⚡',
    'brave-search': '🦁',
    gsuite: '📋',
    excel: '📈',
    context7: '📚',
    sourcegraph: '🔍',
    scipy: '🔬',
  };

  return icons[serverId] || '📦';
}

interface InstalledServer {
  id: string;
  package: string;
  command?: string;
  args?: string[];
  config?: Record<string, unknown>;
}

async function getInstalledServers(): Promise<InstalledServer[]> {
  const installedServers: InstalledServer[] = [];

  try {
    // Get servers from claude mcp list
    const { stdout } = await execa('claude', ['mcp', 'list']);

    if (stdout && stdout.includes(':')) {
      const lines = stdout.split('\n');

      for (const line of lines) {
        if (line.includes('Checking MCP server health') || line.trim() === '') {
          continue;
        }

        // Parse server lines like "github: npx -y @modelcontextprotocol/server-github - ✓ Connected"
        const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
        if (match) {
          const serverId = match[1];
          const commandStr = match[2];

          // Find the server definition
          const serverDef = servers.find((s) => s.id === serverId);

          // Parse command to extract package name and args
          let packageName = serverDef?.package || '';
          let args: string[] = [];

          if (commandStr.includes('npx')) {
            const npxMatch = commandStr.match(/npx\s+-y\s+(@?\S+)/);
            if (npxMatch) {
              packageName = npxMatch[1];
            }
            // Extract any additional arguments
            const argsMatch = commandStr.match(/npx\s+-y\s+@?\S+\s+(.+)/);
            if (argsMatch) {
              args = argsMatch[1].split(/\s+/);
            }
          }

          installedServers.push({
            id: serverId,
            package: packageName,
            command: commandStr,
            args: args.length > 0 ? args : undefined,
            config: undefined, // Config is not available from claude mcp list
          });
        }
      }
    }

    // Also check project .mcp.json for project-level servers
    try {
      const projectConfigPath = path.join(process.cwd(), '.mcp.json');
      const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));

      if (projectConfig.mcpServers) {
        for (const [serverId, serverConfig] of Object.entries(projectConfig.mcpServers)) {
          // Check if already in list
          const existing = installedServers.find(s => s.id === serverId);
          if (!existing && typeof serverConfig === 'object' && serverConfig !== null) {
            const cfg = serverConfig as Record<string, unknown>;
            const serverDef = servers.find((s) => s.id === serverId);

            installedServers.push({
              id: serverId,
              package: serverDef?.package || '',
              command: typeof cfg.command === 'string' ? cfg.command : undefined,
              args: Array.isArray(cfg.args) ? cfg.args as string[] : undefined,
              config: typeof cfg.config === 'object' && cfg.config !== null ? cfg.config as Record<string, unknown> : undefined,
            });
          }
        }
      }
    } catch {
      // Project config doesn't exist or is invalid
    }

    return installedServers;
  } catch (error) {
    // If claude mcp list fails, fall back to project config only
    try {
      const projectConfigPath = path.join(process.cwd(), '.mcp.json');
      const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));

      if (projectConfig.mcpServers) {
        for (const [serverId, serverConfig] of Object.entries(projectConfig.mcpServers)) {
          if (typeof serverConfig === 'object' && serverConfig !== null) {
            const cfg = serverConfig as Record<string, unknown>;
            const serverDef = servers.find((s) => s.id === serverId);

            installedServers.push({
              id: serverId,
              package: serverDef?.package || '',
              command: typeof cfg.command === 'string' ? cfg.command : undefined,
              args: Array.isArray(cfg.args) ? cfg.args as string[] : undefined,
              config: typeof cfg.config === 'object' && cfg.config !== null ? cfg.config as Record<string, unknown> : undefined,
            });
          }
        }
      }

      return installedServers;
    } catch {
      return [];
    }
  }
}

/**
 * Simple semantic version comparison
 * Returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const normalize = (v: string) => v.replace(/[^\d.]/g, '').split('.').map(n => parseInt(n) || 0);
  const parts1 = normalize(v1);
  const parts2 = normalize(v2);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  return 0;
}

async function checkForUpdates(
  installedServers: InstalledServer[]
): Promise<Map<string, { current: string; latest: string; needsUpdate: boolean }>> {
  const updateInfo = new Map();

  for (const installed of installedServers) {
    // Find the server definition
    const serverDef = servers.find((s) => s.id === installed.id);
    if (!serverDef) {
      continue;
    }

    try {
      // Get latest version from npm
      const { stdout: latestVersion } = await execa('npm', ['view', serverDef.package, 'version']);

      // Get current installed version
      let currentVersion = 'unknown';
      try {
        const { stdout: installedVersionOutput } = await execa('npm', ['list', serverDef.package, '--depth=0', '--json']);
        const packageInfo = JSON.parse(installedVersionOutput);
        const dependencies = packageInfo.dependencies || {};
        if (dependencies[serverDef.package]) {
          currentVersion = dependencies[serverDef.package].version || 'unknown';
        }
      } catch (versionError) {
        // If we can't get the installed version, try alternative method
        try {
          const { stdout: globalVersionOutput } = await execa('npm', ['list', serverDef.package, '-g', '--depth=0', '--json']);
          const globalPackageInfo = JSON.parse(globalVersionOutput);
          const globalDependencies = globalPackageInfo.dependencies || {};
          if (globalDependencies[serverDef.package]) {
            currentVersion = globalDependencies[serverDef.package].version || 'unknown';
          }
        } catch (globalError) {
          // Still couldn't get version, use fallback
          currentVersion = 'installed';
        }
      }

      // Compare versions using semver-like comparison
      const needsUpdate = currentVersion === 'unknown' || currentVersion === 'installed' ||
        compareVersions(currentVersion, latestVersion.trim()) < 0;

      updateInfo.set(installed.id, {
        current: currentVersion,
        latest: latestVersion.trim(),
        needsUpdate,
      });
    } catch (error) {
      // If we can't check npm version, mark as unknown
      updateInfo.set(installed.id, {
        current: 'unknown',
        latest: 'unknown',
        needsUpdate: false,
      });
    }
  }

  return updateInfo;
}

export async function updateServers(): Promise<void> {
  console.log(chalk.cyan('\n🔄 Checking for server updates...\n'));

  const progressBar = createIndeterminateProgressBar({
    label: 'Getting installed servers...'
  });

  try {
    // Get installed servers
    const installedServers = await getInstalledServers();

    if (installedServers.length === 0) {
      progressBar.fail('No MCP servers installed');
      return;
    }

    progressBar.updateLabel('Checking for updates...');

    // Check for updates
    const updateInfo = await checkForUpdates(installedServers);

    progressBar.stop();

    // Show servers that need updates
    const serversNeedingUpdate = Array.from(updateInfo.entries())
      .filter(([_, info]) => info.needsUpdate)
      .map(([id]) => {
        const server = servers.find((s) => s.id === id);
        const info = updateInfo.get(id);
        return { server, info };
      });

    if (serversNeedingUpdate.length === 0) {
      console.log(chalk.green('✅ All servers are up to date!'));
      return;
    }

    console.log(
      chalk.yellow(`Found ${serversNeedingUpdate.length} server(s) with available updates:\n`)
    );

    for (const { server, info } of serversNeedingUpdate) {
      if (server) {
        console.log(`  ${chalk.cyan(server.name)} - ${chalk.gray(info?.latest || 'unknown')}`);
      }
    }

    // Import inquirer dynamically
    const inquirer = (await import('inquirer')).default;

    const { selectedServers } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedServers',
        message: 'Select servers to update:',
        choices: serversNeedingUpdate
          .filter(({ server }) => server)
          .map(({ server, info }) => ({
            name: `${server?.name} (→ ${info?.latest})`,
            value: server?.id || '',
            checked: true,
          })),
      },
    ]);

    if (selectedServers.length === 0) {
      console.log(chalk.gray('\nNo servers selected for update.'));
      return;
    }

    // Perform updates
    console.log(chalk.bold('\n🚀 Updating selected servers...\n'));

    for (const serverId of selectedServers) {
      const server = servers.find((s) => s.id === serverId);
      if (!server) {
        continue;
      }

      const installed = installedServers.find((s) => s.id === serverId);
      if (!installed) {
        continue;
      }

      const updateProgressBar = createIndeterminateProgressBar({
        label: `Updating ${server.name}...`
      });

      try {
        // Reinstall the server (preserving config)
        const config = (installed.config || {}) as ServerConfig;
        await installServer(server, config, 'user');

        updateProgressBar.succeed(chalk.green(`${server.name} updated successfully`));
      } catch (error) {
        updateProgressBar.fail(chalk.red(`${server.name} update failed`));
        console.error(chalk.gray(`  ${t('errors.errorDetails', { error: String(error) })}`));
      }
    }

    console.log(chalk.green('\n✅ Update complete!'));
  } catch (error) {
    progressBar.fail('Failed to check for updates');
    console.error(chalk.red('Error:'), error);
  }
}

export async function backupConfig(): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Creating backup...'
  });

  try {
    const backupData: Record<string, unknown> = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      configs: {} as Record<string, unknown>,
    };

    // Backup user-level config
    const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
    try {
      await fs.access(userConfigPath);
      const userConfig = await fs.readFile(userConfigPath, 'utf-8');
      (backupData.configs as Record<string, unknown>).user = JSON.parse(userConfig);
      progressBar.updateLabel('Backing up user-level configuration...');
    } catch {
      // No user config
    }

    // Backup project-level config
    const projectConfigPath = path.join(process.cwd(), '.mcp.json');
    try {
      await fs.access(projectConfigPath);
      const projectConfig = await fs.readFile(projectConfigPath, 'utf-8');
      (backupData.configs as Record<string, unknown>).project = JSON.parse(projectConfig);
      backupData.projectPath = process.cwd();
      progressBar.updateLabel('Backing up project-level configuration...');
    } catch {
      // No project config
    }

    // Check if we have anything to backup
    if (Object.keys(backupData.configs as Record<string, unknown>).length === 0) {
      progressBar.fail('No MCP configurations found to backup');
      console.log(chalk.yellow('No user or project MCP configurations exist yet.'));
      console.log(chalk.gray('Install some MCP servers first, then try backing up.'));
      return;
    }

    // Save backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `mcp-backup-${timestamp}.json`;

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    progressBar.succeed(`Backup saved to ${chalk.green(backupPath)}`);

    // Show what was backed up
    const backedUp = [];
    const configs = backupData.configs as Record<string, unknown>;
    if (configs.user) {
      backedUp.push('User-level (global)');
    }
    if (configs.project) {
      backedUp.push(`Project-level (${path.basename(process.cwd())})`);
    }
    console.log(chalk.gray(`Backed up: ${backedUp.join(', ')}`));
  } catch (error) {
    progressBar.fail('Failed to create backup');
    console.error(chalk.red('Error:'), error);
  }
}

export async function backupUserConfig(): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Creating user configuration backup...'
  });

  try {
    const backupData: Record<string, unknown> = {
      version: '2.1',
      type: 'user',
      timestamp: new Date().toISOString(),
      configs: {} as Record<string, unknown>,
    };

    // Backup user-level config
    const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
    try {
      await fs.access(userConfigPath);
      const userConfig = await fs.readFile(userConfigPath, 'utf-8');
      (backupData.configs as Record<string, unknown>).user = JSON.parse(userConfig);
    } catch {
      progressBar.fail('No user-level MCP configuration found');
      console.log(chalk.yellow('No user configuration exists yet.'));
      console.log(chalk.gray('Install some MCP servers at user level first, then try backing up.'));
      return;
    }

    // Save backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `mcp-user-backup-${timestamp}.json`;

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    progressBar.succeed(`User configuration backup saved to ${chalk.green(backupPath)}`);
  } catch (error) {
    progressBar.fail('Failed to create user configuration backup');
    console.error(chalk.red('Error:'), error);
  }
}

export async function backupProjectConfig(): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Creating project configuration backup...'
  });

  try {
    const backupData: Record<string, unknown> = {
      version: '2.1',
      type: 'project',
      timestamp: new Date().toISOString(),
      projectPath: process.cwd(),
      configs: {} as Record<string, unknown>,
    };

    // Backup project-level config
    const projectConfigPath = path.join(process.cwd(), '.mcp.json');
    try {
      await fs.access(projectConfigPath);
      const projectConfig = await fs.readFile(projectConfigPath, 'utf-8');
      (backupData.configs as Record<string, unknown>).project = JSON.parse(projectConfig);
    } catch {
      progressBar.fail('No project-level MCP configuration found');
      console.log(chalk.yellow('No project configuration exists in this directory.'));
      console.log(
        chalk.gray('Install some MCP servers at project level first, then try backing up.')
      );
      return;
    }

    // Save backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `mcp-project-backup-${timestamp}.json`;

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    progressBar.succeed(`Project configuration backup saved to ${chalk.green(backupPath)}`);
    console.log(chalk.gray(`Project: ${path.basename(process.cwd())}`));
  } catch (error) {
    progressBar.fail('Failed to create project configuration backup');
    console.error(chalk.red('Error:'), error);
  }
}

export async function restoreConfig(backupPath: string): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Restoring from backup...'
  });

  try {
    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      progressBar.fail('Backup file not found');
      console.log(chalk.yellow(`Cannot find backup file: ${backupPath}`));
      return;
    }

    // Read backup file
    const backupDataStr = await fs.readFile(backupPath, 'utf-8');
    let backupData: Record<string, unknown>;

    // Parse and validate JSON
    try {
      backupData = JSON.parse(backupDataStr);
    } catch {
      progressBar.fail('Invalid backup file');
      console.log(chalk.yellow('The backup file is not valid JSON.'));
      return;
    }

    // Handle different backup formats
    if (backupData.version === '2.1' && backupData.type) {
      // New format with separate user/project backups
      if (backupData.type === 'user') {
        await restoreUserConfig(backupPath);
        return;
      } else if (backupData.type === 'project') {
        await restoreProjectConfig(backupPath);
        return;
      }
    } else if (backupData.version === '2.0' && backupData.configs) {
      // New format with user and project configs
      progressBar.updateLabel('Restoring configurations...');

      // Restore user-level config
      const configs = backupData.configs as Record<string, unknown>;
      if (configs && configs.user) {
        const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
        const userConfigDir = path.dirname(userConfigPath);

        // Ensure config directory exists
        await fs.mkdir(userConfigDir, { recursive: true });

        // Backup current user config if exists
        try {
          const currentConfig = await fs.readFile(userConfigPath, 'utf-8');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          await fs.writeFile(`${userConfigPath}.backup-${timestamp}`, currentConfig);
          console.log(chalk.gray('Current user config backed up'));
        } catch {
          // No existing config
        }

        await fs.writeFile(userConfigPath, JSON.stringify(configs.user, null, 2));
        progressBar.updateLabel('Restored user-level configuration');
      }

      // Restore project-level config
      if (configs && configs.project) {
        const projectConfigPath = path.join(process.cwd(), '.mcp.json');

        // Backup current project config if exists
        try {
          const currentConfig = await fs.readFile(projectConfigPath, 'utf-8');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          await fs.writeFile(`${projectConfigPath}.backup-${timestamp}`, currentConfig);
          console.log(chalk.gray('Current project config backed up'));
        } catch {
          // No existing config
        }

        await fs.writeFile(projectConfigPath, JSON.stringify(configs.project, null, 2));
        progressBar.updateLabel('Restored project-level configuration');

        if (backupData.projectPath && backupData.projectPath !== process.cwd()) {
          console.log(chalk.yellow(`Note: Project config was from ${String(backupData.projectPath)}`));
        }
      }

      progressBar.succeed('Configurations restored successfully');

      // Show what was restored
      const restored = [];
      if (configs && configs.user) {
        restored.push('User-level (global)');
      }
      if (configs && configs.project) {
        restored.push('Project-level');
      }
      console.log(chalk.gray(`Restored: ${restored.join(', ')}`));
    } else {
      // Old format - single config file (user-level only)
      const configPath = path.join(process.env.HOME || '', '.claude', 'config.json');
      const configDir = path.dirname(configPath);

      await fs.mkdir(configDir, { recursive: true });

      // Backup current config if exists
      try {
        const currentConfig = await fs.readFile(configPath, 'utf-8');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.writeFile(`${configPath}.backup-${timestamp}`, currentConfig);
        console.log(chalk.gray('Current config backed up'));
      } catch {
        // No existing config
      }

      await fs.writeFile(configPath, backupDataStr);
      progressBar.succeed('User-level configuration restored successfully');
      console.log(chalk.gray('Note: This backup only contains user-level configuration'));
    }
  } catch (error) {
    progressBar.fail('Failed to restore from backup');
    console.error(chalk.red('Error:'), error);
  }
}

export async function restoreUserConfig(backupPath: string): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Restoring user configuration from backup...'
  });

  try {
    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      progressBar.fail('Backup file not found');
      console.log(chalk.yellow(`Cannot find backup file: ${backupPath}`));
      return;
    }

    // Read backup file
    const backupDataStr = await fs.readFile(backupPath, 'utf-8');
    let backupData: Record<string, unknown>;

    // Parse and validate JSON
    try {
      backupData = JSON.parse(backupDataStr);
    } catch {
      progressBar.fail('Invalid backup file');
      console.log(chalk.yellow('The backup file is not valid JSON.'));
      return;
    }

    // Validate backup type
    if (backupData.type && backupData.type !== 'user') {
      progressBar.fail('Invalid backup type');
      console.log(
        chalk.yellow(
          `This backup file contains ${String(backupData.type)} configuration, not user configuration.`
        )
      );
      return;
    }

    // Check for user config in backup
    const configs = backupData.configs as Record<string, unknown> | undefined;
    const userConfig = configs?.user || (backupData.mcpServers ? backupData : null);
    if (!userConfig) {
      progressBar.fail('No user configuration found in backup');
      console.log(chalk.yellow('This backup file does not contain user configuration.'));
      return;
    }

    const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
    const userConfigDir = path.dirname(userConfigPath);

    // Ensure config directory exists
    await fs.mkdir(userConfigDir, { recursive: true });

    // Backup current user config if exists
    try {
      const currentConfig = await fs.readFile(userConfigPath, 'utf-8');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.writeFile(`${userConfigPath}.backup-${timestamp}`, currentConfig);
      console.log(chalk.gray('Current user config backed up'));
    } catch {
      // No existing config
    }

    await fs.writeFile(userConfigPath, JSON.stringify(userConfig, null, 2));
    progressBar.succeed('User configuration restored successfully');
  } catch (error) {
    progressBar.fail('Failed to restore user configuration from backup');
    console.error(chalk.red('Error:'), error);
  }
}

export async function restoreProjectConfig(backupPath: string): Promise<void> {
  const progressBar = createIndeterminateProgressBar({
    label: 'Restoring project configuration from backup...'
  });

  try {
    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      progressBar.fail('Backup file not found');
      console.log(chalk.yellow(`Cannot find backup file: ${backupPath}`));
      return;
    }

    // Read backup file
    const backupDataStr = await fs.readFile(backupPath, 'utf-8');
    let backupData: Record<string, unknown>;

    // Parse and validate JSON
    try {
      backupData = JSON.parse(backupDataStr);
    } catch {
      progressBar.fail('Invalid backup file');
      console.log(chalk.yellow('The backup file is not valid JSON.'));
      return;
    }

    // Validate backup type
    if (backupData.type && backupData.type !== 'project') {
      progressBar.fail('Invalid backup type');
      console.log(
        chalk.yellow(
          `This backup file contains ${String(backupData.type)} configuration, not project configuration.`
        )
      );
      return;
    }

    // Check for project config in backup
    const configs = backupData.configs as Record<string, unknown> | undefined;
    if (!configs?.project) {
      progressBar.fail('No project configuration found in backup');
      console.log(chalk.yellow('This backup file does not contain project configuration.'));
      return;
    }

    const projectConfigPath = path.join(process.cwd(), '.mcp.json');

    // Backup current project config if exists
    try {
      const currentConfig = await fs.readFile(projectConfigPath, 'utf-8');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.writeFile(`${projectConfigPath}.backup-${timestamp}`, currentConfig);
      console.log(chalk.gray('Current project config backed up'));
    } catch {
      // No existing config
    }

    await fs.writeFile(projectConfigPath, JSON.stringify(configs.project, null, 2));
    progressBar.succeed('Project configuration restored successfully');

    if (backupData.projectPath && backupData.projectPath !== process.cwd()) {
      console.log(chalk.yellow(`Note: Project config was from ${String(backupData.projectPath)}`));
    }
  } catch (error) {
    progressBar.fail('Failed to restore project configuration from backup');
    console.error(chalk.red('Error:'), error);
  }
}

export async function removeServers(
  serverIds: string[],
  scope: InstallScope = 'user'
): Promise<void> {
  console.log(chalk.bold('\n🗑️  Removing MCP servers...\n'));

  const results: { server: string; success: boolean; error?: string }[] = [];

  for (const serverId of serverIds) {
    const progressBar = createIndeterminateProgressBar({
      label: `Removing ${serverId}...`
    });

    try {
      if (scope === 'project') {
        // Remove from .mcp.json
        const removed = await removeProjectServer(serverId);
        if (!removed) {
          throw new Error('Server not found in project configuration');
        }
      } else {
        // Use claude mcp remove command for user/local scope
        const args = ['mcp', 'remove', serverId];
        if (scope === 'user') {
          args.push('-s', 'user');
        }
        await execa('claude', args);
      }

      progressBar.succeed(chalk.green(`${serverId} removed successfully`));
      results.push({ server: serverId, success: true });

      // Remove from gomcp config
      const server = servers.find((s) => s.id === serverId);
      if (server) {
        await removeFromGomcpConfig(serverId);
      }
    } catch (error) {
      progressBar.fail(chalk.red(`${serverId} removal failed`));
      console.error(chalk.gray(`  ${t('errors.errorDetails', { error: String(error) })}`));
      results.push({ server: serverId, success: false, error: String(error) });
    }
  }

  // Summary
  console.log(chalk.bold('\n📊 Removal Summary:\n'));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    console.log(chalk.green(`✓ Successfully removed (${successful.length}):`));
    successful.forEach((r) => console.log(`  - ${r.server}`));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`\n✗ Failed to remove (${failed.length}):`));
    failed.forEach((r) => console.log(`  - ${r.server}: ${r.error}`));
  }
}

async function removeFromGomcpConfig(serverId: string): Promise<void> {
  const { loadConfig, saveConfig } = await import('./config.js');

  const config = await loadConfig();
  if (config) {
    config.installedServers = config.installedServers.filter((s) => s.id !== serverId);
    await saveConfig(config);
  }
}
