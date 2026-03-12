// src/lib/ai/types.ts
// Shared type definitions for the centralised AI service layer.
// All capabilities, requests, and responses conform to these contracts.

import type { ZodType } from 'zod'

// ── Model registry ──────────────────────────────────────────────────────────

export const MODEL_IDS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-5-20250514',
  'claude-haiku-3',
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
  structuredOutput?: ZodType
  batchMode?: boolean
}

// ── Capability definition ───────────────────────────────────────────────────

export interface AICapability {
  id: string
  model: ModelId
  maxTokens: number
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
