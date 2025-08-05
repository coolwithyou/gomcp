import { servers, presets } from '../servers';

describe('Servers', () => {
  describe('Server Definitions', () => {
    it('should have valid structure for all servers', () => {
      servers.forEach((server) => {
        // 기본 필드 검증
        expect(server.id).toBeDefined();
        expect(typeof server.id).toBe('string');
        expect(server.name).toBeDefined();
        expect(typeof server.name).toBe('string');
        expect(server.description).toBeDefined();
        expect(server.package).toBeDefined();
        expect(typeof server.requiresConfig).toBe('boolean');

        // 카테고리 검증
        expect([
          'essential',
          'development',
          'productivity',
          'data',
          'automation',
          'social',
          'search',
          'ai',
          'devops',
          'security',
          'blockchain',
          'jobs',
          'utilities',
          'meta',
        ]).toContain(server.category);

        // 설정이 필요한 서버는 configOptions가 있어야 함
        if (server.requiresConfig) {
          expect(server.configOptions).toBeDefined();
          expect(Array.isArray(server.configOptions)).toBe(true);
          if (server.configOptions) {
            expect(server.configOptions.length).toBeGreaterThan(0);
          }
        }
      });
    });

    it('should have unique server IDs', () => {
      const ids = servers.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Essential Servers', () => {
    it('should include required MCP servers', () => {
      const github = servers.find((s) => s.id === 'github');
      expect(github).toBeDefined();
      expect(github?.category).toBe('essential');

      const fs = servers.find((s) => s.id === 'filesystem');
      expect(fs).toBeDefined();
      expect(fs?.category).toBe('essential');

      const context7 = servers.find((s) => s.id === 'context7');
      expect(context7).toBeDefined();
      expect(context7?.category).toBe('essential');
    });
  });

  describe('Presets', () => {
    it('should have valid preset definitions', () => {
      // 기본 프리셋 존재 확인
      expect(presets.recommended).toBeDefined();
      expect(presets.dev).toBeDefined();
      expect(presets.data).toBeDefined();

      // 모든 프리셋이 유효한 서버 ID를 참조하는지 확인
      const serverIds = servers.map((s) => s.id);
      Object.entries(presets).forEach(([_presetName, serverList]) => {
        expect(serverList.length).toBeGreaterThan(0);
        serverList.forEach((serverId) => {
          expect(serverIds).toContain(serverId);
        });
      });
    });

    it('should include essential servers in recommended preset', () => {
      expect(presets.recommended).toContain('github');
      expect(presets.recommended).toContain('filesystem');
      expect(presets.recommended).toContain('context7');
      expect(presets.recommended).toContain('sequential-thinking');
      expect(presets.recommended).toContain('serena');
    });
  });
});
