/**
 * Advanced Tool Use Client for Claude API
 *
 * Implements Anthropic's advanced tool use features:
 * - Tool Search Tool: Dynamic tool discovery (85% context reduction)
 * - Programmatic Tool Calling: Code execution for orchestration (37% token reduction)
 * - Tool Use Examples: Improved parameter accuracy (72% → 90%)
 *
 * Usage:
 *   import { createAdvancedToolClient } from '@/lib/tools';
 *
 *   const client = createAdvancedToolClient({
 *     tools: myTools,
 *     enableSearch: true,
 *     enableCodeExecution: true,
 *   });
 *
 *   // Get API-ready tool definitions
 *   const apiTools = client.getAPITools();
 *
 *   // Handle tool search requests
 *   client.handleToolSearch(query);
 */

// ============================================================================
// Types
// ============================================================================

export interface ToolExample {
  description: string;
  input: Record<string, unknown>;
  expectedBehavior?: string;
}

export interface ToolConfig {
  deferLoading: boolean;
  allowedCallers: string[];
  parallelSafe: boolean;
  retrySafe: boolean;
  cacheResults: boolean;
  cacheTtlSeconds: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  config: ToolConfig;
  examples: ToolExample[];
  categories: string[];
  keywords: string[];
  aliases: string[];
}

export interface SearchResult {
  name: string;
  description: string;
  score: number;
  categories: string[];
  keywords: string[];
}

export interface AdvancedToolClientOptions {
  tools: ToolDefinition[];
  enableSearch?: boolean;
  enableCodeExecution?: boolean;
  betaVersion?: string;
}

export interface APIToolFormat {
  type?: string;
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  defer_loading?: boolean;
  allowed_callers?: string[];
  input_examples?: Record<string, unknown>[];
}

// ============================================================================
// Constants
// ============================================================================

const BETA_HEADER = "advanced-tool-use-2025-11-20";
const TOOL_SEARCH_TYPE = "tool_search_tool_regex_20251119";
const CODE_EXECUTION_TYPE = "code_execution_20250825";

// ============================================================================
// Tool Registry
// ============================================================================

export class AdvancedToolClient {
  private tools: Map<string, ToolDefinition> = new Map();
  private loadedTools: Set<string> = new Set();
  private usageCount: Map<string, number> = new Map();
  private enableSearch: boolean;
  private enableCodeExecution: boolean;

  constructor(options: AdvancedToolClientOptions) {
    this.enableSearch = options.enableSearch ?? true;
    this.enableCodeExecution = options.enableCodeExecution ?? true;

    for (const tool of options.tools) {
      this.tools.set(tool.name, tool);
      if (!tool.config.deferLoading) {
        this.loadedTools.add(tool.name);
      }
    }
  }

  /**
   * Get beta header for API requests
   */
  getBetaHeader(): string {
    return BETA_HEADER;
  }

  /**
   * Get tools in Claude API format
   */
  getAPITools(includeDeferred = false): APIToolFormat[] {
    const apiTools: APIToolFormat[] = [];

    // Add Tool Search Tool
    if (this.enableSearch) {
      apiTools.push({
        type: TOOL_SEARCH_TYPE,
        name: "tool_search",
      });
    }

    // Add Code Execution Tool
    if (this.enableCodeExecution) {
      apiTools.push({
        type: CODE_EXECUTION_TYPE,
        name: "code_execution",
      });
    }

    // Add registered tools
    for (const tool of this.tools.values()) {
      if (tool.config.deferLoading && !includeDeferred) {
        // Include as deferred (definition still needed for search)
        apiTools.push({
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
          defer_loading: true,
          allowed_callers: tool.config.allowedCallers.length > 0
            ? tool.config.allowedCallers
            : undefined,
          input_examples: tool.examples.length > 0
            ? tool.examples.map((ex) => ex.input)
            : undefined,
        });
      } else if (!tool.config.deferLoading || includeDeferred) {
        // Include full definition
        apiTools.push({
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
          allowed_callers: tool.config.allowedCallers.length > 0
            ? tool.config.allowedCallers
            : undefined,
          input_examples: tool.examples.length > 0
            ? tool.examples.map((ex) => ex.input)
            : undefined,
        });
      }
    }

    return apiTools;
  }

