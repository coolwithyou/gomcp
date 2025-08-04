import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { MCPServer, ServerConfig } from '../types';

// Create manual mocks
const mockExeca = jest.fn();
const mockFs = {
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
};

const mockOraInstance = {
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  text: '',
};

const mockOra = () => mockOraInstance;

// Mock the modules
jest.unstable_mockModule('execa', () => ({ execa: mockExeca }));
jest.unstable_mockModule('fs/promises', () => mockFs);
jest.unstable_mockModule('ora', () => ({ default: jest.fn(() => mockOra()) }));
jest.unstable_mockModule('chalk', () => ({
  default: {
    bold: (text: string) => text,
    green: (text: string) => text,
    red: (text: string) => text,
    yellow: (text: string) => text,
    cyan: (text: string) => text,
    gray: (text: string) => text,
  },
}));
jest.unstable_mockModule('inquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
}));

// Import after mocking
const {
  installServers,
  installPreset,
  verifyInstallations,
  backupConfig,
  restoreConfig,
} = await import('../installer');

// Import servers
import { servers } from '../servers';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  console.log = jest.fn();
  console.error = jest.fn();
  process.env.HOME = '/home/testuser';
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Installer', () => {
  describe('Core Installation', () => {
    const mockServer: MCPServer = {
      id: 'test-server',
      name: 'Test Server',
      description: 'A test server',
      category: 'development',
      package: '@test/server',
      requiresConfig: true,
      configOptions: [],
    };

    beforeEach(() => {
      (servers as any).push(mockServer);
    });

    afterEach(() => {
      const index = servers.findIndex((s) => s.id === 'test-server');
      if (index > -1) {
        servers.splice(index, 1);
      }
    });

    it('should install server with configuration', async () => {
      mockExeca.mockResolvedValue({ stdout: '', stderr: '' } as any);

      const configs = new Map<string, ServerConfig>([['test-server', { API_KEY: 'test-api-key' }]]);
      await installServers(['test-server'], configs, 'user', false);

      expect(mockExeca).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['mcp', 'add', 'test-server', '-s', 'user']),
        expect.objectContaining({
          env: expect.objectContaining({
            API_KEY: 'test-api-key',
          }),
        })
      );
    });

    it('should handle installation failures gracefully', async () => {
      mockExeca.mockRejectedValue(new Error('Installation failed'));

      await installServers(['test-server'], new Map(), 'user', false);

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('errors.errorDetails'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Failed to install'));
    });

    it('should enforce scope restrictions', async () => {
      const projectOnlyServer: MCPServer = {
        id: 'project-only',
        name: 'Project Only Server',
        description: 'Must be installed at project level',
        category: 'development',
        package: '@test/project-only',
        requiresConfig: false,
        forceProjectScope: true,
      };

      (servers as any).push(projectOnlyServer);

      await installServers(['project-only'], new Map(), 'user', false);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('installation.projectOnlyServer')
      );
      expect(mockExeca).not.toHaveBeenCalled();

      const index = servers.findIndex((s) => s.id === 'project-only');
      if (index > -1) {
        servers.splice(index, 1);
      }
    });
  });

  describe('Preset Installation', () => {
    it('should install valid preset', async () => {
      mockExeca.mockResolvedValue({ stdout: '', stderr: '' } as any);

      await installPreset('recommended', 'user', false);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Installing recommended preset')
      );
      expect(mockExeca).toHaveBeenCalled();
    });

    it('should reject unknown preset', async () => {
      await expect(installPreset('unknown-preset', 'user', false)).rejects.toThrow(
        'Unknown preset: unknown-preset'
      );
    });
  });

  describe('Server Verification', () => {
    it('should verify server installations', async () => {
      const mockOutput = 'github: npx -y @modelcontextprotocol/server-github - ✓ Connected\nfilesystem: npx -y @modelcontextprotocol/server-filesystem - ✓ Connected';
      mockExeca.mockResolvedValue({ stdout: mockOutput, stderr: '' } as any);

      await verifyInstallations();

      expect(mockExeca).toHaveBeenCalledWith('claude', ['mcp', 'list']);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MCP Server Status Report'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GitHub - Connected'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('File System - Connected'));
    });
  });

  describe('Backup and Restore', () => {
    const mockUserConfig = {
      mcpServers: {
        github: { package: '@mcp/github' },
      },
    };

    const mockProjectConfig = {
      servers: ['filesystem'],
    };

    it('should create backup of configurations', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('.claude/config.json')) {
          return JSON.stringify(mockUserConfig);
        } else if (typeof filePath === 'string' && filePath.includes('.mcp.json')) {
          return JSON.stringify(mockProjectConfig);
        }
        throw new Error('Not found');
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      await backupConfig();

      const backupData = JSON.parse(mockFs.writeFile.mock.calls[0][1] as string);
      expect(backupData.configs.user).toEqual(mockUserConfig);
      expect(backupData.configs.project).toEqual(mockProjectConfig);
      expect(backupData.version).toBe('2.0');
    });

    it('should handle empty configurations', async () => {
      mockFs.access.mockRejectedValue(new Error('Not found'));

      await backupConfig();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No user or project MCP configurations')
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should restore configurations from backup', async () => {
      const mockBackup = {
        version: '2.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        configs: {
          user: { mcpServers: { github: {} } },
          project: { servers: ['filesystem'] },
        },
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockBackup));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await restoreConfig('backup.json');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.claude/config.json'),
        JSON.stringify(mockBackup.configs.user, null, 2)
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.mcp.json'),
        JSON.stringify(mockBackup.configs.project, null, 2)
      );
    });

    it('should handle restore errors gracefully', async () => {
      mockFs.access.mockRejectedValue(new Error('Not found'));

      await restoreConfig('missing.json');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cannot find backup file'));
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });
});
