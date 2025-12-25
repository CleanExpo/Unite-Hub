/**
 * MCP Server for Suburb Authority Data
 * Provides Scout Agent access to suburb_authority_substrate view
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { createLogger } from './utils/logger.js';
import { SuburbaseService } from './services/supabase.js';
import { createQuerySuburbAuthorityTool } from './tools/query-suburb-authority.js';
import { createFindGeographicGapsTool } from './tools/find-geographic-gaps.js';
import { createFindContentGapsTool } from './tools/find-content-gaps.js';
import type { SuburbAuthorityConfig } from './types/index.js';

const log = createLogger('Server');

export interface ServerConfig {
  supabase: SuburbAuthorityConfig;
  transport: 'stdio' | 'sse';
  port?: number;
}

export class Server {
  private readonly mcpServer: McpServer;
  private readonly supabaseService: SuburbaseService;
  private readonly config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;

    // Initialize Supabase service
    this.supabaseService = new SuburbaseService(config.supabase);

    // Create MCP server
    this.mcpServer = new McpServer({
      name: 'mcp-suburb-authority',
      version: '1.0.0'
    });

    // Register tools
    this.registerTools();

    log.info('MCP Suburb Authority server initialized');
  }

  /**
   * Register all tools with the MCP server
   */
  private registerTools(): void {
    // Create tools
    const querySuburbAuthorityTool = createQuerySuburbAuthorityTool(this.supabaseService);
    const findGeographicGapsTool = createFindGeographicGapsTool(this.supabaseService);
    const findContentGapsTool = createFindContentGapsTool(this.supabaseService);

    // Register tools
    this.mcpServer.tool(
      querySuburbAuthorityTool.name,
      querySuburbAuthorityTool.description,
      querySuburbAuthorityTool.inputSchema.shape,
      querySuburbAuthorityTool.callback
    );

    this.mcpServer.tool(
      findGeographicGapsTool.name,
      findGeographicGapsTool.description,
      findGeographicGapsTool.inputSchema.shape,
      findGeographicGapsTool.callback
    );

    this.mcpServer.tool(
      findContentGapsTool.name,
      findContentGapsTool.description,
      findContentGapsTool.inputSchema.shape,
      findContentGapsTool.callback
    );

    log.info('All tools registered (3 tools)');
  }

  /**
   * Start the server with configured transport
   */
  async start(): Promise<void> {
    try {
      if (this.config.transport === 'stdio') {
        await this.startWithStdio();
      } else if (this.config.transport === 'sse') {
        await this.startWithSSE();
      } else {
        throw new Error(`Unsupported transport: ${this.config.transport}`);
      }
    } catch (error) {
      log.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Start server with stdio transport (for Claude Code integration)
   */
  private async startWithStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    log.info('MCP server started with stdio transport');
  }

  /**
   * Start server with SSE transport (for HTTP-based clients)
   */
  private async startWithSSE(): Promise<void> {
    const port = this.config.port || 3009;
    const transport = new StreamableHTTPServerTransport('/message', port);

    // Health check endpoint
    transport.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    await this.mcpServer.connect(transport);
    log.info(`MCP server started with SSE transport on port ${port}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.mcpServer.close();
    log.info('MCP server shut down');
  }
}
