// src/lib/ai/types.ts
// Shared type definitions for the centralised AI service layer.
// All capabilities, requests, and responses conform to these contracts.

import type { ZodObject, ZodRawShape } from 'zod'

// ── Model registry ──────────────────────────────────────────────────────────

export const MODEL_IDS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-5-20250514',
  'claude-haiku-4-5-20251001',
] as const

export type ModelId = (typeof MODEL_IDS)[number]

// ── Request context ─────────────────────────────────────────────────────────

export interface RequestContext {
  userId: string
  businessKey?: string
  pageContext?: string
  [key: string]: unknown
}

// ── Feature flags ───────────────────────────────────────────────────────────

export interface ThinkingConfig {
  /**
   * Fixed thinking budget in tokens.
   * Used when adaptive is false/undefined.
   * Required unless adaptive is true.
   */
  budgetTokens?: number
  /**
   * When true, the budget is calculated per-call using detectComplexity()
   * against the user message content. budgetTokens is ignored.
   * Use for interactive capabilities where prompt complexity varies widely.
   */
  adaptive?: boolean
  /** Minimum adaptive budget (tokens). Default: 2 000. */
  minBudget?: number
  /** Maximum adaptive budget (tokens). Default: 16 000. */
  maxBudget?: number
}

/** Configuration for Anthropic's server-side web search tool. */
export interface WebSearchConfig {
  /** Maximum number of searches Claude can perform per request (maps to max_uses). Default: 5. */
  maxResults?: number
}

export interface AIFeatures {
  thinking?: ThinkingConfig
  /**
   * Extract ATO/legislation/case-law citations from the text response via regex.
   * Populated into AIResponse.citations alongside any web search citations.
   */
  citations?: boolean
  /**
   * Enable Anthropic's server-side web search tool.
   * Pass a config object to set maxResults; pass true for defaults.
   * Incompatible with structuredOutput (cannot force tool_choice when web search is active).
   */
  webSearch?: boolean | WebSearchConfig
  /** When set, forces tool_use with this schema — returns structuredData in AIResponse. */
  structuredOutput?: ZodObject<ZodRawShape>
  batchMode?: boolean
  /**
   * When enabled, memories for this founder+capability are recalled before execute()
   * and injected into the system prompt as a [MEMORY CONTEXT] block.
   * Incompatible with batchExecute (batch requests are fire-and-forget; no per-call context).
   */
  memory?: { enabled: boolean }
  /**
   * Anthropic Files API file IDs to attach as document blocks to the first user message.
   * Obtain IDs via uploadAndCacheFile() — files are uploaded once and reused across calls.
   */
  fileIds?: string[]
  /** Enable Anthropic's server-side code execution sandbox tool. */
  codeExecution?: boolean
  /**
   * MCP server names (keys from MCP_SERVER_REGISTRY) to connect for this capability.
   * Each named server is resolved to its connection config and injected as mcp_servers.
   */
  mcpServers?: string[]
}

// ── Capability definition ───────────────────────────────────────────────────

export interface AICapability {
  id: string
  model: ModelId
  maxTokens: number
  /** Sampling temperature. Default: 1.0 (Anthropic default). Use < 1.0 for deterministic outputs. */
  temperature?: number
  features: AIFeatures
  systemPrompt: string | ((ctx: RequestContext) => string)
}

// ── Response types ──────────────────────────────────────────────────────────

export interface Citation {
  type: string
  title: string
  url?: string
  content?: string
}

export interface AIResponse {
  content: string
  thinking?: string
  citations?: Citation[]
  /** Populated when the capability has features.structuredOutput set. */
  structuredData?: unknown
  /** Thinking budget that was requested (tokens). Present when thinking was enabled. */
  thinkingBudget?: number
  /** Result of a code execution sandbox run. Present when features.codeExecution is set. */
  sandboxResult?: { output: string; returnCode: number; success: boolean }
  usage: {
    inputTokens: number
    outputTokens: number
  }
  model: string
}

// ── Factory helper ──────────────────────────────────────────────────────────

/** Create a capability with sensible defaults (features defaults to {}). */
export function createCapability(
  config: Omit<AICapability, 'features'> & { features?: AIFeatures }
): AICapability {
  return {
    ...config,
    features: config.features ?? {},
  }
}
