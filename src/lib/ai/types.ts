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
  budgetTokens: number
}

export interface AIFeatures {
  thinking?: ThinkingConfig
  citations?: boolean
  webSearch?: boolean
  /** When set, forces tool_use with this schema — returns structuredData in AIResponse. */
  structuredOutput?: ZodObject<ZodRawShape>
  batchMode?: boolean
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
