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
    package: 'mcp-server-docker',
    requiresConfig: false,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Backend-as-a-service with database and auth',
    detailedDescription: [
      'Access Supabase database, storage, and authentication',
      'Perfect for full-stack development with real-time features',
    ],
    category: 'development',
    package: '@supabase/mcp-server-supabase',
    requiresConfig: true,
    configOptions: [
      {
        key: 'SUPABASE_ACCESS_TOKEN',
        type: 'password',
        label: 'Personal Access Token',
        description: 'Generate from Supabase dashboard settings (Account > Access Tokens)',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Personal Access Token is required';
          }
          return true;
        },
      },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Access Figma design layouts and components',
    detailedDescription: [
      'Retrieve layout information from Figma designs',
      'Helps AI understand UI structure and design context',
    ],
    category: 'development',
    package: 'figma-developer-mcp',
    requiresConfig: true,
    args: ['--stdio'],
    configOptions: [
      {
        key: 'FIGMA_API_KEY',
        type: 'password',
        label: 'Figma API Access Token',
        description: 'Generate from Figma Settings > Account > Personal access tokens',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Figma API key is required';
          }
          return true;
        },
      },
    ],
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
    package: '@notionhq/notion-mcp-server',
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







  // AWS - Cloud infrastructure and services
  {
    id: 'ore',
    name: 'Core (AWS)',
    description: 'Central control and recommendation for AWS MCP servers',
    detailedDescription: [
      'AI processing pipeline and federation to other AWS MCP servers',
      'Provides clear plans for building AWS solutions',
    ],
    category: 'aws',
    package: 'awslabs.core-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.core-mcp-server@latest', 'awslabs.core-mcp-server'],
    requiresConfig: false,
    recommended: false,
  },
  {
    id: 'aws-documentation',
    name: 'AWS Documentation',
    description: 'AWS official documentation search and markdown conversion',
    detailedDescription: [
      'Get latest AWS docs and API references',
      'Research and generate up-to-date code for any AWS service',
    ],
    category: 'aws',
    package: 'awslabs.aws-documentation-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.aws-documentation-mcp-server@latest', 'awslabs.aws-documentation-mcp-server'],
    requiresConfig: false,
  },
  {
    id: 'cdk-mcp-server',
    name: 'AWS CDK',
    description: 'AWS CDK code generation and security detection',
    detailedDescription: [
      'Infrastructure as code with security compliance and best practices',
      'CDK Nag integration for security checks',
    ],
    category: 'aws',
    package: 'awslabs.cdk-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.cdk-mcp-server@latest', 'awslabs.cdk-mcp-server'],
    requiresConfig: false,
  },
  {
    id: 'cost-analysis',
    name: 'AWS Cost Explorer',
    description: 'Cost analysis and optimization tools',
    detailedDescription: [
      'Estimate AWS service costs before deployment',
      'Budget planning and cost optimization insights',
    ],
    category: 'aws',
    package: 'awslabs.aws-pricing-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.aws-pricing-mcp-server@latest', 'awslabs.aws-pricing-mcp-server'],
    requiresConfig: true,
    configOptions: [
      {
        key: 'AWS_PROFILE',
        type: 'string',
        label: 'AWS Profile',
        description: 'AWS profile to use for authentication',
        required: false,
        default: 'default',
      },
    ],
  },
  {
    id: 'amazon-ecs',
    name: 'Amazon ECS',
    description: 'ECS cluster configuration, deployment, and service operations',
    detailedDescription: [
      'Container orchestration and ECS application deployment',
      'Manage cluster operations and troubleshoot deployments',
    ],
    category: 'aws',
    package: 'awslabs.ecs-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.ecs-mcp-server@latest', 'awslabs.ecs-mcp-server'],
    requiresConfig: true,
    configOptions: [
      {
        key: 'AWS_PROFILE',
        type: 'string',
        label: 'AWS Profile',
        description: 'AWS profile to use for authentication',
        required: false,
        default: 'default',
      },
      {
        key: 'AWS_REGION',
        type: 'string',
        label: 'AWS Region',
        description: 'AWS region for ECS operations',
        required: true,
        default: 'us-east-1',
      },
    ],
  },
  {
    id: 'lambda-tool',
    name: 'AWS Lambda Tool',
    description: 'Lambda function execution for private AWS resource access',
    detailedDescription: [
      'Execute Lambda functions as AI tools without code changes',
      'Bridge between MCP clients and AWS Lambda functions',
    ],
    category: 'aws',
    package: 'awslabs.lambda-tool-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.lambda-tool-mcp-server@latest', 'awslabs.lambda-tool-mcp-server'],
    requiresConfig: true,
    configOptions: [
      {
        key: 'AWS_PROFILE',
        type: 'string',
        label: 'AWS Profile',
        description: 'AWS profile to use for authentication',
        required: false,
        default: 'default',
      },
      {
        key: 'LAMBDA_FUNCTION_PREFIX',
        type: 'string',
        label: 'Function Prefix',
        description: 'Prefix to filter Lambda functions',
        required: false,
      },
    ],
  },
  {
    id: 'rds',
    name: 'Amazon RDS/Aurora',
    description: 'RDS/Aurora database interaction and query capabilities',
    detailedDescription: [
      'Connect to and query RDS and Aurora databases',
      'Manage database operations and configurations',
    ],
    category: 'aws',
    package: 'awslabs.rds-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.rds-mcp-server@latest', 'awslabs.rds-mcp-server'],
    requiresConfig: true,
    configOptions: [
      {
        key: 'AWS_PROFILE',
        type: 'string',
        label: 'AWS Profile',
        description: 'AWS profile to use for authentication',
        required: false,
        default: 'default',
      },
      {
        key: 'DATABASE_URL',
        type: 'string',
        label: 'Database URL',
        description: 'RDS/Aurora database connection string',
        required: true,
        validate: (value: unknown) => {
          if (!value || typeof value !== 'string') {
            return 'Database URL is required';
          }
          return true;
        },
      },
    ],
  },
  {
    id: 's3-tables',
    name: 'S3 Tables',
    description: 'S3-based table management and SQL query support',
    detailedDescription: [
      'Query S3 data using SQL-like syntax',
      'Manage and analyze data stored in S3',
    ],
    category: 'aws',
    package: 'awslabs.s3-tables-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.s3-tables-mcp-server@latest', 'awslabs.s3-tables-mcp-server'],
    requiresConfig: true,
    configOptions: [
      {
        key: 'AWS_PROFILE',
        type: 'string',
        label: 'AWS Profile',
        description: 'AWS profile to use for authentication',
        required: false,
        default: 'default',
      },
    ],
  },
  {
    id: 'elasticache',
    name: 'Amazon ElastiCache',
    description: 'ElastiCache cluster management and caching operations',
    detailedDescription: [
      'Manage Redis and Memcached clusters',
      'Configure caching strategies and monitor performance',
    ],
    category: 'aws',
    package: 'awslabs.elasticache-mcp-server',
    command: 'uvx',
    args: ['--from', 'awslabs.elasticache-mcp-server@latest', 'awslabs.elasticache-mcp-server'],
    requiresConfig: true,
    configOptions: [
      {
        key: 'AWS_PROFILE',
        type: 'string',
        label: 'AWS Profile',
        description: 'AWS profile to use for authentication',
        required: false,
        default: 'default',
      },
      {
        key: 'AWS_REGION',
        type: 'string',
        label: 'AWS Region',
        description: 'AWS region for ElastiCache operations',
        required: true,
        default: 'us-east-1',
      },
    ],
  },
];

// Presets
export const presets: Record<string, string[]> = {
  recommended: ['github', 'filesystem', 'context7', 'sequential-thinking', 'serena'],
  dev: ['github', 'filesystem', 'context7', 'sequential-thinking', 'postgresql', 'docker', 'puppeteer'],
  data: ['postgresql'],
  web: ['puppeteer', 'filesystem', 'github'],
  productivity: ['slack', 'notion', 'memory'],
  aws: ['ore', 'aws-documentation', 'cdk-mcp-server', 'amazon-ecs', 'lambda-tool'],
};
