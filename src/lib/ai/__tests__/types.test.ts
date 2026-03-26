// src/lib/ai/__tests__/types.test.ts
// Unit tests for shared AI type definitions and helpers

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  MODEL_IDS,
  createCapability,
  type ModelId,
  type RequestContext,
  type ThinkingConfig,
  type AIFeatures,
  type AICapability,
  type AIResponse,
  type Citation,
} from '../types'

describe('MODEL_IDS', () => {
  it('contains all supported model identifiers', () => {
    expect(MODEL_IDS).toEqual([
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-5-20250514',
      'claude-haiku-3',
    ])
  })

  it('is a readonly tuple', () => {
    // Ensure const assertion — length should be exactly 5
    expect(MODEL_IDS).toHaveLength(5)
  })
})

describe('Type contracts', () => {
  it('ModelId accepts valid model strings', () => {
    const id: ModelId = 'claude-sonnet-4-5-20250929'
    expect(MODEL_IDS).toContain(id)
  })

  it('RequestContext requires userId', () => {
    const ctx: RequestContext = { userId: 'user-123' }
    expect(ctx.userId).toBe('user-123')
  })

  it('RequestContext accepts optional fields', () => {
    const ctx: RequestContext = {
      userId: 'user-123',
      businessKey: 'dr',
      pageContext: '/dashboard',
      customField: 42,
    }
    expect(ctx.businessKey).toBe('dr')
    expect(ctx.pageContext).toBe('/dashboard')
    expect(ctx.customField).toBe(42)
  })

  it('ThinkingConfig requires budgetTokens', () => {
    const cfg: ThinkingConfig = { budgetTokens: 10000 }
    expect(cfg.budgetTokens).toBe(10000)
  })

  it('AIFeatures allows all optional fields', () => {
    const features: AIFeatures = {
      thinking: { budgetTokens: 5000 },
      citations: true,
      webSearch: true,
      structuredOutput: z.object({ name: z.string() }),
      batchMode: false,
    }
    expect(features.thinking?.budgetTokens).toBe(5000)
    expect(features.citations).toBe(true)
    expect(features.webSearch).toBe(true)
    expect(features.batchMode).toBe(false)
  })

  it('AICapability supports static systemPrompt', () => {
    const cap: AICapability = {
      id: 'test',
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024,
      features: {},
      systemPrompt: 'You are a test assistant.',
    }
    expect(cap.systemPrompt).toBe('You are a test assistant.')
  })

  it('AICapability supports dynamic systemPrompt function', () => {
    const cap: AICapability = {
      id: 'test',
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024,
      features: {},
      systemPrompt: (ctx) => `Hello ${ctx.userId}`,
    }
    expect(typeof cap.systemPrompt).toBe('function')
    if (typeof cap.systemPrompt === 'function') {
      expect(cap.systemPrompt({ userId: 'phill' })).toBe('Hello phill')
    }
  })

  it('AIResponse contains content and usage', () => {
    const response: AIResponse = {
      content: 'Hello world',
      usage: { inputTokens: 100, outputTokens: 50 },
      model: 'claude-sonnet-4-5-20250929',
    }
    expect(response.content).toBe('Hello world')
    expect(response.usage.inputTokens).toBe(100)
  })

  it('AIResponse supports optional thinking and citations', () => {
    const citation: Citation = {
      type: 'web',
      title: 'Example',
      url: 'https://example.com',
      content: 'Some content',
    }
    const response: AIResponse = {
      content: 'Analysis result',
      thinking: 'Internal reasoning here',
      citations: [citation],
      usage: { inputTokens: 200, outputTokens: 300 },
      model: 'claude-opus-4-5-20251101',
    }
    expect(response.thinking).toBe('Internal reasoning here')
    expect(response.citations).toHaveLength(1)
    expect(response.citations![0].url).toBe('https://example.com')
  })
})

describe('createCapability', () => {
  it('returns a capability with default empty features', () => {
    const cap = createCapability({
      id: 'test-cap',
      model: 'claude-haiku-3',
      maxTokens: 512,
      systemPrompt: 'Test prompt',
    })

    expect(cap.id).toBe('test-cap')
    expect(cap.model).toBe('claude-haiku-3')
    expect(cap.maxTokens).toBe(512)
    expect(cap.features).toEqual({})
    expect(cap.systemPrompt).toBe('Test prompt')
  })

  it('preserves explicit features when provided', () => {
    const cap = createCapability({
      id: 'thinking-cap',
      model: 'claude-opus-4-5-20251101',
      maxTokens: 8000,
      features: { thinking: { budgetTokens: 5000 } },
      systemPrompt: 'Think deeply.',
    })

    expect(cap.features.thinking?.budgetTokens).toBe(5000)
  })

  it('supports dynamic systemPrompt via function', () => {
    const cap = createCapability({
      id: 'dynamic-cap',
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024,
      systemPrompt: (ctx) => `User: ${ctx.userId}`,
    })

    expect(typeof cap.systemPrompt).toBe('function')
  })
})
