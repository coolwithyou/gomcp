export interface ClaudePermissions {
    allow: string[];
    deny: string[];
}
export interface ClaudeLocalSettings {
    permissions?: ClaudePermissions;
    enableAllProjectMcpServers?: boolean;
    enabledMcpjsonServers?: string[];
    disabledMcpjsonServers?: string[];
}
export declare function readClaudeSettings(): Promise<ClaudeLocalSettings | null>;
export declare function writeClaudeSettings(settings: ClaudeLocalSettings): Promise<void>;
export declare function enableAllProjectServers(): Promise<void>;
export declare function enableSpecificServers(serverIds: string[]): Promise<void>;
export declare function addPermissions(permissions: string[]): Promise<void>;
export declare function removePermissions(permissions: string[]): Promise<void>;
export declare function getActivationStatus(): Promise<{
    enableAllProjectMcpServers: boolean;
    enabledServers: string[];
    disabledServers: string[];
    permissions: string[];
}>;
export declare function isServerActivated(serverId: string): Promise<boolean>;
export declare function disableSpecificServers(serverIds: string[]): Promise<void>;
//# sourceMappingURL=claude-settings.d.ts.map