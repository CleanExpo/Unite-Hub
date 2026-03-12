// src/lib/mcp/types.ts
// Type definitions for the MCP (Model Context Protocol) client connector.

/** Definition of a tool exposed by an MCP server. */
export interface MCPToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/** Result returned after executing an MCP tool. */
export interface MCPToolResult {
  toolName: string
  result: unknown
  error?: string
}

/** Configuration for connecting to an MCP server. */
export interface MCPServerConfig {
  serverUrl: string
  apiKey?: string
}
