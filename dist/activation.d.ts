export interface ServerActivationStatus {
    id: string;
    name: string;
    isInstalled: boolean;
    isActivated: boolean;
    activationType?: 'all' | 'specific' | 'permission' | 'none';
}
export declare function getProjectServersActivationStatus(): Promise<ServerActivationStatus[]>;
export declare function displayActivationStatus(): Promise<void>;
export declare function activateServers(serverIds: string[], strategy: 'all' | 'specific' | 'permission'): Promise<void>;
export declare function deactivateServers(serverIds: string[]): Promise<void>;
export declare function hasClaudeSettings(): Promise<boolean>;
export declare function initializeClaudeSettings(): Promise<void>;
//# sourceMappingURL=activation.d.ts.map