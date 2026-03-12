// src/lib/ai/features/web-search.ts
// Web search tool builder and result parser for the Anthropic API.

import type { Citation } from '../types'

// ── Types ───────────────────────────────────────────────────────────────────

interface WebSearchToolConfig {
  maxResults?: number
}

interface WebSearchTool {
  type: 'web_search_20250305'
  name: 'web_search'
  max_uses?: number
}

interface WebSearchResult {
  type: 'web_search_result'
  url: string
  title: string
  snippet: string
}

interface WebSearchToolResultBlock {
  type: 'web_search_tool_result'
  content: WebSearchResult[]
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a web search tool definition for the Anthropic Messages API.
 */
export function buildWebSearchTool(config?: WebSearchToolConfig): WebSearchTool {
  const tool: WebSearchTool = {
    type: 'web_search_20250305',
    name: 'web_search',
  }

  if (config?.maxResults !== undefined) {
    tool.max_uses = config.maxResults
  }

  return tool
}

/**
 * Extract citations from web_search_tool_result content blocks.
 */
export function parseWebSearchResults(blocks: unknown[]): Citation[] {
  const citations: Citation[] = []

  for (const block of blocks) {
    const b = block as Record<string, unknown>
    if (b.type !== 'web_search_tool_result') continue

    const content = (b as WebSearchToolResultBlock).content
    if (!Array.isArray(content)) continue

    for (const result of content) {
      if (result.type !== 'web_search_result') continue
      citations.push({
        type: 'web_search',
        title: result.title,
        url: result.url,
        content: result.snippet,
      })
    }
  }

  return citations
}
