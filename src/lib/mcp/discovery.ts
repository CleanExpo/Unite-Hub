/**
 * MCP Tool Discovery System
 *
 * Enables progressive disclosure of tools - agents can search for tools
 * they need instead of loading all tool definitions upfront.
 *
 * @example
 * import { searchTools, getToolDefinition } from '@/lib/mcp/discovery';
 *
 * // Find tools for a task
 * const tools = searchTools('screenshot');
 * // Returns: [{ server: 'playwright', tool: 'takeScreenshot', ... }]
 *
 * // Get specific tool definition
 * const def = getToolDefinition('playwright', 'takeScreenshot');
 */

export interface ToolInfo {
  server: string;
  tool: string;
  description: string;
  category: string;
  inputSummary: string;
}

// Tool registry - manually maintained for fast lookup without loading servers
const toolRegistry: ToolInfo[] = [
  // Playwright tools
  {
    server: 'playwright',
    tool: 'navigate',
    description: 'Navigate to a URL',
    category: 'browser',
    inputSummary: '{ url: string }',
  },
  {
    server: 'playwright',
    tool: 'click',
    description: 'Click an element on the page',
    category: 'interaction',
    inputSummary: '{ element: string, ref: string, button?: string }',
  },
  {
    server: 'playwright',
    tool: 'type',
    description: 'Type text into an element',
    category: 'interaction',
    inputSummary: '{ element: string, ref: string, text: string }',
  },
  {
    server: 'playwright',
    tool: 'takeScreenshot',
    description: 'Take screenshot of page or element',
    category: 'capture',
    inputSummary: '{ filename?: string, fullPage?: boolean }',
  },
  {
    server: 'playwright',
    tool: 'snapshot',
    description: 'Get accessibility snapshot of current page',
    category: 'capture',
    inputSummary: '{}',
  },
  {
    server: 'playwright',
    tool: 'fillForm',
    description: 'Fill multiple form fields at once',
    category: 'interaction',
    inputSummary: '{ fields: Array<{ name, type, ref, value }> }',
  },
  {
    server: 'playwright',
    tool: 'waitFor',
    description: 'Wait for text, text to disappear, or time',
    category: 'control',
    inputSummary: '{ text?: string, textGone?: string, time?: number }',
  },
  {
    server: 'playwright',
    tool: 'evaluate',
    description: 'Evaluate JavaScript on page',
    category: 'advanced',
    inputSummary: '{ function: string }',
  },
  {
    server: 'playwright',
    tool: 'login',
    description: 'Login to a site (convenience function)',
    category: 'convenience',
    inputSummary: '(url, email, password, emailRef?, passwordRef?, submitRef?)',
  },
  {
    server: 'playwright',
    tool: 'hasText',
    description: 'Check if page contains text (filtered in code)',
    category: 'convenience',
    inputSummary: '(searchText: string) => boolean',
  },

  // Sherlock Think Alpha tools
  {
    server: 'sherlock-think-alpha',
    tool: 'thinkDeep',
    description: 'Deep analysis with 1.84M context window',
    category: 'analysis',
    inputSummary: '{ prompt: string, context: string, system_prompt?: string }',
  },
  {
    server: 'sherlock-think-alpha',
    tool: 'analyzeCodebase',
    description: 'Structured codebase analysis with patterns and issues',
    category: 'analysis',
    inputSummary: '{ task: string, files: Record<string, string> }',
  },
  {
    server: 'sherlock-think-alpha',
    tool: 'quickSecurityAudit',
    description: 'Security audit returning only critical findings',
    category: 'convenience',
    inputSummary: '(files: Record<string, string>) => string[]',
  },
  {
    server: 'sherlock-think-alpha',
    tool: 'performanceAnalysis',
    description: 'Performance analysis with top 5 recommendations',
    category: 'convenience',
    inputSummary: '(files: Record<string, string>) => string[]',
  },

  // DataForSEO tools
  {
    server: 'dataforseo',
    tool: 'serpGoogle',
    description: 'Get Google SERP results for a keyword',
    category: 'serp',
    inputSummary: '{ keyword: string, location_code?: number }',
  },
  {
    server: 'dataforseo',
    tool: 'keywordData',
    description: 'Get keyword search volume and competition',
    category: 'keywords',
    inputSummary: '{ keywords: string[], location_code?: number }',
  },
  {
    server: 'dataforseo',
    tool: 'getCompetitors',
    description: 'Get competitors for a domain',
    category: 'domain',
    inputSummary: '{ domain: string, location_code?: number }',
  },
  {
    server: 'dataforseo',
    tool: 'getBacklinks',
    description: 'Get backlinks for a target URL',
    category: 'backlinks',
    inputSummary: '{ target: string, limit?: number }',
  },
  {
    server: 'dataforseo',
    tool: 'checkPosition',
    description: 'Check SERP position for domain on keyword',
    category: 'convenience',
    inputSummary: '(keyword, domain, locationCode?) => number | null',
  },
  {
    server: 'dataforseo',
    tool: 'highValueKeywords',
    description: 'Get keywords with volume > 100 and low competition',
    category: 'convenience',
    inputSummary: '(seedKeywords, locationCode?) => KeywordData[]',
  },
  {
    server: 'dataforseo',
    tool: 'keywordGap',
    description: 'Find keywords competitors rank for but you dont',
    category: 'convenience',
    inputSummary: '(yourDomain, competitorDomain, locationCode?) => string[]',
  },
];

/**
 * Search for tools by keyword
 *
 * @param query Search query
 * @param detailLevel 'name' | 'summary' | 'full'
 * @returns Matching tools
 */
export function searchTools(
  query: string,
  detailLevel: 'name' | 'summary' | 'full' = 'summary'
): Partial<ToolInfo>[] {
  const q = query.toLowerCase();
  const matches = toolRegistry.filter(
    (t) =>
      t.tool.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.server.toLowerCase().includes(q)
  );

  switch (detailLevel) {
    case 'name':
      return matches.map((t) => ({ server: t.server, tool: t.tool }));
    case 'summary':
      return matches.map((t) => ({
        server: t.server,
        tool: t.tool,
        description: t.description,
      }));
    case 'full':
      return matches;
    default:
      return matches;
  }
}

/**
 * Get tool definition by server and name
 */
export function getToolDefinition(
  server: string,
  tool: string
): ToolInfo | undefined {
  return toolRegistry.find((t) => t.server === server && t.tool === tool);
}

/**
 * List all tools for a server
 */
export function listServerTools(server: string): ToolInfo[] {
  return toolRegistry.filter((t) => t.server === server);
}

/**
 * List all tools by category
 */
export function listToolsByCategory(category: string): ToolInfo[] {
  return toolRegistry.filter((t) => t.category === category);
}

/**
 * Get tool count per server
 */
export function getToolCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tool of toolRegistry) {
    counts[tool.server] = (counts[tool.server] || 0) + 1;
  }
  return counts;
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(toolRegistry.map((t) => t.category))];
}

export default {
  searchTools,
  getToolDefinition,
  listServerTools,
  listToolsByCategory,
  getToolCounts,
  getCategories,
};
