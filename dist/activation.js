import chalk from 'chalk';
import { createStepProgressBar, createIndeterminateProgressBar } from './utils/progress.js';
import { getProjectServers } from './mcp-config.js';
import { readClaudeSettings, isServerActivated, getActivationStatus, enableAllProjectServers, enableSpecificServers, disableSpecificServers, addPermissions, removePermissions, } from './claude-settings.js';
import { servers } from './servers.js';
export async function getProjectServersActivationStatus() {
    const steps = [
        { name: 'Getting project servers', weight: 20 },
        { name: 'Fetching activation status', weight: 20 },
        { name: 'Checking server statuses', weight: 60 }
    ];
    const progressBar = createStepProgressBar({ steps });
    try {
        progressBar.nextStep();
        const projectServerIds = await getProjectServers();
        progressBar.nextStep();
        const activationStatus = await getActivationStatus();
        progressBar.nextStep();
        const statuses = [];
        const totalServers = projectServerIds.length;
        for (const serverId of projectServerIds) {
            const server = servers.find((s) => s.id === serverId);
            const isActivated = await isServerActivated(serverId);
            let activationType = 'none';
            if (isActivated) {
                if (activationStatus.enableAllProjectMcpServers) {
                    activationType = 'all';
                }
                else if (activationStatus.enabledServers.includes(serverId)) {
                    activationType = 'specific';
                }
                else if (activationStatus.permissions.some((p) => p.startsWith(`mcp__${serverId}__`) || p === `mcp__${serverId}__*`)) {
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
            if (totalServers > 0) {
            }
        }
        progressBar.succeed('Server activation status checked');
        return statuses;
    }
    catch (error) {
        progressBar.fail('Failed to check activation status');
        throw error;
    }
}
export async function displayActivationStatus() {
    console.log(chalk.bold('\n📊 MCP Server Activation Status\n'));
    await readClaudeSettings();
    const status = await getActivationStatus();
    const serverStatuses = await getProjectServersActivationStatus();
    console.log(chalk.yellow('Global Settings:'));
    console.log(`  Enable all project servers: ${status.enableAllProjectMcpServers ? chalk.green('✓ Yes') : chalk.red('✗ No')}`);
    if (status.enabledServers.length > 0) {
        console.log(`  Specifically enabled servers: ${chalk.cyan(status.enabledServers.join(', '))}`);
    }
    if (status.disabledServers.length > 0) {
        console.log(`  Disabled servers: ${chalk.red(status.disabledServers.join(', '))}`);
    }
    console.log(chalk.yellow('\nProject Servers (.mcp.json):'));
    if (serverStatuses.length === 0) {
        console.log(chalk.gray('  No servers installed in project'));
    }
    else {
        for (const server of serverStatuses) {
            const icon = server.isActivated ? '✓' : '✗';
            const color = server.isActivated ? chalk.green : chalk.red;
            const typeInfo = server.activationType !== 'none' ? chalk.gray(` (${server.activationType})`) : '';
            console.log(`  ${color(icon)} ${server.name}${typeInfo}`);
        }
    }
    const serverPermissions = status.permissions.filter((p) => p.startsWith('mcp__'));
    if (serverPermissions.length > 0) {
        console.log(chalk.yellow('\nServer Permissions:'));
        for (const permission of serverPermissions) {
            console.log(`  ${chalk.cyan(permission)}`);
        }
    }
    if (serverStatuses.some((s) => !s.isActivated)) {
        console.log(chalk.gray('\n💡 Tip: Use "Manage MCP activation" to activate servers'));
    }
}
export async function activateServers(serverIds, strategy) {
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
    }
    catch (error) {
        progressBar.fail('Failed to activate servers');
        throw error;
    }
}
export async function deactivateServers(serverIds) {
    const progressBar = createIndeterminateProgressBar({
        label: 'Deactivating servers...'
    });
    try {
        await disableSpecificServers(serverIds);
        const permissions = [];
        const status = await getActivationStatus();
        for (const serverId of serverIds) {
            const serverPermissions = status.permissions.filter((p) => p.startsWith(`mcp__${serverId}__`));
            permissions.push(...serverPermissions);
        }
        if (permissions.length > 0) {
            await removePermissions(permissions);
        }
        progressBar.succeed(`Deactivated ${serverIds.length} server(s)`);
    }
    catch (error) {
        progressBar.fail('Failed to deactivate servers');
        throw error;
    }
}
export async function hasClaudeSettings() {
    const settings = await readClaudeSettings();
    return settings !== null;
}
export async function initializeClaudeSettings() {
    const settings = await readClaudeSettings();
    if (!settings) {
        await enableAllProjectServers();
        console.log(chalk.green('✓ Created .claude/settings.local.json with default settings'));
    }
}
//# sourceMappingURL=activation.js.map