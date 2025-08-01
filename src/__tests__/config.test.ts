import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import * as path from 'path';
import type { MCPServer } from '../types';
import type { GomcpConfig } from '../config';

// Create manual mocks
const mockFs = {
  mkdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
};

// Mock the module
jest.unstable_mockModule('fs/promises', () => mockFs);
jest.unstable_mockModule('chalk', () => ({
  default: {
    green: (text: string) => text,
  },
}));

describe('Config', () => {
  const HOME = '/test-home';
  const CONFIG_DIR = path.join(HOME, '.gomcp');
  const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

  let loadConfig: any;
  let saveConfig: any;
  let addInstalledServer: any;
  let getInstalledServers: any;
  let saveCustomPreset: any;
  let getCustomPresets: any;
  let exportConfig: any;
  let importConfig: any;

  beforeAll(async () => {
    const configModule = await import('../config');
    loadConfig = configModule.loadConfig;
    saveConfig = configModule.saveConfig;
    addInstalledServer = configModule.addInstalledServer;
    getInstalledServers = configModule.getInstalledServers;
    saveCustomPreset = configModule.saveCustomPreset;
    getCustomPresets = configModule.getCustomPresets;
    exportConfig = configModule.exportConfig;
    importConfig = configModule.importConfig;
  });

  const mockServer: MCPServer = {
    id: 'test-server',
    name: 'Test Server',
    description: 'A test server',
    category: 'development',
    package: '@test/server',
    requiresConfig: false,
  };

  const mockConfig: GomcpConfig = {
    version: '1.0.0',
    installedServers: [
      {
        id: 'existing-server',
        name: 'Existing Server',
        installedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    presets: {
      custom: ['server1', 'server2'],
    },
    lastUpdated: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HOME = HOME;

    // Set up default mock implementations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readFile.mockRejectedValue(new Error('File not found'));
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  describe('Core Config Operations', () => {
    it('should load existing config', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await loadConfig();

      expect(result).toEqual(mockConfig);
      expect(mockFs.readFile).toHaveBeenCalledWith(CONFIG_FILE, 'utf-8');
    });

    it('should return null if config does not exist', async () => {
      const result = await loadConfig();
      expect(result).toBeNull();
    });

    it('should save config with updated timestamp', async () => {
      await saveConfig(mockConfig);

      expect(mockFs.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFile.mock.calls[0][1] as string);
      expect(savedData.lastUpdated).toBeDefined();
      expect(new Date(savedData.lastUpdated).getTime()).toBeGreaterThan(0);
    });
  });

  describe('Server Management', () => {
    it('should add new server to config', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      await addInstalledServer(mockServer);

      expect(mockFs.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFile.mock.calls[0][1] as string);
      expect(savedData.installedServers).toHaveLength(2);
      expect(savedData.installedServers[1].id).toBe('test-server');
    });

    it('should update existing server', async () => {
      const configWithTestServer = {
        ...mockConfig,
        installedServers: [mockConfig.installedServers[0], {
          id: 'test-server',
          name: 'Old Name',
          installedAt: '2023-01-01T00:00:00.000Z',
        }],
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(configWithTestServer));

      await addInstalledServer(mockServer);

      const savedData = JSON.parse(mockFs.writeFile.mock.calls[0][1] as string);
      expect(savedData.installedServers).toHaveLength(2);
      expect(savedData.installedServers[1].name).toBe('Test Server');
    });

    it('should get installed servers', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await getInstalledServers();

      expect(result).toEqual(mockConfig.installedServers);
    });
  });

  describe('Preset Management', () => {
    it('should save custom preset', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      await saveCustomPreset('mypreset', ['server1', 'server2']);

      const savedData = JSON.parse(mockFs.writeFile.mock.calls[0][1] as string);
      expect(savedData.presets.mypreset).toEqual(['server1', 'server2']);
    });

    it('should get custom presets', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await getCustomPresets();

      expect(result).toEqual(mockConfig.presets);
    });
  });

  describe('Import/Export', () => {
    it('should export config', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      await exportConfig('/tmp/config-export.json');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/tmp/config-export.json',
        JSON.stringify(mockConfig, null, 2)
      );
    });

    it('should import valid config', async () => {
      const importPath = '/tmp/import.json';
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockConfig)) // For import
        .mockResolvedValueOnce(JSON.stringify({})); // For existing config

      await importConfig(importPath);

      expect(mockFs.readFile).toHaveBeenCalledWith(importPath, 'utf-8');
      expect(mockFs.writeFile).toHaveBeenCalledWith(CONFIG_FILE, expect.any(String));
    });
  });
});
