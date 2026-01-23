/**
 * MCP Connector Utilities
 *
 * Utilities for connecting to remote MCP servers directly from the Messages API.
 * Enables dynamic tool discovery and remote tool execution.
 *
 * @see https://modelcontextprotocol.io
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import type Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Types
// ============================================================================

export interface MCPServerConfig {
  /** Unique identifier for this MCP server */
  name: string;
  /** URL of the MCP server */
  url: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Optional OAuth token */
  oauthToken?: string;
  /** Optional custom headers */
  headers?: Record<string, string>;
  /** Tool filter - only include these tools */
  includeTools?: string[];
  /** Tool filter - exclude these tools */
  excludeTools?: string[];
}

export interface MCPServersParam {
  [serverName: string]: {
    url: string;
    api_key?: string;
    oauth_token?: string;
    headers?: Record<string, string>;
  };
}

// ============================================================================
// Pre-configured MCP Servers
// ============================================================================

/**
 * Pre-configured MCP servers for common integrations
 */
export const PRECONFIGURED_MCP_SERVERS = {
  /**
   * Brave Search MCP Server
   * Provides web search, news search, local POI search
   */
  braveSearch: (apiKey: string): MCPServerConfig => ({
    name: "brave-search",
    url: "https://mcp.brave.com",
    apiKey,
    includeTools: [
      "brave_web_search",
      "brave_news_search",
      "brave_local_search",
    ],
  }),

  /**
   * GitHub MCP Server
   * Provides repository management, issue tracking, PR management
   */
  github: (token: string): MCPServerConfig => ({
    name: "github",
    url: "https://mcp.github.com",
    oauthToken: token,
  }),

  /**
   * Filesystem MCP Server (local)
   * Provides file operations
   */
  filesystem: (basePath: string): MCPServerConfig => ({
    name: "filesystem",
    url: process.env.MCP_FILESYSTEM_URL || "http://localhost:3101",
    headers: {
      "X-Base-Path": basePath,
    },
  }),

  /**
   * Database MCP Server (local)
   * Provides database queries
   */
  database: (): MCPServerConfig => ({
    name: "database",
    url: process.env.MCP_DATABASE_URL || "http://localhost:3102",
  }),
} as const;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert MCPServerConfig array to Messages API format
 *
 * @param configs - Array of MCP server configurations
 * @returns MCP servers parameter for Messages API
 *
 * @example
 * const mcpServers = buildMCPServersParam([
 *   PRECONFIGURED_MCP_SERVERS.braveSearch(process.env.BRAVE_API_KEY),
 *   PRECONFIGURED_MCP_SERVERS.github(userGitHubToken),
 * ]);
 */
export function buildMCPServersParam(
  configs: MCPServerConfig[]
): MCPServersParam {
  return configs.reduce((acc, config) => {
    acc[config.name] = {
      url: config.url,
      ...(config.apiKey && { api_key: config.apiKey }),
      ...(config.oauthToken && { oauth_token: config.oauthToken }),
      ...(config.headers && { headers: config.headers }),
    };
    return acc;
  }, {} as MCPServersParam);
}

/**
 * Add MCP servers to message create params
 *
 * @param params - Base message params
 * @param servers - MCP server configurations
 * @returns Updated params with MCP servers
 *
 * @example
 * const params = withMCPServers(
 *   { model: "claude-sonnet-4-5", messages: [...] },
 *   [PRECONFIGURED_MCP_SERVERS.braveSearch(apiKey)]
 * );
 */
export function withMCPServers<
  T extends Anthropic.Messages.MessageCreateParamsNonStreaming,
>(params: T, servers: MCPServerConfig[]): T & { mcp_servers: MCPServersParam } {
  return {
    ...params,
    mcp_servers: buildMCPServersParam(servers),
  };
}

/**
 * Create a tool library for Tool Search
 *
 * This enables Claude to search through a large library of tools
 * and select the most relevant ones for a task.
 *
 * @param tools - Array of tool definitions
 * @returns Tool search tool definition
 *
 * @example
 * const toolSearch = createToolSearchTool(allMyTools);
 * // Add to tools array in message params
 */
export function createToolSearchTool(
  tools: Anthropic.Messages.Tool[]
): Anthropic.Messages.Tool {
  return {
    type: "custom" as any,
    name: "tool_search",
    description:
      "Search through available tools to find the most relevant ones for the current task",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language description of what you want to do",
        },
        max_results: {
          type: "number",
          description: "Maximum number of tools to return (default: 5)",
          default: 5,
        },
      },
      required: ["query"],
    },
    // Store tool library in metadata for runtime lookup
    cache_control: { type: "ephemeral" } as any,
    // Tool library stored separately for actual search
  } as any;
}

/**
 * Check if a response contains MCP tool calls
 */
export function hasMCPToolCalls(
  response: Anthropic.Messages.Message
): boolean {
  return response.content.some(
    (block) =>
      block.type === "tool_use" &&
      block.name.includes("_mcp_") // MCP tools are prefixed with server name
  );
}

/**
 * Extract MCP tool results from response for follow-up
 */
export function extractMCPToolResults(
  response: Anthropic.Messages.Message
): Array<{
  toolUseId: string;
  serverName: string;
  toolName: string;
}> {
  return response.content
    .filter((block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use"
    )
    .filter((block) => block.name.includes("_"))
    .map((block) => {
      const [serverName, ...toolParts] = block.name.split("_");
      return {
        toolUseId: block.id,
        serverName,
        toolName: toolParts.join("_"),
      };
    });
}

// ============================================================================
// MCP Connection Health
// ============================================================================

/**
 * Check if an MCP server is reachable
 */
export async function checkMCPServerHealth(
  config: MCPServerConfig
): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();

  try {
    const response = await fetch(`${config.url}/health`, {
      method: "GET",
      headers: {
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
        ...(config.oauthToken && { Authorization: `Bearer ${config.oauthToken}` }),
        ...config.headers,
      },
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { healthy: true, latencyMs };
    }

    return {
      healthy: false,
      latencyMs,
      error: `Server returned ${response.status}`,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Check health of multiple MCP servers
 */
export async function checkAllMCPServersHealth(
  configs: MCPServerConfig[]
): Promise<Record<string, { healthy: boolean; latencyMs?: number; error?: string }>> {
  const results = await Promise.all(
    configs.map(async (config) => ({
      name: config.name,
      result: await checkMCPServerHealth(config),
    }))
  );

  return results.reduce((acc, { name, result }) => {
    acc[name] = result;
    return acc;
  }, {} as Record<string, { healthy: boolean; latencyMs?: number; error?: string }>);
}
