// src/lib/ai/__tests__/router.test.ts
// Unit tests for the capability registry and execute dispatcher

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stable mock reference — same object returned every time
const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Mock response' }],
  usage: { input_tokens: 100, output_tokens: 50 },
  model: 'claude-sonnet-4-6',
})

const mockClient = { messages: { create: mockCreate } }

vi.mock('@/lib/ai/client', () => ({
  getAIClient: vi.fn(() => mockClient),
}))

import {
  registerCapability,
  getCapability,
  listCapabilities,
  execute,
  resetRegistry,
} from '../router'
import type { AICapability } from '../types'

const baseCap: AICapability = {
  id: 'test-cap',
  model: 'claude-sonnet-4-6',
  maxTokens: 1024,
  features: {},
  systemPrompt: 'You are a test assistant.',
}

describe('registerCapability', () => {
  beforeEach(() => {
    resetRegistry()
  })

  it('registers a capability by id', () => {
    registerCapability(baseCap)
    expect(getCapability('test-cap')).toEqual(baseCap)
  })

  it('overwrites if same id is registered again', () => {
    registerCapability(baseCap)
    const updated = { ...baseCap, maxTokens: 2048 }
    registerCapability(updated)
    expect(getCapability('test-cap')?.maxTokens).toBe(2048)
  })
})

describe('getCapability', () => {
  beforeEach(() => {
    resetRegistry()
  })

  it('returns undefined for unregistered id', () => {
    expect(getCapability('nonexistent')).toBeUndefined()
  })
})

describe('listCapabilities', () => {
  beforeEach(() => {
    resetRegistry()
  })

  it('returns empty array when nothing registered', () => {
    expect(listCapabilities()).toEqual([])
  })

  it('returns all registered capability ids', () => {
    registerCapability(baseCap)
    registerCapability({ ...baseCap, id: 'another-cap' })
    const ids = listCapabilities()
    expect(ids).toContain('test-cap')
    expect(ids).toContain('another-cap')
    expect(ids).toHaveLength(2)
  })
})

describe('execute', () => {
  beforeEach(() => {
    resetRegistry()
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Mock response' }],
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-sonnet-4-6',
    })
  })

  it('throws if capability is not registered', async () => {
    await expect(
      execute('unknown', { messages: [{ role: 'user', content: 'Hi' }] })
    ).rejects.toThrow('unknown')
  })

  it('calls Anthropic with correct params for basic capability', async () => {
    registerCapability(baseCap)

    const result = await execute('test-cap', {
      messages: [{ role: 'user', content: 'Hello' }],
    })

    expect(result.content).toBe('Mock response')
    expect(result.usage.inputTokens).toBe(100)
    expect(result.usage.outputTokens).toBe(50)
    expect(result.model).toBe('claude-sonnet-4-6')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'You are a test assistant.',
        messages: [{ role: 'user', content: 'Hello' }],
      })
    )
  })

  it('resolves dynamic systemPrompt with context', async () => {
    const dynamicCap: AICapability = {
      ...baseCap,
      id: 'dynamic',
      systemPrompt: (ctx) => `Hello ${ctx.userId} on ${ctx.pageContext}`,
    }
    registerCapability(dynamicCap)

    await execute('dynamic', {
      messages: [{ role: 'user', content: 'Hi' }],
      context: { userId: 'phill', pageContext: '/dashboard' },
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'Hello phill on /dashboard',
      })
    )
  })

  it('includes thinking params when capability has thinking feature', async () => {
    const thinkingCap: AICapability = {
      ...baseCap,
      id: 'thinker',
      features: { thinking: { budgetTokens: 8000 } },
    }
    registerCapability(thinkingCap)

    await execute('thinker', {
      messages: [{ role: 'user', content: 'Analyse this' }],
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        thinking: { type: 'enabled', budget_tokens: 8000 },
      })
    )
  })

  it('includes web search tool when capability has webSearch feature', async () => {
    const searchCap: AICapability = {
      ...baseCap,
      id: 'searcher',
      features: { webSearch: true },
    }
    registerCapability(searchCap)

    await execute('searcher', {
      messages: [{ role: 'user', content: 'Search for info' }],
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      })
    )
  })

  it('extracts thinking blocks from response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        { type: 'thinking', thinking: 'Deep analysis...' },
        { type: 'text', text: 'Final answer' },
      ],
      usage: { input_tokens: 200, output_tokens: 300 },
      model: 'claude-opus-4-6',
    })

    registerCapability({ ...baseCap, id: 'think-extract' })

    const result = await execute('think-extract', {
      messages: [{ role: 'user', content: 'Think about this' }],
    })

    expect(result.content).toBe('Final answer')
    expect(result.thinking).toBe('Deep analysis...')
  })

  it('uses default empty context when none provided for dynamic prompt', async () => {
    const dynamicCap: AICapability = {
      ...baseCap,
      id: 'ctx-default',
      systemPrompt: (ctx) => `User: ${ctx.userId}`,
    }
    registerCapability(dynamicCap)

    await execute('ctx-default', {
      messages: [{ role: 'user', content: 'Hi' }],
      context: { userId: 'default-user' },
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'User: default-user',
      })
    )
  })
})
