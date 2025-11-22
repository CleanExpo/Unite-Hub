/**
 * MCP Code Execution Module
 *
 * This module implements Anthropic's enhanced MCP approach using code execution
 * for more efficient context management. Instead of loading all tool definitions
 * upfront, agents write code to interact with MCP servers.
 *
 * Benefits:
 * - 80-95% reduction in context token usage
 * - Progressive disclosure (load only needed tools)
 * - Data filtering in code before returning to model
 * - Privacy preservation (intermediate results stay in code)
 * - Reusable skills for common workflows
 *
 * @see https://www.anthropic.com/engineering/mcp-and-code-execution
 *
 * @example
 * // Import specific server wrapper
 * import * as playwright from '@/lib/mcp/servers/playwright';
 *
 * // Use code instead of direct tool calls
 * await playwright.navigate({ url: 'https://example.com' });
 * const hasLogin = await playwright.hasText('Login');
 *
 * if (hasLogin) {
 *   await playwright.click({ element: 'Login button', ref: 'button.login' });
 * }
 *
 * // Data stays in code - only return what's needed
 * const errors = await playwright.getErrors();
 * console.log(`Found ${errors.length} errors`);
 */

// Client
export { MCPClient, getMCPClient, callMCPTool } from './client';
export type { MCPToolResult, MCPServerConfig, MCPToolDefinition } from './client';

// Discovery
export {
  searchTools,
  getToolDefinition,
  listServerTools,
  listToolsByCategory,
  getToolCounts,
  getCategories,
} from './discovery';
export type { ToolInfo } from './discovery';

// Server registry
export {
  searchServers,
  getServer,
  listServers,
  getServersByCategory,
  initializeMCPClient,
  serverRegistry,
} from './servers';
export type { ServerMetadata } from './servers';

// Re-export server modules for convenience
export * as playwright from './servers/playwright';
export * as sherlock from './servers/sherlock-think';
export * as dataforseo from './servers/dataforseo';

// Skills
export * as seoAuditSkill from './skills/seo-audit';
export * as e2eTestingSkill from './skills/e2e-testing';
