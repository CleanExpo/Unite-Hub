// src/lib/mcp/client.ts
// MCP client connector — communicates with MCP-compatible tool servers.

import type { MCPServerConfig, MCPToolDefinition, MCPToolResult } from './types'

/**
 * Client for interacting with an MCP (Model Context Protocol) server.
 * Provides tool discovery and execution against a configured server endpoint.
 */
export class MCPClient {
  public readonly serverUrl: string
  private readonly apiKey?: string

  constructor(config: MCPServerConfig) {
    this.serverUrl = config.serverUrl
    this.apiKey = config.apiKey
  }

  /**
   * Returns available tool definitions from the MCP server.
   * Currently a stub — returns an empty array until server wiring is complete.
   */
  getToolDefinitions(): MCPToolDefinition[] {
    return []
  }

  /**
   * Executes a named tool on the MCP server via HTTP POST.
   * Includes authorisation header when an API key is configured.
   */
  async executeTool(toolName: string, input: unknown): Promise<MCPToolResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      const response = await fetch(`${this.serverUrl}/tools/${toolName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        return {
          toolName,
          result: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const result = await response.json()
      return { toolName, result }
    } catch (err) {
      return {
        toolName,
        result: null,
        error: err instanceof Error ? err.message : 'Unknown error executing tool',
      }
    }
  }
}
