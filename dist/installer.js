import { execa } from 'execa';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createIndeterminateProgressBar } from './utils/progress.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { servers, presets } from './servers.js';
import { addProjectServer, removeProjectServer } from './mcp-config.js';
import { t } from './i18n/index.js';
export async function installServers(serverIds, configs, scope = 'user', _force = false) {
    console.log(chalk.bold(`\n🚀 ${t('server.installing')}\n`));
    const results = [];
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
            await installServer(server, config, scope, progressBar);
            progressBar.succeed(chalk.green(`${server.name} ${t('messages.installedSuccessfully')}`));
            results.push({ server, success: true });
        }
        catch (error) {
            progressBar.fail(chalk.red(t('errors.installationFailed', { serverName: server.name })));
            console.error(chalk.gray(`  ${t('errors.errorDetails', { error: String(error) })}`));
            if (error instanceof Error && error.stack) {
                console.error(chalk.gray(`  ${t('errors.stackTrace', { stack: error.stack })}`));
            }
            results.push({ server, success: false, error: String(error) });
        }
    }
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
    console.log(chalk.cyan('\n🎉 Setup complete!'));
    const projectServers = results.filter((r) => r.success && scope === 'project');
    if (projectServers.length > 0) {
        console.log(chalk.yellow('\n📁 Project Server Notes:'));
        console.log('• A .mcp.json file has been created/updated for team sharing');
        console.log('• The servers are also activated in your Claude Code immediately');
        console.log('• Team members can use this file after cloning the project');
        console.log(`• To reset project server approvals: ${chalk.bold('claude mcp reset-project-choices')}`);
    }
    console.log(`
Run ${chalk.bold('claude')} to start using Claude Code with your new MCP servers`);
    console.log(`Use ${chalk.bold('/mcp')} in Claude Code to check server status
`);
    if (scope === 'project' && successful.length > 0) {
        const shouldActivate = await promptForActivation(scope, true);
        if (shouldActivate) {
            const { activationManagementFlow } = await import('./ui.js');
            await activationManagementFlow();
        }
    }
}
async function promptForActivation(scope, projectServersInstalled) {
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
    }
    catch (error) {
        return false;
    }
}
async function installServerViaClaude(server, config, scope = 'user', progressBar) {
    const args = ['mcp', 'add', server.id];
    if (scope === 'user') {
        args.push('-s', 'user');
    }
    else if (scope === 'project') {
        args.push('-s', 'project');
    }
    let commandArgs;
    if (server.command) {
        commandArgs = ['--', server.command];
        if (server.args) {
            commandArgs.push(...server.args);
        }
    }
    else {
        commandArgs = ['--', 'npx', '-y', server.package];
        if (server.args) {
            commandArgs.push(...server.args);
        }
    }
    if (server.id === 'filesystem' && config?.paths) {
        commandArgs.push(...config.paths);
    }
    args.push(...commandArgs);
    const env = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
            env[key] = value;
        }
    }
    if (config) {
        for (const [key, value] of Object.entries(config)) {
            if (key !== 'paths') {
                env[key] = String(value);
            }
        }
    }
    if (progressBar) {
        progressBar.updateLabel(`Installing ${server.name}: Downloading package...`);
    }
    const childProcess = execa('claude', args, { env });
    if (childProcess.stdout) {
        childProcess.stdout.on('data', (data) => {
            const text = data.toString().trim();
            if (text && progressBar) {
                if (text.includes('Downloading')) {
                    progressBar.updateLabel(`Installing ${server.name}: Downloading...`);
                }
                else if (text.includes('Installing')) {
                    progressBar.updateLabel(`Installing ${server.name}: Installing dependencies...`);
                }
                else if (text.includes('Building')) {
                    progressBar.updateLabel(`Installing ${server.name}: Building...`);
                }
                else if (text.includes('Configuring')) {
                    progressBar.updateLabel(`Installing ${server.name}: Configuring...`);
                }
                else if (text.includes('Complete') || text.includes('Success')) {
                    progressBar.updateLabel(`Installing ${server.name}: Finalizing...`);
                }
            }
        });
    }
    if (childProcess.stderr) {
        childProcess.stderr.on('data', (data) => {
            const text = data.toString().trim();
            if (text && progressBar && !text.toLowerCase().includes('error')) {
                if (text.includes('npm')) {
                    progressBar.updateLabel(`Installing ${server.name}: Setting up npm packages...`);
                }
            }
        });
    }
    await childProcess;
}
async function installServer(server, config, scope = 'user', progressBar) {
    if (scope === 'project') {
        await addProjectServer(server, config);
        try {
            await installServerViaClaude(server, config, 'project', progressBar);
        }
        catch (error) {
            console.log(chalk.gray('Note: Server may already be active in Claude Code'));
        }
        return;
    }
    await installServerViaClaude(server, config, scope, progressBar);
}
export async function installPreset(presetName, scope = 'user', force = false) {
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
    console.log('');
    const configs = new Map();
    for (const serverId of serverIds) {
        const server = servers.find((s) => s.id === serverId);
        if (server?.requiresConfig && server.configOptions) {
            console.log(chalk.cyan(`\n📝 Configure ${server.name}:`));
            const config = {};
            for (const option of server.configOptions) {
                if (option.default !== undefined) {
                    config[option.key] = option.default;
                }
                else {
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
export async function verifyInstallations() {
    const progressBar = createIndeterminateProgressBar({
        label: 'Checking MCP server status...'
    });
    try {
        const serversStatus = new Map();
        try {
            const { stdout } = await execa('claude', ['mcp', 'list']);
            if (stdout && stdout.includes(':')) {
                const lines = stdout.split('\n');
                for (const line of lines) {
                    if (line.includes('Checking MCP server health') || line.trim() === '') {
                        continue;
                    }
                    const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
                    if (match) {
                        const serverId = match[1];
                        const command = match[2];
                        const connected = match[3] === '✓';
                        serversStatus.set(serverId, { command, connected });
                    }
                }
            }
        }
        catch (error) {
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
        const failedServers = [];
        for (const [serverId, status] of serversStatus) {
            const serverDef = servers.find(s => s.id === serverId);
            const serverName = serverDef?.name || serverId;
            if (status.connected) {
                console.log(`${chalk.green('✓')} ${chalk.bold(serverName)} - Connected`);
                if (serverDef?.requiresConfig) {
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
                    }
                    catch {
                    }
                }
            }
            else {
                console.log(`${chalk.red('✗')} ${chalk.bold(serverName)} - ${chalk.red('Failed to connect')}`);
                failedServers.push(serverName);
                allHealthy = false;
                if (serverDef) {
                    console.log(chalk.yellow('  └─ Troubleshooting tips:'));
                    if (serverDef.requiresConfig && serverDef.configOptions) {
                        console.log(chalk.gray(`     • Check required configuration: ${serverDef.configOptions.map(opt => opt.key).join(', ')}`));
                    }
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
        console.log('');
        if (allHealthy) {
            console.log(chalk.green('✅ All MCP servers are connected and healthy!'));
        }
        else {
            console.log(chalk.yellow(`⚠️  ${failedServers.length} server(s) failed to connect`));
            console.log(chalk.gray('\nUse the troubleshooting tips above to resolve connection issues.'));
            console.log(chalk.gray('\nTrying to get additional diagnostics...'));
            try {
                const { stdout } = await execa('claude', ['/mcp'], { timeout: 5000 });
                if (stdout) {
                    console.log(chalk.gray('\nAdditional MCP status from Claude:'));
                    console.log(stdout);
                }
            }
            catch {
            }
        }
    }
    catch (error) {
        progressBar.fail('Failed to verify installations');
        console.error(chalk.red('Error:'), error);
    }
}
export async function listInstalledServers(scope = 'user') {
    console.log(chalk.bold('\n📋 Installed MCP Servers\n'));
    const progressBar = createIndeterminateProgressBar({
        label: 'Loading installed servers...'
    });
    try {
        let hasServers = false;
        try {
            const { stdout } = await execa('claude', ['mcp', 'list']);
            if (stdout && stdout.includes(':')) {
                hasServers = true;
                progressBar.stop();
                const lines = stdout.split('\n');
                const _isCheckingPhase = true;
                const userServers = [];
                const projectServers = [];
                for (const line of lines) {
                    if (line.includes('Checking MCP server health')) {
                        continue;
                    }
                    if (line.trim() === '') {
                        continue;
                    }
                    const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
                    if (match) {
                        const serverId = match[1];
                        const _command = match[2];
                        const _status = match[3] === '✓' ? 'Connected' : 'Failed';
                        let isProjectLevel = false;
                        try {
                            const projectConfig = await fs.readFile(path.join(process.cwd(), '.mcp.json'), 'utf-8');
                            const config = JSON.parse(projectConfig);
                            if (config.mcpServers && config.mcpServers[serverId]) {
                                isProjectLevel = true;
                                projectServers.push(serverId);
                            }
                        }
                        catch {
                        }
                        if (!isProjectLevel) {
                            userServers.push(serverId);
                        }
                    }
                }
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
        }
        catch (error) {
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
                            if (typeof serverConfig === 'object' && serverConfig !== null) {
                                const cfg = serverConfig;
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
                }
                catch (error) {
                }
            }
        }
        if (!hasServers) {
            progressBar.fail('No MCP servers installed');
            console.log(chalk.yellow('Install some servers first with gomcp'));
        }
        else {
            progressBar.stop();
        }
    }
    catch (error) {
        progressBar.fail('Failed to list installed servers');
        console.error(chalk.red('Error:'), error);
    }
}
function getServerIcon(serverId) {
    const icons = {
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
async function getInstalledServers() {
    const installedServers = [];
    try {
        const { stdout } = await execa('claude', ['mcp', 'list']);
        if (stdout && stdout.includes(':')) {
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('Checking MCP server health') || line.trim() === '') {
                    continue;
                }
                const match = line.match(/^(\S+):\s+(.+?)\s+-\s+(✓|✗)/);
                if (match) {
                    const serverId = match[1];
                    const commandStr = match[2];
                    const serverDef = servers.find((s) => s.id === serverId);
                    let packageName = serverDef?.package || '';
                    let args = [];
                    if (commandStr.includes('npx')) {
                        const npxMatch = commandStr.match(/npx\s+-y\s+(@?\S+)/);
                        if (npxMatch) {
                            packageName = npxMatch[1];
                        }
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
                        config: undefined,
                    });
                }
            }
        }
        try {
            const projectConfigPath = path.join(process.cwd(), '.mcp.json');
            const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));
            if (projectConfig.mcpServers) {
                for (const [serverId, serverConfig] of Object.entries(projectConfig.mcpServers)) {
                    const existing = installedServers.find(s => s.id === serverId);
                    if (!existing && typeof serverConfig === 'object' && serverConfig !== null) {
                        const cfg = serverConfig;
                        const serverDef = servers.find((s) => s.id === serverId);
                        installedServers.push({
                            id: serverId,
                            package: serverDef?.package || '',
                            command: typeof cfg.command === 'string' ? cfg.command : undefined,
                            args: Array.isArray(cfg.args) ? cfg.args : undefined,
                            config: typeof cfg.config === 'object' && cfg.config !== null ? cfg.config : undefined,
                        });
                    }
                }
            }
        }
        catch {
        }
        return installedServers;
    }
    catch (error) {
        try {
            const projectConfigPath = path.join(process.cwd(), '.mcp.json');
            const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, 'utf-8'));
            if (projectConfig.mcpServers) {
                for (const [serverId, serverConfig] of Object.entries(projectConfig.mcpServers)) {
                    if (typeof serverConfig === 'object' && serverConfig !== null) {
                        const cfg = serverConfig;
                        const serverDef = servers.find((s) => s.id === serverId);
                        installedServers.push({
                            id: serverId,
                            package: serverDef?.package || '',
                            command: typeof cfg.command === 'string' ? cfg.command : undefined,
                            args: Array.isArray(cfg.args) ? cfg.args : undefined,
                            config: typeof cfg.config === 'object' && cfg.config !== null ? cfg.config : undefined,
                        });
                    }
                }
            }
            return installedServers;
        }
        catch {
            return [];
        }
    }
}
function compareVersions(v1, v2) {
    const normalize = (v) => v.replace(/[^\d.]/g, '').split('.').map(n => parseInt(n) || 0);
    const parts1 = normalize(v1);
    const parts2 = normalize(v2);
    const maxLength = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLength; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 < num2)
            return -1;
        if (num1 > num2)
            return 1;
    }
    return 0;
}
async function checkForUpdates(installedServers) {
    const updateInfo = new Map();
    for (const installed of installedServers) {
        const serverDef = servers.find((s) => s.id === installed.id);
        if (!serverDef) {
            continue;
        }
        try {
            const { stdout: latestVersion } = await execa('npm', ['view', serverDef.package, 'version']);
            let currentVersion = 'unknown';
            try {
                const { stdout: installedVersionOutput } = await execa('npm', ['list', serverDef.package, '--depth=0', '--json']);
                const packageInfo = JSON.parse(installedVersionOutput);
                const dependencies = packageInfo.dependencies || {};
                if (dependencies[serverDef.package]) {
                    currentVersion = dependencies[serverDef.package].version || 'unknown';
                }
            }
            catch (versionError) {
                try {
                    const { stdout: globalVersionOutput } = await execa('npm', ['list', serverDef.package, '-g', '--depth=0', '--json']);
                    const globalPackageInfo = JSON.parse(globalVersionOutput);
                    const globalDependencies = globalPackageInfo.dependencies || {};
                    if (globalDependencies[serverDef.package]) {
                        currentVersion = globalDependencies[serverDef.package].version || 'unknown';
                    }
                }
                catch (globalError) {
                    currentVersion = 'installed';
                }
            }
            const needsUpdate = currentVersion === 'unknown' || currentVersion === 'installed' ||
                compareVersions(currentVersion, latestVersion.trim()) < 0;
            updateInfo.set(installed.id, {
                current: currentVersion,
                latest: latestVersion.trim(),
                needsUpdate,
            });
        }
        catch (error) {
            updateInfo.set(installed.id, {
                current: 'unknown',
                latest: 'unknown',
                needsUpdate: false,
            });
        }
    }
    return updateInfo;
}
export async function updateServers() {
    console.log(chalk.cyan('\n🔄 Checking for server updates...\n'));
    const progressBar = createIndeterminateProgressBar({
        label: 'Getting installed servers...'
    });
    try {
        const installedServers = await getInstalledServers();
        if (installedServers.length === 0) {
            progressBar.fail('No MCP servers installed');
            return;
        }
        progressBar.updateLabel('Checking for updates...');
        const updateInfo = await checkForUpdates(installedServers);
        progressBar.stop();
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
        console.log(chalk.yellow(`Found ${serversNeedingUpdate.length} server(s) with available updates:\n`));
        for (const { server, info } of serversNeedingUpdate) {
            if (server) {
                console.log(`  ${chalk.cyan(server.name)} - ${chalk.gray(info?.latest || 'unknown')}`);
            }
        }
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
                const config = (installed.config || {});
                await installServer(server, config, 'user');
                updateProgressBar.succeed(chalk.green(`${server.name} updated successfully`));
            }
            catch (error) {
                updateProgressBar.fail(chalk.red(`${server.name} update failed`));
                console.error(chalk.gray(`  ${t('errors.errorDetails', { error: String(error) })}`));
            }
        }
        console.log(chalk.green('\n✅ Update complete!'));
    }
    catch (error) {
        progressBar.fail('Failed to check for updates');
        console.error(chalk.red('Error:'), error);
    }
}
export async function backupConfig() {
    const progressBar = createIndeterminateProgressBar({
        label: 'Creating backup...'
    });
    try {
        const backupData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            configs: {},
        };
        const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
        try {
            await fs.access(userConfigPath);
            const userConfig = await fs.readFile(userConfigPath, 'utf-8');
            backupData.configs.user = JSON.parse(userConfig);
            progressBar.updateLabel('Backing up user-level configuration...');
        }
        catch {
        }
        const projectConfigPath = path.join(process.cwd(), '.mcp.json');
        try {
            await fs.access(projectConfigPath);
            const projectConfig = await fs.readFile(projectConfigPath, 'utf-8');
            backupData.configs.project = JSON.parse(projectConfig);
            backupData.projectPath = process.cwd();
            progressBar.updateLabel('Backing up project-level configuration...');
        }
        catch {
        }
        if (Object.keys(backupData.configs).length === 0) {
            progressBar.fail('No MCP configurations found to backup');
            console.log(chalk.yellow('No user or project MCP configurations exist yet.'));
            console.log(chalk.gray('Install some MCP servers first, then try backing up.'));
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `mcp-backup-${timestamp}.json`;
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        progressBar.succeed(`Backup saved to ${chalk.green(backupPath)}`);
        const backedUp = [];
        const configs = backupData.configs;
        if (configs.user) {
            backedUp.push('User-level (global)');
        }
        if (configs.project) {
            backedUp.push(`Project-level (${path.basename(process.cwd())})`);
        }
        console.log(chalk.gray(`Backed up: ${backedUp.join(', ')}`));
    }
    catch (error) {
        progressBar.fail('Failed to create backup');
        console.error(chalk.red('Error:'), error);
    }
}
export async function backupUserConfig() {
    const progressBar = createIndeterminateProgressBar({
        label: 'Creating user configuration backup...'
    });
    try {
        const backupData = {
            version: '2.1',
            type: 'user',
            timestamp: new Date().toISOString(),
            configs: {},
        };
        const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
        try {
            await fs.access(userConfigPath);
            const userConfig = await fs.readFile(userConfigPath, 'utf-8');
            backupData.configs.user = JSON.parse(userConfig);
        }
        catch {
            progressBar.fail('No user-level MCP configuration found');
            console.log(chalk.yellow('No user configuration exists yet.'));
            console.log(chalk.gray('Install some MCP servers at user level first, then try backing up.'));
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `mcp-user-backup-${timestamp}.json`;
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        progressBar.succeed(`User configuration backup saved to ${chalk.green(backupPath)}`);
    }
    catch (error) {
        progressBar.fail('Failed to create user configuration backup');
        console.error(chalk.red('Error:'), error);
    }
}
export async function backupProjectConfig() {
    const progressBar = createIndeterminateProgressBar({
        label: 'Creating project configuration backup...'
    });
    try {
        const backupData = {
            version: '2.1',
            type: 'project',
            timestamp: new Date().toISOString(),
            projectPath: process.cwd(),
            configs: {},
        };
        const projectConfigPath = path.join(process.cwd(), '.mcp.json');
        try {
            await fs.access(projectConfigPath);
            const projectConfig = await fs.readFile(projectConfigPath, 'utf-8');
            backupData.configs.project = JSON.parse(projectConfig);
        }
        catch {
            progressBar.fail('No project-level MCP configuration found');
            console.log(chalk.yellow('No project configuration exists in this directory.'));
            console.log(chalk.gray('Install some MCP servers at project level first, then try backing up.'));
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `mcp-project-backup-${timestamp}.json`;
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        progressBar.succeed(`Project configuration backup saved to ${chalk.green(backupPath)}`);
        console.log(chalk.gray(`Project: ${path.basename(process.cwd())}`));
    }
    catch (error) {
        progressBar.fail('Failed to create project configuration backup');
        console.error(chalk.red('Error:'), error);
    }
}
export async function restoreConfig(backupPath) {
    const progressBar = createIndeterminateProgressBar({
        label: 'Restoring from backup...'
    });
    try {
        try {
            await fs.access(backupPath);
        }
        catch {
            progressBar.fail('Backup file not found');
            console.log(chalk.yellow(`Cannot find backup file: ${backupPath}`));
            return;
        }
        const backupDataStr = await fs.readFile(backupPath, 'utf-8');
        let backupData;
        try {
            backupData = JSON.parse(backupDataStr);
        }
        catch {
            progressBar.fail('Invalid backup file');
            console.log(chalk.yellow('The backup file is not valid JSON.'));
            return;
        }
        if (backupData.version === '2.1' && backupData.type) {
            if (backupData.type === 'user') {
                await restoreUserConfig(backupPath);
                return;
            }
            else if (backupData.type === 'project') {
                await restoreProjectConfig(backupPath);
                return;
            }
        }
        else if (backupData.version === '2.0' && backupData.configs) {
            progressBar.updateLabel('Restoring configurations...');
            const configs = backupData.configs;
            if (configs && configs.user) {
                const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
                const userConfigDir = path.dirname(userConfigPath);
                await fs.mkdir(userConfigDir, { recursive: true });
                try {
                    const currentConfig = await fs.readFile(userConfigPath, 'utf-8');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    await fs.writeFile(`${userConfigPath}.backup-${timestamp}`, currentConfig);
                    console.log(chalk.gray('Current user config backed up'));
                }
                catch {
                }
                await fs.writeFile(userConfigPath, JSON.stringify(configs.user, null, 2));
                progressBar.updateLabel('Restored user-level configuration');
            }
            if (configs && configs.project) {
                const projectConfigPath = path.join(process.cwd(), '.mcp.json');
                try {
                    const currentConfig = await fs.readFile(projectConfigPath, 'utf-8');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    await fs.writeFile(`${projectConfigPath}.backup-${timestamp}`, currentConfig);
                    console.log(chalk.gray('Current project config backed up'));
                }
                catch {
                }
                await fs.writeFile(projectConfigPath, JSON.stringify(configs.project, null, 2));
                progressBar.updateLabel('Restored project-level configuration');
                if (backupData.projectPath && backupData.projectPath !== process.cwd()) {
                    console.log(chalk.yellow(`Note: Project config was from ${String(backupData.projectPath)}`));
                }
            }
            progressBar.succeed('Configurations restored successfully');
            const restored = [];
            if (configs && configs.user) {
                restored.push('User-level (global)');
            }
            if (configs && configs.project) {
                restored.push('Project-level');
            }
            console.log(chalk.gray(`Restored: ${restored.join(', ')}`));
        }
        else {
            const configPath = path.join(process.env.HOME || '', '.claude', 'config.json');
            const configDir = path.dirname(configPath);
            await fs.mkdir(configDir, { recursive: true });
            try {
                const currentConfig = await fs.readFile(configPath, 'utf-8');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                await fs.writeFile(`${configPath}.backup-${timestamp}`, currentConfig);
                console.log(chalk.gray('Current config backed up'));
            }
            catch {
            }
            await fs.writeFile(configPath, backupDataStr);
            progressBar.succeed('User-level configuration restored successfully');
            console.log(chalk.gray('Note: This backup only contains user-level configuration'));
        }
    }
    catch (error) {
        progressBar.fail('Failed to restore from backup');
        console.error(chalk.red('Error:'), error);
    }
}
export async function restoreUserConfig(backupPath) {
    const progressBar = createIndeterminateProgressBar({
        label: 'Restoring user configuration from backup...'
    });
    try {
        try {
            await fs.access(backupPath);
        }
        catch {
            progressBar.fail('Backup file not found');
            console.log(chalk.yellow(`Cannot find backup file: ${backupPath}`));
            return;
        }
        const backupDataStr = await fs.readFile(backupPath, 'utf-8');
        let backupData;
        try {
            backupData = JSON.parse(backupDataStr);
        }
        catch {
            progressBar.fail('Invalid backup file');
            console.log(chalk.yellow('The backup file is not valid JSON.'));
            return;
        }
        if (backupData.type && backupData.type !== 'user') {
            progressBar.fail('Invalid backup type');
            console.log(chalk.yellow(`This backup file contains ${String(backupData.type)} configuration, not user configuration.`));
            return;
        }
        const configs = backupData.configs;
        const userConfig = configs?.user || (backupData.mcpServers ? backupData : null);
        if (!userConfig) {
            progressBar.fail('No user configuration found in backup');
            console.log(chalk.yellow('This backup file does not contain user configuration.'));
            return;
        }
        const userConfigPath = path.join(process.env.HOME || '', '.claude', 'config.json');
        const userConfigDir = path.dirname(userConfigPath);
        await fs.mkdir(userConfigDir, { recursive: true });
        try {
            const currentConfig = await fs.readFile(userConfigPath, 'utf-8');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            await fs.writeFile(`${userConfigPath}.backup-${timestamp}`, currentConfig);
            console.log(chalk.gray('Current user config backed up'));
        }
        catch {
        }
        await fs.writeFile(userConfigPath, JSON.stringify(userConfig, null, 2));
        progressBar.succeed('User configuration restored successfully');
    }
    catch (error) {
        progressBar.fail('Failed to restore user configuration from backup');
        console.error(chalk.red('Error:'), error);
    }
}
export async function restoreProjectConfig(backupPath) {
    const progressBar = createIndeterminateProgressBar({
        label: 'Restoring project configuration from backup...'
    });
    try {
        try {
            await fs.access(backupPath);
        }
        catch {
            progressBar.fail('Backup file not found');
            console.log(chalk.yellow(`Cannot find backup file: ${backupPath}`));
            return;
        }
        const backupDataStr = await fs.readFile(backupPath, 'utf-8');
        let backupData;
        try {
            backupData = JSON.parse(backupDataStr);
        }
        catch {
            progressBar.fail('Invalid backup file');
            console.log(chalk.yellow('The backup file is not valid JSON.'));
            return;
        }
        if (backupData.type && backupData.type !== 'project') {
            progressBar.fail('Invalid backup type');
            console.log(chalk.yellow(`This backup file contains ${String(backupData.type)} configuration, not project configuration.`));
            return;
        }
        const configs = backupData.configs;
        if (!configs?.project) {
            progressBar.fail('No project configuration found in backup');
            console.log(chalk.yellow('This backup file does not contain project configuration.'));
            return;
        }
        const projectConfigPath = path.join(process.cwd(), '.mcp.json');
        try {
            const currentConfig = await fs.readFile(projectConfigPath, 'utf-8');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            await fs.writeFile(`${projectConfigPath}.backup-${timestamp}`, currentConfig);
            console.log(chalk.gray('Current project config backed up'));
        }
        catch {
        }
        await fs.writeFile(projectConfigPath, JSON.stringify(configs.project, null, 2));
        progressBar.succeed('Project configuration restored successfully');
        if (backupData.projectPath && backupData.projectPath !== process.cwd()) {
            console.log(chalk.yellow(`Note: Project config was from ${String(backupData.projectPath)}`));
        }
    }
    catch (error) {
        progressBar.fail('Failed to restore project configuration from backup');
        console.error(chalk.red('Error:'), error);
    }
}
export async function removeServers(serverIds, scope = 'user') {
    console.log(chalk.bold('\n🗑️  Removing MCP servers...\n'));
    const results = [];
    for (const serverId of serverIds) {
        const progressBar = createIndeterminateProgressBar({
            label: `Removing ${serverId}...`
        });
        try {
            if (scope === 'project') {
                const removed = await removeProjectServer(serverId);
                if (!removed) {
                    throw new Error('Server not found in project configuration');
                }
            }
            else {
                const args = ['mcp', 'remove', serverId];
                if (scope === 'user') {
                    args.push('-s', 'user');
                }
                await execa('claude', args);
            }
            progressBar.succeed(chalk.green(`${serverId} removed successfully`));
            results.push({ server: serverId, success: true });
            const server = servers.find((s) => s.id === serverId);
            if (server) {
                await removeFromGomcpConfig(serverId);
            }
        }
        catch (error) {
            progressBar.fail(chalk.red(`${serverId} removal failed`));
            console.error(chalk.gray(`  ${t('errors.errorDetails', { error: String(error) })}`));
            results.push({ server: serverId, success: false, error: String(error) });
        }
    }
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
async function removeFromGomcpConfig(serverId) {
    const { loadConfig, saveConfig } = await import('./config.js');
    const config = await loadConfig();
    if (config) {
        config.installedServers = config.installedServers.filter((s) => s.id !== serverId);
        await saveConfig(config);
    }
}
//# sourceMappingURL=installer.js.map