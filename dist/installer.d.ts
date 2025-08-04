import { ServerConfig, InstallScope } from './types.js';
export declare function installServers(serverIds: string[], configs: Map<string, ServerConfig>, scope?: InstallScope, force?: boolean): Promise<void>;
export declare function installPreset(presetName: string, scope?: InstallScope, force?: boolean): Promise<void>;
export declare function verifyInstallations(): Promise<void>;
export declare function listInstalledServers(scope?: InstallScope | 'all'): Promise<void>;
export declare function updateServers(): Promise<void>;
export declare function backupConfig(): Promise<void>;
export declare function backupUserConfig(): Promise<void>;
export declare function backupProjectConfig(): Promise<void>;
export declare function restoreConfig(backupPath: string): Promise<void>;
export declare function restoreUserConfig(backupPath: string): Promise<void>;
export declare function restoreProjectConfig(backupPath: string): Promise<void>;
export declare function removeServers(serverIds: string[], scope?: InstallScope): Promise<void>;
//# sourceMappingURL=installer.d.ts.map