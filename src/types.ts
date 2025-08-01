export interface MCPServer {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string[];
  category:
    | 'essential'
    | 'development'
    | 'productivity'
    | 'data'
    | 'automation'
    | 'social'
    | 'search';
  package: string;
  command?: string;
  args?: string[];
  requiresConfig: boolean;
  configOptions?: ConfigOption[];
  recommended?: boolean;
  preferredScope?: 'user' | 'project' | 'both';
  forceProjectScope?: boolean;
}

export interface ConfigOption {
  key: string;
  type: 'text' | 'password' | 'path' | 'paths' | 'boolean' | 'select';
  label: string;
  description?: string;
  required: boolean;
  default?: string | boolean | string[];
  choices?: { label: string; value: string }[];
  validate?: (value: unknown) => boolean | string;
}

export interface ServerConfig {
  [key: string]: string | boolean | string[] | number | Record<string, unknown>;
}

export interface InstallResult {
  server: MCPServer;
  success: boolean;
  error?: string;
}

export type Preset = 'recommended' | 'dev' | 'data' | 'web' | 'productivity';

export type InstallScope = 'user' | 'project';
