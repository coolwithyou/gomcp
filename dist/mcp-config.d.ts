import { MCPServer, ServerConfig } from './types.js';
export interface MCPServerConfig {
    type: 'stdio';
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export interface ProjectMCPConfig {
    mcpServers: Record<string, MCPServerConfig>;
}
export declare function readProjectMcpConfig(): Promise<ProjectMCPConfig | null>;
export declare function writeProjectMcpConfig(config: ProjectMCPConfig): Promise<void>;
export declare function addProjectServer(server: MCPServer, config?: ServerConfig): Promise<void>;
export declare function removeProjectServer(serverId: string): Promise<boolean>;
export declare function getProjectServers(): Promise<string[]>;
export declare function isServerInProject(serverId: string): Promise<boolean>;
//# sourceMappingURL=mcp-config.d.ts.map