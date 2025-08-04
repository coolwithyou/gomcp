import { MCPServer, ServerConfig } from './types.js';
export interface GomcpConfig {
    version: string;
    installedServers: InstalledServer[];
    presets: Record<string, string[]>;
    lastUpdated: string;
    language?: 'en' | 'ko' | 'zh' | 'es' | 'ja';
    lastUpdateCheck?: string;
}
export interface InstalledServer {
    id: string;
    name: string;
    installedAt: string;
    config?: ServerConfig;
}
export declare function ensureConfigDir(): Promise<void>;
export declare function loadConfig(): Promise<GomcpConfig | null>;
export declare function saveConfig(config: GomcpConfig): Promise<void>;
export declare function addInstalledServer(server: MCPServer, config?: ServerConfig): Promise<void>;
export declare function getInstalledServers(): Promise<InstalledServer[]>;
export declare function saveCustomPreset(name: string, serverIds: string[]): Promise<void>;
export declare function getCustomPresets(): Promise<Record<string, string[]>>;
export declare function exportConfig(outputPath: string): Promise<void>;
export declare function getLanguagePreference(): Promise<'en' | 'ko' | 'zh' | 'es' | 'ja'>;
export declare function setLanguagePreference(language: 'en' | 'ko' | 'zh' | 'es' | 'ja'): Promise<void>;
export declare function importConfig(inputPath: string): Promise<void>;
//# sourceMappingURL=config.d.ts.map