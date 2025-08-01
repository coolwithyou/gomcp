import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { MCPServer, ServerConfig } from './types.js';

export interface MCPServerConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ProjectMCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

const MCP_CONFIG_FILE = '.mcp.json';

/**
 * Get the path to the project's .mcp.json file
 */
function getProjectMcpConfigPath(): string {
  return path.join(process.cwd(), MCP_CONFIG_FILE);
}

/**
 * Read the project's .mcp.json file
 */
export async function readProjectMcpConfig(): Promise<ProjectMCPConfig | null> {
  try {
    const configPath = getProjectMcpConfigPath();
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Write the project's .mcp.json file
 */
export async function writeProjectMcpConfig(config: ProjectMCPConfig): Promise<void> {
  const configPath = getProjectMcpConfigPath();
  const content = JSON.stringify(config, null, 2);
  await fs.writeFile(configPath, content, 'utf-8');
}

/**
 * Add a server to the project's .mcp.json
 */
export async function addProjectServer(server: MCPServer, config?: ServerConfig): Promise<void> {
  // Read existing config or create new one
  let projectConfig = await readProjectMcpConfig();
  if (!projectConfig) {
    projectConfig = {
      mcpServers: {},
    };
  }

  // Build server configuration
  const serverConfig: MCPServerConfig = {
    type: 'stdio',
    command: server.command || 'npx',
    args: [],
  };

  // Build command arguments
  if (server.command) {
    // Custom command (e.g., uvx for Serena)
    if (server.args) {
      serverConfig.args = [...server.args];
    }
  } else {
    // Default to npx
    serverConfig.args = ['-y', server.package];
    if (server.args) {
      serverConfig.args.push(...server.args);
    }
  }

  // Handle filesystem server special case
  if (server.id === 'filesystem' && config?.paths) {
    serverConfig.args!.push(...(config.paths as string[]));
  }

  // Handle Serena web dashboard configuration
  if (server.id === 'serena' && config?.SERENA_DISABLE_WEB_DASHBOARD === true) {
    serverConfig.args!.push('--enable-web-dashboard', 'False');
  }

  // Add environment variables
  if (config) {
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (key !== 'paths') {
        // Skip paths as they're handled as arguments
        env[key] = String(value);
      }
    }
    if (Object.keys(env).length > 0) {
      serverConfig.env = env;
    }
  }

  // Add to config
  projectConfig.mcpServers[server.id] = serverConfig;

  // Write back
  await writeProjectMcpConfig(projectConfig);

  console.log(chalk.green(`✓ Added ${server.name} to ${MCP_CONFIG_FILE}`));
  console.log(chalk.gray('  This file can be committed to version control for team sharing'));
}

/**
 * Remove a server from the project's .mcp.json
 */
export async function removeProjectServer(serverId: string): Promise<boolean> {
  const projectConfig = await readProjectMcpConfig();
  if (!projectConfig || !projectConfig.mcpServers[serverId]) {
    return false;
  }

  delete projectConfig.mcpServers[serverId];

  // If no servers left, remove the file
  if (Object.keys(projectConfig.mcpServers).length === 0) {
    const configPath = getProjectMcpConfigPath();
    await fs.unlink(configPath);
    console.log(chalk.yellow(`✓ Removed ${MCP_CONFIG_FILE} (no servers remaining)`));
  } else {
    await writeProjectMcpConfig(projectConfig);
  }

  return true;
}

/**
 * Get list of servers installed in the project
 */
export async function getProjectServers(): Promise<string[]> {
  const projectConfig = await readProjectMcpConfig();
  if (!projectConfig) {
    return [];
  }

  return Object.keys(projectConfig.mcpServers);
}

/**
 * Check if a server is installed in the project
 */
export async function isServerInProject(serverId: string): Promise<boolean> {
  const servers = await getProjectServers();
  return servers.includes(serverId);
}
