import type {
  MCPServer,
  ConfigOption,
  ServerConfig,
  InstallResult,
  Preset,
  InstallScope,
} from '../types';

describe('Types', () => {
  describe('MCPServer', () => {
    it('should accept valid server with all fields', () => {
      const validServer: MCPServer = {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub integration',
        category: 'essential',
        package: '@mcp/github',
        requiresConfig: true,
        configOptions: [],
        command: 'test-command',
        args: ['--flag'],
        recommended: true,
      };

      expect(validServer).toBeDefined();
      expect(validServer.id).toBe('github');
      expect(validServer.category).toBe('essential');
      expect(validServer.command).toBe('test-command');
      expect(validServer.args).toEqual(['--flag']);
    });
  });

  describe('ConfigOption', () => {
    it('should accept all config option types', () => {
      const textOption: ConfigOption = {
        key: 'apiKey',
        type: 'text',
        label: 'API Key',
        required: true,
      };

      const selectOption: ConfigOption = {
        key: 'theme',
        type: 'select',
        label: 'Theme',
        required: true,
        choices: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
      };

      const optionWithValidation: ConfigOption = {
        key: 'port',
        type: 'text',
        label: 'Port',
        required: true,
        validate: (value: any) => {
          const port = parseInt(value);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Port must be between 1 and 65535';
          }
          return true;
        },
      };

      expect(textOption.type).toBe('text');
      expect(selectOption.type).toBe('select');
      expect(selectOption.choices).toHaveLength(2);
      expect(optionWithValidation.validate!('8080')).toBe(true);
      expect(optionWithValidation.validate!('0')).toBe('Port must be between 1 and 65535');
    });
  });

  describe('ServerConfig', () => {
    it('should accept any key-value pairs', () => {
      const config: ServerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://api.test.local',
        enabled: true,
        paths: ['/home/user', '/workspace'],
        nested: {
          option: 'value',
        },
      };

      expect(config.apiKey).toBe('test-key');
      expect(config.enabled).toBe(true);
      expect(config.paths).toBeInstanceOf(Array);
      expect(config.nested.option).toBe('value');
    });
  });

  describe('InstallResult', () => {
    it('should represent installation results', () => {
      const server: MCPServer = {
        id: 'test',
        name: 'Test',
        description: 'Test server',
        category: 'development',
        package: '@mcp/test',
        requiresConfig: false,
      };

      const successResult: InstallResult = {
        server,
        success: true,
      };

      const failureResult: InstallResult = {
        server,
        success: false,
        error: 'Installation failed: Network error',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.error).toBeUndefined();
      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBe('Installation failed: Network error');
    });
  });

  describe('Enums', () => {
    it('should validate preset and scope values', () => {
      const validPresets: Preset[] = ['recommended', 'dev', 'data', 'web', 'productivity'];
      const validScopes: InstallScope[] = ['user', 'project'];

      validPresets.forEach((preset) => {
        expect(preset).toMatch(/^(recommended|dev|data|web|productivity)$/);
      });

      validScopes.forEach((scope) => {
        expect(scope).toMatch(/^(user|project)$/);
      });
    });
  });

  describe('Type Guards', () => {
    function isMCPServer(obj: any): obj is MCPServer {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.description === 'string' &&
        [
          'essential',
          'development',
          'productivity',
          'data',
          'automation',
          'social',
          'search',
        ].includes(obj.category) &&
        typeof obj.package === 'string' &&
        typeof obj.requiresConfig === 'boolean'
      );
    }

    it('should validate type guards', () => {
      const validServer = {
        id: 'test',
        name: 'Test',
        description: 'Test server',
        category: 'development',
        package: '@mcp/test',
        requiresConfig: false,
      };

      const invalidServer = {
        id: 'test',
        name: 'Test',
        // missing required fields
      };

      expect(isMCPServer(validServer)).toBe(true);
      expect(isMCPServer(invalidServer)).toBe(false);
      expect(isMCPServer(null)).toBe(false);
    });
  });
});
