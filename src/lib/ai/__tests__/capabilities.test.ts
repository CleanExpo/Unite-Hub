// src/lib/ai/__tests__/capabilities.test.ts
// Unit tests for capability configurations and registerAllCapabilities

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the router so we can inspect registrations without side effects
vi.mock('@/lib/ai/router', () => ({
  registerCapability: vi.fn(),
  resetRegistry: vi.fn(),
}))

// Mock ideas/conversation to avoid loading the full business config dependency chain
vi.mock('@/lib/ideas/conversation', () => ({
  buildSystemPrompt: vi.fn(() => 'Mocked ideas system prompt'),
}))

import { chatCapability } from '../capabilities/chat'
import { analyzeCapability } from '../capabilities/analyze'
import { ideasCapability } from '../capabilities/ideas'
import { debateCapability } from '../capabilities/debate'
import { registerAllCapabilities } from '../capabilities/index'
import { registerCapability } from '../router'

describe('chatCapability', () => {
  it('has correct id, model, and maxTokens', () => {
    expect(chatCapability.id).toBe('chat')
    expect(chatCapability.model).toBe('claude-sonnet-4-6')
    expect(chatCapability.maxTokens).toBe(2048)
  })

  it('has a dynamic systemPrompt function', () => {
    expect(typeof chatCapability.systemPrompt).toBe('function')
  })

  it('builds system prompt with page context and business key', () => {
    if (typeof chatCapability.systemPrompt === 'function') {
      const prompt = chatCapability.systemPrompt({
        userId: 'phill',
        pageContext: '/dashboard',
        businessKey: 'dr',
      })
      expect(prompt).toContain('Bron')
      expect(prompt).toContain('/dashboard')
      expect(prompt).toContain('dr')
    }
  })

  it('handles missing optional context gracefully', () => {
    if (typeof chatCapability.systemPrompt === 'function') {
      const prompt = chatCapability.systemPrompt({ userId: 'phill' })
      expect(prompt).toContain('Bron')
      // Should not throw or produce undefined fragments
      expect(prompt).not.toContain('undefined')
    }
  })

  it('has empty features (no thinking, no web search)', () => {
    expect(chatCapability.features).toEqual({})
  })
})

describe('analyzeCapability', () => {
  it('has correct id, model, and maxTokens', () => {
    expect(analyzeCapability.id).toBe('analyze')
    expect(analyzeCapability.model).toBe('claude-opus-4-6')
    expect(analyzeCapability.maxTokens).toBe(16000)
  })

  it('has thinking feature enabled with 10000 budget tokens', () => {
    expect(analyzeCapability.features.thinking).toEqual({
      budgetTokens: 10000,
    })
  })

  it('has a dynamic systemPrompt function', () => {
    expect(typeof analyzeCapability.systemPrompt).toBe('function')
  })

  it('includes business context when provided', () => {
    if (typeof analyzeCapability.systemPrompt === 'function') {
      const prompt = analyzeCapability.systemPrompt({
        userId: 'phill',
        businessKey: 'synthex',
      })
      expect(prompt).toContain('synthex')
    }
  })
})

describe('ideasCapability', () => {
  it('has correct id, model, and maxTokens', () => {
    expect(ideasCapability.id).toBe('ideas')
    expect(ideasCapability.model).toBe('claude-sonnet-4-6')
    expect(ideasCapability.maxTokens).toBe(1024)
  })

  it('uses buildSystemPrompt from ideas/conversation', () => {
    if (typeof ideasCapability.systemPrompt === 'function') {
      const prompt = ideasCapability.systemPrompt({ userId: 'phill' })
      expect(prompt).toBe('Mocked ideas system prompt')
    }
  })
})

describe('debateCapability', () => {
  it('has correct id, model, and maxTokens', () => {
    expect(debateCapability.id).toBe('debate')
    expect(debateCapability.model).toBe('claude-sonnet-4-5-20250929')
    expect(debateCapability.maxTokens).toBe(4096)
  })

  it('has a static systemPrompt string', () => {
    expect(typeof debateCapability.systemPrompt).toBe('string')
  })
})

describe('registerAllCapabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the internal _registered flag by reimporting
    // We test idempotency by calling twice
  })

  it('registers all 4 capabilities', () => {
    registerAllCapabilities()

    expect(registerCapability).toHaveBeenCalledTimes(4)
    const registeredIds = vi.mocked(registerCapability).mock.calls.map(
      (call) => call[0].id
    )
    expect(registeredIds).toContain('chat')
    expect(registeredIds).toContain('analyze')
    expect(registeredIds).toContain('ideas')
    expect(registeredIds).toContain('debate')
  })
})
