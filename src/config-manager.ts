import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { ToolType, getToolConfig, getToolDisplayName } from './tool-detector.js';
import { MCPServer, ServerConfig } from './types.js';

export interface MCPConfiguration {
  [key: string]: unknown;
}

/**
 * Read configuration from a specific tool
 */
export async function readToolConfig(tool: ToolType, scope: 'user' | 'project'): Promise<MCPConfiguration | null> {
  const configs = getToolConfig(tool);
  const configList = Array.isArray(configs) ? configs : [configs];

  for (const config of configList) {
    const configPath = scope === 'user' ? config.globalConfigPath : path.join(process.cwd(), config.projectConfigPath);

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Config not found for this tool
      continue;
    }
  }

  return null;
}

/**
 * Write configuration to a specific tool
 */
export async function writeToolConfig(
  tool: ToolType,
  scope: 'user' | 'project',
  config: MCPConfiguration
): Promise<void> {
  const configs = getToolConfig(tool);
  const configList = Array.isArray(configs) ? configs : [configs];

  for (const toolConfig of configList) {
    const configPath =
      scope === 'user' ? toolConfig.globalConfigPath : path.join(process.cwd(), toolConfig.projectConfigPath);

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    await fs.mkdir(configDir, { recursive: true });

    // Write config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    console.log(chalk.green(`✓ Updated ${getToolDisplayName(toolConfig.type)} ${scope} configuration`));
  }
}

/**
 * Add a server to tool configuration
 */
export async function addServerToTool(
  tool: ToolType,
  scope: 'user' | 'project',
  server: MCPServer,
  serverConfig?: ServerConfig
): Promise<void> {
  const configs = getToolConfig(tool);
  const configList = Array.isArray(configs) ? configs : [configs];

  for (const toolConfig of configList) {
    // Read existing config or create new
    let config = await readToolConfig(toolConfig.type, scope);
    if (!config) {
      config = toolConfig.type === ToolType.CURSOR ? { mcpServers: {} } : {};
    }

    // Build server configuration
    const isHttpConnection = server.connectionType === 'http' && serverConfig?.CONNECTION_TYPE !== 'stdio';
    const mcpServerConfig: Record<string, unknown> = isHttpConnection ? {
      type: 'streamableHttp',
      url: server.httpUrl || 'http://127.0.0.1:12306/mcp',
    } : {
      type: 'stdio',
      command: server.command || 'npx',
      args: [],
    };

    // Build command arguments (only for STDIO connections)
    if (mcpServerConfig.type === 'stdio') {
      if (server.command) {
        // Custom command (e.g., uvx for Serena)
        if (server.args) {
          (mcpServerConfig.args as string[]) = [...server.args];
        }
      } else {
        // Default to npx
        (mcpServerConfig.args as string[]) = ['-y', server.package];
        if (server.args) {
          (mcpServerConfig.args as string[]).push(...server.args);
        }
      }

      // Special handling for Chrome MCP STDIO connection
      if (server.id === 'chrome' && serverConfig?.CONNECTION_TYPE === 'stdio') {
        // Use the actual STDIO server path for Chrome MCP
        mcpServerConfig.command = 'node';
        // This path will be dynamically determined based on the global installation
        (mcpServerConfig.args as string[]) = ['$(npm list -g mcp-chrome-bridge --parseable)/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js'];
      }
    }

    // Handle special cases (Figma, Serena, etc.)
    if (server.id === 'figma' && serverConfig?.FIGMA_API_KEY) {
      const apiKey = String(serverConfig.FIGMA_API_KEY);
      const args = mcpServerConfig.args as string[];
      const stdioIndex = args.indexOf('--stdio');
      if (stdioIndex > -1) {
        args.splice(stdioIndex, 0, `--figma-api-key=${apiKey}`);
      } else {
        args.push(`--figma-api-key=${apiKey}`);
      }
    }

    if (server.id === 'serena' && serverConfig?.SERENA_DISABLE_WEB_DASHBOARD === true) {
      (mcpServerConfig.args as string[]).push('--enable-web-dashboard', 'False');
    }

    // Handle Supabase - use --access-token argument due to Claude Code env bug
    if (server.id === 'supabase' && serverConfig?.SUPABASE_ACCESS_TOKEN) {
      const token = String(serverConfig.SUPABASE_ACCESS_TOKEN);
      (mcpServerConfig.args as string[]).push(`--access-token=${token}`);
    }

    // Add environment variables (except for servers that use args due to Claude Code bug)
    if (serverConfig && server.id !== 'supabase') {
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(serverConfig)) {
        if (key !== 'paths' && key !== 'FIGMA_API_KEY' && key !== 'SUPABASE_ACCESS_TOKEN') {
          // Skip special handling
          env[key] = String(value);
        }
      }
      if (Object.keys(env).length > 0) {
        mcpServerConfig.env = env;
      }
    }

    // Add to appropriate section based on tool type
    if (toolConfig.type === ToolType.CURSOR) {
      // Cursor uses mcpServers key
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
      (config.mcpServers as Record<string, unknown>)[server.id] = mcpServerConfig;
    } else {
      // Claude uses direct server entries
      config[server.id] = mcpServerConfig;
    }

    // Write updated config
    await writeToolConfig(toolConfig.type, scope, config);
  }
}

