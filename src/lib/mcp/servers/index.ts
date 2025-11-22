/**
 * MCP Servers Index
 *
 * Central registry of all MCP server wrappers.
 * Import specific servers instead of all to enable progressive disclosure.
 *
 * @example
 * // Good: Import only what you need
 * import * as playwright from '@/lib/mcp/servers/playwright';
 * import { thinkDeep } from '@/lib/mcp/servers/sherlock-think';
 *
 * // Available but not recommended for context efficiency:
 * import { servers } from '@/lib/mcp/servers';
 */

import { getMCPClient } from '../client';

// Server metadata for discovery
export interface ServerMetadata {
  name: string;
  description: string;
  path: string;
  toolCount: number;
  categories: string[];
}

// Registry of available servers
export const serverRegistry: ServerMetadata[] = [
  {
    name: 'playwright',
    description: 'Browser automation for testing and web scraping',
    path: '@/lib/mcp/servers/playwright',
    toolCount: 22,
    categories: ['testing', 'automation', 'browser', 'e2e'],
  },
  {
    name: 'sherlock-think-alpha',
    description: 'Sherlock Think Alpha (1.84M context) for deep analysis and large codebase understanding',
    path: '@/lib/mcp/servers/sherlock-think',
    toolCount: 2,
    categories: ['ai', 'analysis', 'codebase', 'security', 'architecture'],
  },
  {
    name: 'dataforseo',
    description: 'DataForSEO API for SEO intelligence (SERP, competitors, keywords, backlinks, local GEO)',
    path: '@/lib/mcp/servers/dataforseo',
    toolCount: 15,
    categories: ['seo', 'marketing', 'keywords', 'backlinks', 'serp', 'local'],
  },
];

/**
 * Search for servers by keyword
 *
 * @example
 * const seoServers = searchServers('seo');
 * // Returns servers related to SEO
 */
export function searchServers(query: string): ServerMetadata[] {
  const q = query.toLowerCase();
  return serverRegistry.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.categories.some((c) => c.includes(q))
  );
}

/**
 * Get server by name
 */
export function getServer(name: string): ServerMetadata | undefined {
  return serverRegistry.find((s) => s.name === name);
}

/**
 * List all available servers
 */
export function listServers(): ServerMetadata[] {
  return serverRegistry;
}

/**
 * Get servers by category
 *
 * @example
 * const testingServers = getServersByCategory('testing');
 */
export function getServersByCategory(category: string): ServerMetadata[] {
  return serverRegistry.filter((s) => s.categories.includes(category));
}

// Initialize MCP client with server configurations
export function initializeMCPClient(): void {
  const client = getMCPClient();

  // Register Playwright
  client.registerServer('playwright', {
    command: 'npx',
    args: ['@playwright/mcp@latest'],
    env: {
      PLAYWRIGHT_BROWSER: 'chromium',
      PLAYWRIGHT_HEADLESS: 'true',
    },
  });

  // Register Sherlock Think Alpha
  client.registerServer('sherlock-think-alpha', {
    command: 'node',
    args: ['.claude/mcp_servers/sherlock-think/index.js'],
  });

  // Register DataForSEO
  client.registerServer('dataforseo', {
    command: 'npx',
    args: ['dataforseo-mcp-server'],
    env: {
      DATAFORSEO_API_LOGIN: process.env.DATAFORSEO_API_LOGIN || '',
      DATAFORSEO_API_PASSWORD: process.env.DATAFORSEO_API_PASSWORD || '',
    },
  });
}

// Export individual server modules for convenience
export * as playwright from './playwright';
export * as sherlock from './sherlock-think';
export * as dataforseo from './dataforseo';
