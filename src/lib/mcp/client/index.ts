/**
 * MCP Code Execution Client
 *
 * This client enables agents to interact with MCP servers through code execution
 * rather than direct tool calls, providing:
 * - Progressive disclosure (load only needed tools)
 * - Context efficiency (filter data before returning to model)
 * - Privacy preservation (intermediate results stay in execution environment)
 * - Skills persistence (reusable code patterns)
 *
 * Based on Anthropic's enhanced MCP approach:
 * https://www.anthropic.com/engineering/mcp-and-code-execution
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPToolResult<T = unknown> {
  content: T;
  isError?: boolean;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Client for code execution pattern
 * Manages connections to MCP servers and enables programmatic tool calls
 */
export class MCPClient extends EventEmitter {
  private servers: Map<string, ChildProcess> = new Map();
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private pendingRequests: Map<number, {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = new Map();
  private requestId = 0;

  constructor() {
    super();
  }

  /**
   * Register an MCP server configuration
   */
  registerServer(name: string, config: MCPServerConfig): void {
    this.serverConfigs.set(name, config);
  }

  /**
   * Connect to an MCP server
   */
  async connectServer(name: string): Promise<void> {
    const config = this.serverConfigs.get(name);
    if (!config) {
      throw new Error(`Server '${name}' not registered`);
    }

    if (this.servers.has(name)) {
      return; // Already connected
    }

    const proc = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';

    proc.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id !== undefined) {
              const pending = this.pendingRequests.get(response.id);
              if (pending) {
                this.pendingRequests.delete(response.id);
                if (response.error) {
                  pending.reject(new Error(response.error.message));
                } else {
                  pending.resolve(response.result);
                }
              }
            }
          } catch {
            // Non-JSON output, ignore
          }
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      this.emit('log', name, data.toString());
    });

    proc.on('error', (err) => {
      this.emit('error', name, err);
    });

    proc.on('close', (code) => {
      this.servers.delete(name);
      this.emit('close', name, code);
    });

    this.servers.set(name, proc);

    // Wait for server to be ready
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Send a JSON-RPC request to an MCP server
   */
  private async sendRequest<T>(serverName: string, method: string, params: unknown): Promise<T> {
    const proc = this.servers.get(serverName);
    if (!proc) {
      throw new Error(`Server '${serverName}' not connected`);
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      proc.stdin?.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 30000);
    });
  }

  /**
   * List available tools from an MCP server
   */
  async listTools(serverName: string): Promise<MCPToolDefinition[]> {
    const result = await this.sendRequest<{ tools: MCPToolDefinition[] }>(
      serverName,
      'tools/list',
      {}
    );
    return result.tools;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool<T = unknown>(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult<T>> {
    return this.sendRequest<MCPToolResult<T>>(serverName, 'tools/call', {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * Disconnect from an MCP server
   */
  disconnectServer(name: string): void {
    const proc = this.servers.get(name);
    if (proc) {
      proc.kill();
      this.servers.delete(name);
    }
  }

  /**
   * Disconnect from all MCP servers
   */
  disconnectAll(): void {
    for (const name of this.servers.keys()) {
      this.disconnectServer(name);
    }
  }
}

// Singleton instance for convenience
let clientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!clientInstance) {
    clientInstance = new MCPClient();
  }
  return clientInstance;
}

/**
 * Helper function to call an MCP tool
 * This is the main function used by generated server wrappers
 */
export async function callMCPTool<T = unknown>(
  serverName: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<T> {
  const client = getMCPClient();

  // Ensure server is connected
  if (!client['servers'].has(serverName)) {
    await client.connectServer(serverName);
  }

  const result = await client.callTool<T>(serverName, toolName, input);

  if (result.isError) {
    throw new Error(String(result.content));
  }

  return result.content;
}

export default MCPClient;