/**
 * Remove a server from tool configuration
 */
export async function removeServerFromTool(
  tool: ToolType,
  scope: 'user' | 'project',
  serverId: string
): Promise<boolean> {
  const configs = getToolConfig(tool);
  const configList = Array.isArray(configs) ? configs : [configs];
  let removed = false;

  for (const toolConfig of configList) {
    const config = await readToolConfig(toolConfig.type, scope);
    if (!config) continue;

    // Remove from appropriate section based on tool type
    if (toolConfig.type === ToolType.CURSOR) {
      if (config.mcpServers && (config.mcpServers as Record<string, unknown>)[serverId]) {
        delete (config.mcpServers as Record<string, unknown>)[serverId];
        removed = true;
      }
    } else {
      if (config[serverId]) {
        delete config[serverId];
        removed = true;
      }
    }

    if (removed) {
      await writeToolConfig(toolConfig.type, scope, config);
    }
  }

  return removed;
}

/**
 * List installed servers from tool configuration
 */
export async function listServersFromTool(tool: ToolType, scope: 'user' | 'project'): Promise<string[]> {
  const config = await readToolConfig(tool, scope);
  if (!config) return [];

  // Handle different config structures
  if (tool === ToolType.CURSOR && config.mcpServers) {
    return Object.keys(config.mcpServers as Record<string, unknown>);
  }

  // Claude structure - filter out non-server keys
  const serverIds = Object.keys(config).filter(
    (key) => !['version', 'lastUpdated', 'mcpServers'].includes(key) && typeof config[key] === 'object'
  );

  return serverIds;
}

/**
 * Sync configurations between Claude and Cursor
 */
export async function syncConfigurations(): Promise<void> {
  console.log(chalk.blue('Syncing configurations between Claude Code and Cursor...'));

  // Read configurations from both tools
  const claudeUserConfig = await readToolConfig(ToolType.CLAUDE, 'user');
  const _claudeProjectConfig = await readToolConfig(ToolType.CLAUDE, 'project');
  const cursorUserConfig = await readToolConfig(ToolType.CURSOR, 'user');
  const _cursorProjectConfig = await readToolConfig(ToolType.CURSOR, 'project');

  // Convert Claude config to Cursor format
  if (claudeUserConfig) {
    const cursorFormat = { mcpServers: {} };
    for (const [key, value] of Object.entries(claudeUserConfig)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        (cursorFormat.mcpServers as Record<string, unknown>)[key] = value;
      }
    }
    await writeToolConfig(ToolType.CURSOR, 'user', cursorFormat);
  }

  // Convert Cursor config to Claude format
  if (cursorUserConfig?.mcpServers) {
    const claudeFormat = { ...(cursorUserConfig.mcpServers as Record<string, unknown>) };
    await writeToolConfig(ToolType.CLAUDE, 'user', claudeFormat);
  }

  console.log(chalk.green('✓ Configurations synced successfully'));
}

/**
 * Migrate configuration from one tool to another
 */
export async function migrateConfiguration(from: ToolType, to: ToolType): Promise<void> {
  console.log(chalk.blue(`Migrating configuration from ${getToolDisplayName(from)} to ${getToolDisplayName(to)}...`));

  // Read source configurations
  const userConfig = await readToolConfig(from, 'user');
  const projectConfig = await readToolConfig(from, 'project');

  if (!userConfig && !projectConfig) {
    console.log(chalk.yellow('No configuration found to migrate'));
    return;
  }

  // Convert and write to target
  if (userConfig) {
    let targetConfig = userConfig;

    // Convert format if needed
    if (from === ToolType.CLAUDE && to === ToolType.CURSOR) {
      targetConfig = { mcpServers: {} };
      for (const [key, value] of Object.entries(userConfig)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          (targetConfig.mcpServers as Record<string, unknown>)[key] = value;
        }
      }
    } else if (from === ToolType.CURSOR && to === ToolType.CLAUDE) {
      targetConfig = (userConfig.mcpServers as Record<string, unknown>) || {};
    }

    await writeToolConfig(to, 'user', targetConfig);
  }

  if (projectConfig) {
    let targetConfig = projectConfig;

    // Convert format if needed
    if (from === ToolType.CLAUDE && to === ToolType.CURSOR) {
      targetConfig = { mcpServers: {} };
      for (const [key, value] of Object.entries(projectConfig)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          (targetConfig.mcpServers as Record<string, unknown>)[key] = value;
        }
      }
    } else if (from === ToolType.CURSOR && to === ToolType.CLAUDE) {
      targetConfig = (projectConfig.mcpServers as Record<string, unknown>) || {};
    }

    await writeToolConfig(to, 'project', targetConfig);
  }

  console.log(chalk.green(`✓ Configuration migrated to ${getToolDisplayName(to)}`));
}
