import { MCPServer } from './types.js';
import * as os from 'os';
import * as path from 'path';

export const servers: MCPServer[] = [
  // Essential - Core MCP servers that most users will need
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect to GitHub API for issues, PRs, and CI/CD',
    detailedDescription: [
      'Manage repositories, issues, pull requests, and workflows',
      'Perfect for code collaboration and project management',
    ],
    category: 'essential',
    package: '@modelcontextprotocol/server-github',
    requiresConfig: true,
    recommended: true,
    configOptions: [
      {
        key: 'GITHUB_TOKEN',
        type: 'password',
        label: 'GitHub Personal Access Token',
        description: 'Create at https://github.com/settings/tokens',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'GitHub token is required';
          }
          return value.length > 0 || 'GitHub token is required';
        },
      },
    ],
  },
  {
    id: 'filesystem',
    name: 'File System',
    description: 'Read and write files on your machine',
    detailedDescription: [
      'Access, read, write, and manage files and directories',
      'Essential for file operations and code editing tasks',
    ],
    category: 'essential',
    package: '@modelcontextprotocol/server-filesystem',
    requiresConfig: true,
    recommended: true,
    configOptions: [
      {
        key: 'paths',
        type: 'paths',
        label: 'Allowed directories',
        description: 'Select directories Claude can access',
        required: true,
        default: [path.join(os.homedir(), 'Documents'), path.join(os.homedir(), 'Projects')],
      },
    ],
  },
  {
    id: 'context7',
    name: 'Context7',
    description: 'Access up-to-date documentation and code examples for libraries',
    detailedDescription: [
      'Get latest docs and code examples for any library',
      'Invaluable for learning new frameworks and APIs',
    ],
    category: 'essential',
    package: '@upstash/context7-mcp',
    requiresConfig: false,
    recommended: true,
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Break down complex tasks into logical steps',
    detailedDescription: [
      'Step-by-step problem solving with reflective thinking',
      'Perfect for complex analysis and planning tasks',
    ],
    category: 'essential',
    package: '@modelcontextprotocol/server-sequential-thinking',
    requiresConfig: false,
    recommended: true,
  },
  {
    id: 'serena',
    name: 'Serena',
    description: 'Powerful coding agent toolkit with semantic retrieval and editing',
    detailedDescription: [
      'Semantic code search, symbol navigation, and smart editing',
      'Advanced coding agent with project memory and analysis',
    ],
    category: 'essential',
    package: 'git+https://github.com/oraios/serena',
    command: 'uvx',
    args: ['--from', 'git+https://github.com/oraios/serena', 'serena-mcp-server'],
    requiresConfig: true,
    recommended: true,
    configOptions: [
      {
        key: 'SERENA_DISABLE_WEB_DASHBOARD',
        label: 'Disable automatic browser opening for logs?',
        type: 'boolean',
        required: false,
        default: true,
      },
    ],
  },

  // Development - Essential tools for software development
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Query PostgreSQL databases with natural language',
    detailedDescription: [
      'Execute SQL queries and manage PostgreSQL databases',
      'Natural language to SQL conversion for easy data access',
    ],
    category: 'development',
    package: '@modelcontextprotocol/server-postgres',
    requiresConfig: true,
    configOptions: [
      {
        key: 'DATABASE_URL',
        type: 'text',
        label: 'Database URL',
        description: 'PostgreSQL connection string (postgres://...)',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Database URL is required';
          }
          if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
            return 'Database URL must start with postgres:// or postgresql://';
          }
          return true;
        },
      },
    ],
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation and web scraping',
    detailedDescription: [
      'Automate browser interactions and scrape web content',
      'Perfect for testing, automation, and data extraction',
    ],
    category: 'development',
    package: '@modelcontextprotocol/server-puppeteer',
    requiresConfig: false,
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Manage containers, images, and Docker workflows',
    detailedDescription: [
      'Build, run, and manage Docker containers and images',
      'Essential for containerized development workflows',
    ],
    category: 'development',
    package: '@modelcontextprotocol/server-docker',
    requiresConfig: false,
  },

  // Productivity - Tools for daily productivity
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and manage Slack workspaces',
    detailedDescription: [
      'Read and send messages, manage channels and users',
      'Integrate Slack into your AI workflows',
    ],
    category: 'productivity',
    package: '@modelcontextprotocol/server-slack',
    requiresConfig: true,
    configOptions: [
      {
        key: 'SLACK_BOT_TOKEN',
        type: 'password',
        label: 'Slack Bot Token',
        description: 'Bot User OAuth Token (xoxb-...)',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Slack bot token is required';
          }
          if (!value.startsWith('xoxb-')) {
            return 'Bot token must start with xoxb-';
          }
          return true;
        },
      },
      {
        key: 'SLACK_USER_TOKEN',
        type: 'password',
        label: 'Slack User Token (optional)',
        description: 'User OAuth Token for broader permissions (xoxp-...)',
        required: false,
        validate: (value: unknown) => {
          if (value && typeof value === 'string' && !value.startsWith('xoxp-')) {
            return 'User token must start with xoxp-';
          }
          return true;
        },
      },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access and manage Notion workspaces',
    detailedDescription: [
      'Read and update Notion pages and databases',
      'Perfect for knowledge management and documentation',
    ],
    category: 'productivity',
    package: '@modelcontextprotocol/server-notion',
    requiresConfig: true,
    configOptions: [
      {
        key: 'NOTION_API_KEY',
        type: 'password',
        label: 'Notion Integration Token',
        description: 'Create at https://www.notion.so/my-integrations',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Notion API key is required';
          }
          return true;
        },
      },
    ],
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Long-term memory and knowledge graph',
    detailedDescription: [
      'Store and retrieve information across conversations',
      'Build a knowledge graph for complex projects',
    ],
    category: 'productivity',
    package: '@modelcontextprotocol/server-memory',
    requiresConfig: false,
  },

  // Data & Analytics
  {
    id: 'jupyter',
    name: 'Jupyter',
    description: 'Execute code in Jupyter notebooks',
    detailedDescription: [
      'Run Python code and data analysis in notebooks',
      'Perfect for data science and research workflows',
    ],
    category: 'data',
    package: '@modelcontextprotocol/server-jupyter',
    requiresConfig: false,
  },

  // Search & Web
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    description: 'Privacy-focused web search',
    detailedDescription: [
      'Search the web without tracking',
      'Get instant answers and web results',
    ],
    category: 'search',
    package: '@modelcontextprotocol/server-duckduckgo',
    requiresConfig: false,
  },

  // Utilities
  {
    id: 'time',
    name: 'Time',
    description: 'Get current time and timezone info',
    detailedDescription: [
      'Access current time across timezones',
      'Useful for scheduling and time-based calculations',
    ],
    category: 'utilities',
    package: '@modelcontextprotocol/server-time',
    requiresConfig: false,
  },
];

// Presets
export const presets: Record<string, string[]> = {
  recommended: ['github', 'filesystem', 'context7', 'sequential-thinking', 'serena'],
  dev: ['github', 'filesystem', 'context7', 'sequential-thinking', 'postgresql', 'docker', 'puppeteer'],
  data: ['jupyter', 'postgresql', 'duckduckgo'],
  web: ['puppeteer', 'filesystem', 'github'],
  productivity: ['slack', 'notion', 'memory'],
};