  /**
   * Search for tools matching a query
   */
  searchTools(query: string, limit = 5): SearchResult[] {
    const results: Array<{ tool: ToolDefinition; score: number }> = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    for (const tool of this.tools.values()) {
      let score = 0;

      // Exact name match
      if (queryLower === tool.name.toLowerCase()) {
        score = 1.0;
      } else {
        // Name contains query
        if (tool.name.toLowerCase().includes(queryLower)) {
          score += 0.8;
        }

        // Query contains name
        if (queryLower.includes(tool.name.toLowerCase())) {
          score += 0.6;
        }

        // Keyword matches
        for (const keyword of tool.keywords) {
          if (queryTerms.some((term) => keyword.toLowerCase().includes(term))) {
            score += 0.3;
          }
        }

        // Alias matches
        for (const alias of tool.aliases) {
          if (queryTerms.some((term) => alias.toLowerCase().includes(term))) {
            score += 0.4;
          }
        }

        // Description contains query terms
        const descLower = tool.description.toLowerCase();
        for (const term of queryTerms) {
          if (descLower.includes(term)) {
            score += 0.2;
          }
        }

        // Category match
        for (const category of tool.categories) {
          if (queryLower.includes(category)) {
            score += 0.2;
          }
        }

        // Usage boost
        const usage = this.usageCount.get(tool.name) || 0;
        score += Math.min(usage * 0.01, 0.3);
      }

      if (score > 0.1) {
        results.push({ tool, score: Math.min(score, 1.0) });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit).map(({ tool, score }) => ({
      name: tool.name,
      description: tool.description.slice(0, 200),
      score: Math.round(score * 1000) / 1000,
      categories: tool.categories,
      keywords: tool.keywords.slice(0, 5),
    }));
  }

  /**
   * Load a deferred tool
   */
  loadTool(name: string): ToolDefinition | undefined {
    const tool = this.tools.get(name);
    if (tool) {
      this.loadedTools.add(name);
      return tool;
    }
    return undefined;
  }

  /**
   * Unload a tool from active context
   */
  unloadTool(name: string): void {
    this.loadedTools.delete(name);
  }

  /**
   * Record tool usage
   */
  recordUsage(name: string): void {
    this.usageCount.set(name, (this.usageCount.get(name) || 0) + 1);
  }

  /**
   * Get context statistics
   */
  getContextStats(): {
    totalTools: number;
    loadedTools: number;
    deferredTools: number;
    estimatedLoadedTokens: number;
    estimatedSavedTokens: number;
    contextReductionPercent: number;
  } {
    const total = this.tools.size;
    const loaded = this.loadedTools.size;
    const deferred = total - loaded;

    // Estimate ~500 tokens per tool definition
    const tokensPerTool = 500;
    const loadedTokens = loaded * tokensPerTool;
    const savedTokens = deferred * tokensPerTool;

    return {
      totalTools: total,
      loadedTools: loaded,
      deferredTools: deferred,
      estimatedLoadedTokens: loadedTokens,
      estimatedSavedTokens: savedTokens,
      contextReductionPercent: total > 0
        ? Math.round((savedTokens / (total * tokensPerTool)) * 100)
        : 0,
    };
  }

  /**
   * Handle a tool search request from Claude
   */
  handleToolSearch(query: string, limit = 5): {
    matchedTools: SearchResult[];
    totalMatches: number;
    query: string;
  } {
    const results = this.searchTools(query, limit);
    return {
      matchedTools: results,
      totalMatches: results.length,
      query,
    };
  }

  /**
   * Check if a tool request is from code execution
   */
  isProgrammaticCall(request: {
    caller?: { type?: string; tool_id?: string };
  }): boolean {
    return request.caller?.type === CODE_EXECUTION_TYPE;
  }

  /**
   * Get tool definition by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all programmatic tools
   */
  getProgrammaticTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).filter((tool) =>
      tool.config.allowedCallers.includes(CODE_EXECUTION_TYPE)
    );
  }
}

// ============================================================================
// Default Tool Definitions
// ============================================================================

export const DEFAULT_TOOL_CONFIG: ToolConfig = {
  deferLoading: false,
  allowedCallers: [],
  parallelSafe: true,
  retrySafe: true,
  cacheResults: false,
  cacheTtlSeconds: 300,
};

export const DEFERRED_TOOL_CONFIG: ToolConfig = {
  ...DEFAULT_TOOL_CONFIG,
  deferLoading: true,
};

export const PROGRAMMATIC_TOOL_CONFIG: ToolConfig = {
  ...DEFERRED_TOOL_CONFIG,
  allowedCallers: [CODE_EXECUTION_TYPE],
};

// ============================================================================
// Factory Functions
// ============================================================================

export function createAdvancedToolClient(
  options: AdvancedToolClientOptions
): AdvancedToolClient {
  return new AdvancedToolClient(options);
}

export function createToolDefinition(
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  options?: Partial<{
    config: Partial<ToolConfig>;
    examples: ToolExample[];
    categories: string[];
    keywords: string[];
    aliases: string[];
  }>
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    config: { ...DEFAULT_TOOL_CONFIG, ...options?.config },
    examples: options?.examples || [],
    categories: options?.categories || [],
    keywords: options?.keywords || [],
    aliases: options?.aliases || [],
  };
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Create client with tools
 *
 * ```typescript
 * const tools = [
 *   createToolDefinition(
 *     "get_user",
 *     "Get user by ID",
 *     {
 *       type: "object",
 *       properties: { userId: { type: "string" } },
 *       required: ["userId"],
 *     },
 *     {
 *       config: PROGRAMMATIC_TOOL_CONFIG,
 *       examples: [
 *         { description: "Get user", input: { userId: "usr_123" } },
 *       ],
 *       keywords: ["user", "profile", "account"],
 *     }
 *   ),
 * ];
 *
 * const client = createAdvancedToolClient({
 *   tools,
 *   enableSearch: true,
 *   enableCodeExecution: true,
 * });
 *
 * // Use with Anthropic SDK
 * const response = await anthropic.beta.messages.create({
 *   betas: [client.getBetaHeader()],
 *   model: "claude-sonnet-4-5-20250929",
 *   max_tokens: 4096,
 *   tools: client.getAPITools(),
 *   messages: [...],
 * });
 * ```
 */
