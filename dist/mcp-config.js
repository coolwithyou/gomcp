import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
const MCP_CONFIG_FILE = '.mcp.json';
function getProjectMcpConfigPath() {
    return path.join(process.cwd(), MCP_CONFIG_FILE);
}
export async function readProjectMcpConfig() {
    try {
        const configPath = getProjectMcpConfigPath();
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return null;
    }
}
export async function writeProjectMcpConfig(config) {
    const configPath = getProjectMcpConfigPath();
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf-8');
}
export async function addProjectServer(server, config) {
    let projectConfig = await readProjectMcpConfig();
    if (!projectConfig) {
        projectConfig = {
            mcpServers: {},
        };
    }
    const serverConfig = {
        type: 'stdio',
        command: server.command || 'npx',
        args: [],
    };
    if (server.command) {
        if (server.args) {
            serverConfig.args = [...server.args];
        }
    }
    else {
        serverConfig.args = ['-y', server.package];
        if (server.args) {
            serverConfig.args.push(...server.args);
        }
    }
    if (server.id === 'filesystem' && config?.paths) {
        if (serverConfig.args) {
            serverConfig.args.push(...config.paths);
        }
    }
    if (server.id === 'serena' && config?.SERENA_DISABLE_WEB_DASHBOARD === true) {
        if (serverConfig.args) {
            serverConfig.args.push('--enable-web-dashboard', 'False');
        }
    }
    if (config) {
        const env = {};
        for (const [key, value] of Object.entries(config)) {
            if (key !== 'paths') {
                env[key] = String(value);
            }
        }
        if (Object.keys(env).length > 0) {
            serverConfig.env = env;
        }
    }
    projectConfig.mcpServers[server.id] = serverConfig;
    await writeProjectMcpConfig(projectConfig);
    console.log(chalk.green(`✓ Added ${server.name} to ${MCP_CONFIG_FILE}`));
    console.log(chalk.gray('  This file can be committed to version control for team sharing'));
}
export async function removeProjectServer(serverId) {
    const projectConfig = await readProjectMcpConfig();
    if (!projectConfig || !projectConfig.mcpServers[serverId]) {
        return false;
    }
    delete projectConfig.mcpServers[serverId];
    if (Object.keys(projectConfig.mcpServers).length === 0) {
        const configPath = getProjectMcpConfigPath();
        await fs.unlink(configPath);
        console.log(chalk.yellow(`✓ Removed ${MCP_CONFIG_FILE} (no servers remaining)`));
    }
    else {
        await writeProjectMcpConfig(projectConfig);
    }
    return true;
}
export async function getProjectServers() {
    const projectConfig = await readProjectMcpConfig();
    if (!projectConfig) {
        return [];
    }
    return Object.keys(projectConfig.mcpServers);
}
export async function isServerInProject(serverId) {
    const servers = await getProjectServers();
    return servers.includes(serverId);
}
//# sourceMappingURL=mcp-config.js.map