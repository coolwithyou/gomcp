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

  // Development
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
    description: 'Automate web browser interactions and testing',
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
    description: 'Cross-browser automation with accessibility tree',
    detailedDescription: [
      'Cross-browser automation with accessibility-based selectors',
      'Supports Chrome, Firefox, Safari with modern web APIs',
    ],
    category: 'development',
    package: '@playwright/mcp',
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
    description: 'Control Chrome browser with 20+ tools for automation',
    detailedDescription: [
      'Full Chrome DevTools integration with 20+ automation tools',
      'Powerful for web scraping, testing, and content analysis',
    ],
    category: 'development',
    package: '@mcp/chrome-bridge',
    requiresConfig: false,
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Design-to-code workflow integration',
    detailedDescription: [
      'Extract design tokens and components from Figma',
      'Convert designs to code with AI assistance',
    ],
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
    description: 'Manage Supabase databases and authentication',
    detailedDescription: [
      'Database operations, auth, and storage management',
      'Full Supabase backend integration',
    ],
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
        validate: (value: unknown) => {
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
        validate: (value: unknown) => {
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
        validate: (value: unknown) => {
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
  {
    id: 'email',
    name: 'Email',
    description: 'Send emails and manage attachments',
    detailedDescription: [
      'Send emails with attachments via SMTP',
      'Automate email workflows and notifications',
    ],
    category: 'productivity',
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
    id: 'gsuite',
    name: 'Google Suite',
    description: 'Access Google Docs, Sheets, and Drive',
    detailedDescription: [
      'Read and write Google Docs, Sheets, and Slides',
      'Manage Google Drive files and folders',
    ],
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
    detailedDescription: [
      'Create, read, and modify Excel spreadsheets',
      'Work with formulas, charts, and formatting',
    ],
    category: 'productivity',
    package: '@modelcontextprotocol/server-excel',
    requiresConfig: false,
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
    id: 'everything',
    name: 'Everything Search',
    description: 'Fast file searching across operating systems',
    detailedDescription: [
      'Lightning-fast file and folder search',
      'Advanced search operators and filters',
    ],
    category: 'data',
    package: '@modelcontextprotocol/server-everything',
    requiresConfig: false,
  },
  {
    id: 'evm',
    name: 'EVM',
    description: 'Comprehensive blockchain services for 30+ EVM networks',
    detailedDescription: [
      'Interact with Ethereum and EVM-compatible blockchains',
      'Smart contract operations and blockchain queries',
    ],
    category: 'data',
    package: '@modelcontextprotocol/server-evm',
    requiresConfig: true,
    configOptions: [
      {
        key: 'PROVIDER_URL',
        type: 'text',
        label: 'RPC Provider URL',
        required: true,
      },
    ],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Database operations and caching microservice',
    detailedDescription: [
      'High-performance key-value database operations',
      'Caching, pub/sub, and data structures',
    ],
    category: 'data',
    package: '@modelcontextprotocol/server-redis',
    requiresConfig: true,
    configOptions: [
      {
        key: 'REDIS_URL',
        type: 'text',
        label: 'Redis Connection URL',
        required: true,
      },
    ],
  },

  // Search & Web
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    description: 'Privacy-focused web search without API keys',
    detailedDescription: [
      'Privacy-focused web search with no tracking',
      'No API key required for quick web searches',
    ],
    category: 'search',
    package: '@modelcontextprotocol/server-duckduckgo',
    requiresConfig: false,
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Privacy-focused web search with API',
    detailedDescription: [
      'Privacy-first web search with Brave API',
      'No tracking, advanced search capabilities',
    ],
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
    id: 'screenshot',
    name: 'Screenshot',
    description: 'Capture website screenshots with advanced features',
    detailedDescription: [
      'Full-page screenshots of any website',
      'Mobile viewports and custom dimensions',
    ],
    category: 'search',
    package: '@modelcontextprotocol/server-screenshot',
    requiresConfig: false,
  },

  // Automation & Integration
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows across 5,000+ apps',
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
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Must be a valid Stripe secret key';
          }
          return value.startsWith('sk_') || 'Must be a valid Stripe secret key';
        },
      },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Extract YouTube video metadata and transcripts',
    detailedDescription: [
      'Get video metadata, transcripts, and comments',
      'Search YouTube and analyze video content',
    ],
    category: 'automation',
    package: '@anaisbetts/mcp-youtube',
    requiresConfig: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Bot automation for Discord servers',
    detailedDescription: [
      'Send messages, manage channels and roles',
      'Full Discord bot integration capabilities',
    ],
    category: 'automation',
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

  // AI & ML
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Search, run, and manage machine learning models',
    detailedDescription: [
      'Run ML models on Replicate platform',
      'Image generation, text models, and more',
    ],
    category: 'ai',
    package: '@modelcontextprotocol/server-replicate',
    requiresConfig: true,
    configOptions: [
      {
        key: 'REPLICATE_API_TOKEN',
        type: 'password',
        label: 'Replicate API Token',
        required: true,
      },
    ],
  },
  {
    id: 'hyperbolic',
    name: 'Hyperbolic',
    description: "Interact with Hyperbolic's GPU cloud services",
    detailedDescription: [
      'GPU-accelerated compute for AI workloads',
      'Deploy and manage ML models on GPU cloud',
    ],
    category: 'ai',
    package: '@modelcontextprotocol/server-hyperbolic',
    requiresConfig: true,
    configOptions: [
      {
        key: 'HYPERBOLIC_API_KEY',
        type: 'password',
        label: 'Hyperbolic API Key',
        required: true,
      },
    ],
  },
  {
    id: 'databricks',
    name: 'Databricks',
    description: 'SQL queries and job management for Databricks',
    detailedDescription: [
      'Run SQL queries on Databricks clusters',
      'Manage jobs and workflows in Databricks',
    ],
    category: 'ai',
    package: '@modelcontextprotocol/server-databricks',
    requiresConfig: true,
    configOptions: [
      {
        key: 'DATABRICKS_HOST',
        type: 'text',
        label: 'Databricks Host',
        required: true,
      },
      {
        key: 'DATABRICKS_TOKEN',
        type: 'password',
        label: 'Databricks Token',
        required: true,
      },
    ],
  },

  // DevOps & Infrastructure
  {
    id: 'kubernetes',
    name: 'Kubernetes (mcp-k8s-go)',
    description: 'Browse Kubernetes pods, logs, events, and namespaces',
    detailedDescription: [
      'Manage Kubernetes clusters and resources',
      'View logs, events, and pod information',
    ],
    category: 'devops',
    package: '@modelcontextprotocol/server-kubernetes',
    requiresConfig: true,
    configOptions: [
      {
        key: 'KUBECONFIG',
        type: 'text',
        label: 'Kubeconfig Path',
        required: false,
      },
    ],
  },
  {
    id: 'haproxy',
    name: 'HAProxy',
    description: 'Manage and monitor HAProxy configurations',
    detailedDescription: [
      'Load balancer configuration and monitoring',
      'Real-time stats and backend management',
    ],
    category: 'devops',
    package: '@modelcontextprotocol/server-haproxy',
    requiresConfig: true,
    configOptions: [
      {
        key: 'HAPROXY_URL',
        type: 'text',
        label: 'HAProxy Stats URL',
        required: true,
      },
      {
        key: 'HAPROXY_USER',
        type: 'text',
        label: 'HAProxy Username',
        required: true,
      },
      {
        key: 'HAPROXY_PASS',
        type: 'password',
        label: 'HAProxy Password',
        required: true,
      },
    ],
  },
  {
    id: 'netbird',
    name: 'Netbird',
    description: 'Analyze Netbird network peers, groups, and policies',
    detailedDescription: [
      'Mesh VPN network management',
      'Peer connections and access control',
    ],
    category: 'devops',
    package: '@modelcontextprotocol/server-netbird',
    requiresConfig: true,
    configOptions: [
      {
        key: 'NETBIRD_API_KEY',
        type: 'password',
        label: 'Netbird API Key',
        required: true,
      },
    ],
  },
  {
    id: 'opnsense',
    name: 'OPNSense',
    description: 'OPNSense firewall management and API access',
    detailedDescription: [
      'Firewall rules and NAT configuration',
      'VPN and security policy management',
    ],
    category: 'devops',
    package: '@modelcontextprotocol/server-opnsense',
    requiresConfig: true,
    configOptions: [
      {
        key: 'OPNSENSE_URL',
        type: 'text',
        label: 'OPNSense URL',
        required: true,
      },
      {
        key: 'OPNSENSE_KEY',
        type: 'password',
        label: 'OPNSense API Key',
        required: true,
      },
      {
        key: 'OPNSENSE_SECRET',
        type: 'password',
        label: 'OPNSense API Secret',
        required: true,
      },
    ],
  },

  // Domain & Security
  {
    id: 'domain-tools',
    name: 'Domain Tools',
    description: 'Comprehensive domain analysis with WHOIS and DNS',
    detailedDescription: [
      'WHOIS lookups and DNS record analysis',
      'Domain availability and history checks',
    ],
    category: 'security',
    package: '@modelcontextprotocol/server-domain-tools',
    requiresConfig: false,
  },
  {
    id: 'splunk',
    name: 'Splunk',
    description: 'Access to Splunk saved searches, alerts, and indexes',
    detailedDescription: [
      'Search and analyze machine data',
      'Monitor alerts and dashboards',
    ],
    category: 'security',
    package: '@modelcontextprotocol/server-splunk',
    requiresConfig: true,
    configOptions: [
      {
        key: 'SPLUNK_URL',
        type: 'text',
        label: 'Splunk URL',
        required: true,
      },
      {
        key: 'SPLUNK_TOKEN',
        type: 'password',
        label: 'Splunk Auth Token',
        required: true,
      },
    ],
  },

  // Blockchain & Crypto
  {
    id: 'solana',
    name: 'Solana Agent Kit',
    description: 'Interact with Solana blockchain (40+ protocol actions)',
    detailedDescription: [
      'Transfer tokens, manage NFTs, DeFi operations',
      'Full Solana blockchain integration',
    ],
    category: 'blockchain',
    package: '@modelcontextprotocol/server-solana',
    requiresConfig: true,
    configOptions: [
      {
        key: 'SOLANA_PRIVATE_KEY',
        type: 'password',
        label: 'Solana Private Key',
        required: true,
      },
      {
        key: 'SOLANA_RPC_URL',
        type: 'text',
        label: 'Solana RPC URL',
        required: false,
      },
    ],
  },

  // Job & Career
  {
    id: 'reed-jobs',
    name: 'Reed Jobs',
    description: 'Search and retrieve job listings from Reed.co.uk',
    detailedDescription: [
      'Search UK job market via Reed.co.uk',
      'Filter by location, salary, and job type',
    ],
    category: 'jobs',
    package: '@modelcontextprotocol/server-reed-jobs',
    requiresConfig: true,
    configOptions: [
      {
        key: 'REED_API_KEY',
        type: 'password',
        label: 'Reed API Key',
        required: true,
      },
    ],
  },

  // Time & Utilities
  {
    id: 'time',
    name: 'Time',
    description: 'Get current time and convert between timezones',
    detailedDescription: [
      'Current time in any timezone',
      'Time conversions and calculations',
    ],
    category: 'utilities',
    package: '@modelcontextprotocol/server-time',
    requiresConfig: false,
  },

  // Meta Tools
  {
    id: 'mcp-compass',
    name: 'MCP Compass',
    description: 'Suggest appropriate MCP servers for specific needs',
    detailedDescription: [
      'AI-powered MCP server recommendations',
      'Find the right tools for your workflow',
    ],
    category: 'meta',
    package: '@modelcontextprotocol/server-mcp-compass',
    requiresConfig: false,
  },
  {
    id: 'mcp-server-creator',
    name: 'MCP Server Creator',
    description: 'Generate other MCP servers dynamically',
    detailedDescription: [
      'Create custom MCP servers on demand',
      'Scaffold new server implementations',
    ],
    category: 'meta',
    package: '@modelcontextprotocol/server-mcp-server-creator',
    requiresConfig: false,
  },
  {
    id: 'mcp-installer',
    name: 'MCP Installer',
    description: 'Install other MCP servers',
    detailedDescription: [
      'Manage MCP server installations',
      'Update and configure MCP servers',
    ],
    category: 'meta',
    package: '@modelcontextprotocol/server-mcp-installer',
    requiresConfig: false,
  },
  {
    id: 'mcp-proxy',
    name: 'MCP Proxy',
    description: 'Aggregate multiple MCP resource servers',
    detailedDescription: [
      'Combine multiple MCP servers into one',
      'Route requests to appropriate servers',
    ],
    category: 'meta',
    package: '@modelcontextprotocol/server-mcp-proxy',
    requiresConfig: true,
    configOptions: [
      {
        key: 'SERVERS',
        type: 'text',
        label: 'Server Configuration',
        description: 'JSON array of server configurations',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Server configuration is required';
          }
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              return 'Configuration must be a JSON array';
            }
            return true;
          } catch {
            return 'Invalid JSON format';
          }
        },
      },
    ],
  },
];

export const presets: Record<string, string[]> = {
  recommended: ['github', 'filesystem', 'context7', 'sequential-thinking'],
  dev: ['github', 'filesystem', 'docker', 'postgresql', 'sequential-thinking'],
  data: ['filesystem', 'jupyter', 'postgresql', 'excel'],
  web: ['github', 'puppeteer', 'figma', 'filesystem'],
  productivity: ['notion', 'slack', 'gsuite', 'filesystem', 'memory'],
};
