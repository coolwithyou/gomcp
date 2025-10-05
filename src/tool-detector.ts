import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export enum ToolType {
  CLAUDE = 'claude',
  CURSOR = 'cursor',
  BOTH = 'both',
}

export interface ToolConfig {
  type: ToolType;
  globalConfigPath: string;
  projectConfigPath: string;
  configFileName: string;
}

/**
 * Detect which AI coding tools are installed
 */
export async function detectInstalledTools(): Promise<ToolType[]> {
  const tools: ToolType[] = [];
  const homeDir = os.homedir();

  // Check for Claude Code
  try {
    await fs.access(path.join(homeDir, '.claude'));
    tools.push(ToolType.CLAUDE);
  } catch {
    // Claude Code not found
  }

  // Check for Cursor
  try {
    await fs.access(path.join(homeDir, '.cursor'));
    tools.push(ToolType.CURSOR);
  } catch {
    // Cursor not found
  }

  return tools;
}

/**
 * Get configuration paths for a specific tool
 */
export function getToolConfig(tool: ToolType): ToolConfig | ToolConfig[] {
  const homeDir = os.homedir();

  switch (tool) {
    case ToolType.CLAUDE:
      return {
        type: ToolType.CLAUDE,
        globalConfigPath: path.join(homeDir, '.claude', 'config.json'),
        projectConfigPath: '.mcp.json',
        configFileName: 'config.json',
      };

    case ToolType.CURSOR:
      return {
        type: ToolType.CURSOR,
        globalConfigPath: path.join(homeDir, '.cursor', 'mcp.json'),
        projectConfigPath: path.join('.cursor', 'mcp.json'),
        configFileName: 'mcp.json',
      };

    case ToolType.BOTH:
      return [getToolConfig(ToolType.CLAUDE) as ToolConfig, getToolConfig(ToolType.CURSOR) as ToolConfig];

    default:
      throw new Error(`Unknown tool type: ${tool}`);
  }
}

/**
 * Detect the default tool based on what's installed
 */
export async function detectDefaultTool(): Promise<ToolType> {
  // Check environment variable first
  const envTool = process.env.GOMCP_DEFAULT_TOOL?.toLowerCase();
  if (envTool === 'cursor') return ToolType.CURSOR;
  if (envTool === 'claude') return ToolType.CLAUDE;
  if (envTool === 'both') return ToolType.BOTH;

  // Auto-detect installed tools
  const installedTools = await detectInstalledTools();

  if (installedTools.length === 0) {
    // Default to Claude if nothing is detected
    return ToolType.CLAUDE;
  }

  if (installedTools.length === 1) {
    return installedTools[0];
  }

  // Both tools installed - default to Claude for backward compatibility
  return ToolType.CLAUDE;
}

/**
 * Parse tool option from CLI argument
 */
export function parseToolOption(toolArg?: string): ToolType | undefined {
  if (!toolArg) return undefined;

  const normalized = toolArg.toLowerCase();
  switch (normalized) {
    case 'claude':
    case 'claude-code':
      return ToolType.CLAUDE;
    case 'cursor':
      return ToolType.CURSOR;
    case 'both':
    case 'all':
      return ToolType.BOTH;
    default:
      throw new Error(`Invalid tool option: ${toolArg}. Use 'claude', 'cursor', or 'both'`);
  }
}

/**
 * Check if a specific tool is installed
 */
export async function isToolInstalled(tool: ToolType): Promise<boolean> {
  if (tool === ToolType.BOTH) {
    const installed = await detectInstalledTools();
    return installed.includes(ToolType.CLAUDE) && installed.includes(ToolType.CURSOR);
  }

  const installed = await detectInstalledTools();
  return installed.includes(tool);
}

/**
 * Get the display name for a tool
 */
export function getToolDisplayName(tool: ToolType): string {
  switch (tool) {
    case ToolType.CLAUDE:
      return 'Claude Code';
    case ToolType.CURSOR:
      return 'Cursor';
    case ToolType.BOTH:
      return 'Claude Code and Cursor';
    default:
      return tool;
  }
}
