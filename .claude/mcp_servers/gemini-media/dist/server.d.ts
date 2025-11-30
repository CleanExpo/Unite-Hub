/**
 * MCP server implementation
 */
import type { GeminiConfig } from './types/index.js';
export interface ServerConfig {
    gemini: GeminiConfig;
    transport: 'stdio' | 'sse';
    port?: number;
}
export declare class Server {
    private readonly mcpServer;
    private readonly geminiService;
    private readonly config;
    constructor(config: ServerConfig);
    /**
     * Register all tools with the MCP server
     */
    private registerTools;
    /**
     * Start the server with the configured transport
     */
    start(): Promise<void>;
    /**
     * Start the server with stdio transport
     */
    private startWithStdio;
    /**
     * Start the server with SSE transport
     */
    private startWithSSE;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
}
