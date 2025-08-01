import { MCPServer } from './types.js';
import * as os from 'os';
import * as path from 'path';

export const servers: MCPServer[] = [
  // Essential
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
        validate: (value: string) => {
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

  // Development
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Break down complex tasks into logical steps',
    detailedDescription: [
      'Step-by-step problem solving with reflective thinking',
      'Perfect for complex analysis and planning tasks',
    ],
    category: 'development',
    package: '@modelcontextprotocol/server-sequential-thinking',
    requiresConfig: false,
  },
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
        validate: (value: string) => {
          if (!value || typeof value !== 'string') {
            return 'Must be a valid PostgreSQL URL';
          }
          return (
            value.startsWith('postgres://') ||
            value.startsWith('postgresql://') ||
            'Must be a valid PostgreSQL URL'
          );
        },
      },
    ],
    preferredScope: 'project',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Automate web browser interactions',
    detailedDescription: [
      'Control headless Chrome for web scraping and testing',
      'Automate browser tasks like clicks, form filling, screenshots',
    ],
    category: 'development',
    package: '@modelcontextprotocol/server-puppeteer',
    requiresConfig: false,
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: "Browser automation using Playwright's accessibility tree",
    detailedDescription: [
      'Cross-browser automation with accessibility-based selectors',
      'Supports Chrome, Firefox, Safari with modern web APIs',
    ],
    category: 'development',
    package: '@playwright/mcp',
    requiresConfig: false,
  },
  {
    id: 'browser-tools',
    name: 'Browser Tools',
    description: 'Monitor browser logs and automate browser tasks',
    detailedDescription: [
      'Debug web apps with console logs and network monitoring',
      'Advanced browser control for development workflows',
    ],
    category: 'development',
    package: '@agentdesk/browser-tools-mcp',
    requiresConfig: false,
  },
  {
    id: 'chrome',
    name: 'Chrome',
    description: 'Control Chrome browser with 20+ tools for automation and content analysis',
    detailedDescription: [
      'Full Chrome DevTools integration with 20+ automation tools',
      'Powerful for web scraping, testing, and content analysis',
    ],
    category: 'development',
    package: '@mcp/chrome-bridge',
    requiresConfig: false,
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Manage Docker containers and images',
    detailedDescription: [
      'Build, run, and manage Docker containers and images',
      'Essential for containerized development workflows',
    ],
    category: 'development',
    package: '@modelcontextprotocol/server-docker',
    requiresConfig: false,
  },
  {
    id: 'serena',
    name: 'Serena',
    description: 'Powerful coding agent toolkit with semantic retrieval and editing',
    detailedDescription: [
      'Semantic code search, symbol navigation, and smart editing',
      'Advanced coding agent with project memory and analysis',
    ],
    category: 'development',
    package: 'git+https://github.com/oraios/serena',
    command: 'uvx',
    args: ['--from', 'git+https://github.com/oraios/serena', 'serena-mcp-server'],
    requiresConfig: true,
    forceProjectScope: true,
    configOptions: [
      {
        key: 'SERENA_DISABLE_WEB_DASHBOARD',
        label: 'Disable automatic browser opening for logs?',
        type: 'boolean',
        description: 'Prevents Serena logs page from opening automatically in browser',
        required: false,
        default: false,
      },
    ],
  },

  // Productivity
  {
    id: 'slack',
    name: 'Slack',
    description: 'Integrate with Slack for team communication',
    detailedDescription: [
      'Send messages, read channels, manage Slack workspaces',
      'Streamline team communication and notifications',
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
        validate: (value: string) => {
          if (!value || typeof value !== 'string') {
            return 'Must be a valid bot token';
          }
          return value.startsWith('xoxb-') || 'Must be a valid bot token';
        },
      },
      {
        key: 'SLACK_APP_TOKEN',
        type: 'password',
        label: 'Slack App Token',
        description: 'App-Level Token (xapp-...)',
        required: true,
        validate: (value: string) => {
          if (!value || typeof value !== 'string') {
            return 'Must be a valid app token';
          }
          return value.startsWith('xapp-') || 'Must be a valid app token';
        },
      },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access and manage Notion workspaces',
    detailedDescription: [
      'Create, update, and query Notion pages and databases',
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
        validate: (value: string) => {
          if (!value || typeof value !== 'string') {
            return 'Must be a valid Notion token';
          }
          return value.startsWith('secret_') || 'Must be a valid Notion token';
        },
      },
    ],
  },
  {
    id: 'memory',
    name: 'Memory Bank',
    description: 'Persistent memory across Claude sessions',
    detailedDescription: [
      'Build a knowledge graph that persists across sessions',
      'Remember context, entities, and relationships over time',
    ],
    category: 'productivity',
    package: '@modelcontextprotocol/server-memory',
    requiresConfig: false,
    forceProjectScope: true,
  },

  // Data & Analytics
  {
    id: 'jupyter',
    name: 'Jupyter',
    description: 'Execute code in Jupyter notebooks',
    detailedDescription: [
      'Run Python code, data analysis, and visualizations',
      'Interactive notebook environment for data science',
    ],
    category: 'data',
    package: '@modelcontextprotocol/server-jupyter',
    requiresConfig: false,
    preferredScope: 'project',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    description: 'Web search without API keys',
    detailedDescription: [
      'Privacy-focused web search with no tracking',
      'No API key required for quick web searches',
    ],
    category: 'search',
    package: '@modelcontextprotocol/server-duckduckgo',
    requiresConfig: false,
  },

  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows across apps',
    detailedDescription: [
      'Connect 5,000+ apps with automated workflows',
      'Trigger actions across multiple services seamlessly',
    ],
    category: 'automation',
    package: '@modelcontextprotocol/server-zapier',
    requiresConfig: true,
    configOptions: [
      {
        key: 'ZAPIER_API_KEY',
        type: 'password',
        label: 'Zapier API Key',
        required: true,
      },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Integrate with Stripe payment APIs',
    category: 'automation',
    package: '@modelcontextprotocol/server-stripe',
    requiresConfig: true,
    configOptions: [
      {
        key: 'STRIPE_API_KEY',
        type: 'password',
        label: 'Stripe Secret Key',
        description: 'Starts with sk_live_ or sk_test_',
        required: true,
        validate: (value: string) => {
          if (!value || typeof value !== 'string') {
            return 'Must be a valid Stripe secret key';
          }
          return value.startsWith('sk_') || 'Must be a valid Stripe secret key';
        },
      },
    ],
  },

  // Social & Communication
  {
    id: 'discord',
    name: 'Discord',
    description: 'Bot automation for Discord',
    category: 'social',
    package: '@modelcontextprotocol/server-discord',
    requiresConfig: true,
    configOptions: [
      {
        key: 'DISCORD_BOT_TOKEN',
        type: 'password',
        label: 'Discord Bot Token',
        required: true,
      },
    ],
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send emails and manage attachments',
    category: 'social',
    package: '@modelcontextprotocol/server-email',
    requiresConfig: true,
    configOptions: [
      {
        key: 'EMAIL_HOST',
        type: 'text',
        label: 'SMTP Host',
        required: true,
      },
      {
        key: 'EMAIL_PORT',
        type: 'text',
        label: 'SMTP Port',
        default: '587',
        required: true,
      },
      {
        key: 'EMAIL_USER',
        type: 'text',
        label: 'Email Address',
        required: true,
      },
      {
        key: 'EMAIL_PASS',
        type: 'password',
        label: 'Email Password',
        required: true,
      },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Extract YouTube video metadata and transcripts',
    category: 'social',
    package: '@anaisbetts/mcp-youtube',
    requiresConfig: false,
  },

  // Additional popular servers
  {
    id: 'figma',
    name: 'Figma',
    description: 'Design-to-code workflow integration',
    category: 'development',
    package: '@modelcontextprotocol/server-figma',
    requiresConfig: true,
    configOptions: [
      {
        key: 'FIGMA_ACCESS_TOKEN',
        type: 'password',
        label: 'Figma Personal Access Token',
        required: true,
      },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Manage Supabase databases and auth',
    category: 'development',
    package: '@modelcontextprotocol/server-supabase',
    requiresConfig: true,
    configOptions: [
      {
        key: 'SUPABASE_URL',
        type: 'text',
        label: 'Supabase Project URL',
        required: true,
      },
      {
        key: 'SUPABASE_KEY',
        type: 'password',
        label: 'Supabase Service Key',
        required: true,
      },
    ],
    preferredScope: 'project',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Privacy-focused web search',
    category: 'search',
    package: '@modelcontextprotocol/server-brave-search',
    requiresConfig: true,
    configOptions: [
      {
        key: 'BRAVE_API_KEY',
        type: 'password',
        label: 'Brave Search API Key',
        required: true,
      },
    ],
  },
  {
    id: 'gsuite',
    name: 'Google Suite',
    description: 'Access Google Docs, Sheets, and Drive',
    category: 'productivity',
    package: '@modelcontextprotocol/server-gsuite',
    requiresConfig: true,
    configOptions: [
      {
        key: 'GOOGLE_CREDENTIALS',
        type: 'text',
        label: 'Google Service Account JSON',
        description: 'Paste your service account JSON credentials',
        required: true,
      },
    ],
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Create and modify Excel files',
    category: 'data',
    package: '@modelcontextprotocol/server-excel',
    requiresConfig: false,
  },
];

export const presets: Record<string, string[]> = {
  recommended: ['github', 'filesystem', 'context7', 'sequential-thinking'],
  dev: ['github', 'filesystem', 'docker', 'postgresql', 'sequential-thinking'],
  data: ['filesystem', 'jupyter', 'postgresql', 'excel'],
  web: ['github', 'puppeteer', 'figma', 'filesystem'],
  productivity: ['notion', 'slack', 'gsuite', 'filesystem', 'memory'],
};
