// src/lib/ai/__tests__/client.test.ts
// Unit tests for the Anthropic singleton client

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Anthropic SDK before importing the client
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}))

import { getAIClient, resetAIClient } from '../client'

describe('getAIClient', () => {
  beforeEach(() => {
    resetAIClient()
    // Ensure ANTHROPIC_API_KEY is set for most tests
    process.env.ANTHROPIC_API_KEY = 'test-key-123'
  })

  it('returns an Anthropic client instance', () => {
    const client = getAIClient()
    expect(client).toBeDefined()
    expect(client.messages).toBeDefined()
  })

  it('returns the same instance on subsequent calls (singleton)', () => {
    const first = getAIClient()
    const second = getAIClient()
    expect(first).toBe(second)
  })

  it('throws if ANTHROPIC_API_KEY is not set', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(() => getAIClient()).toThrow('ANTHROPIC_API_KEY')
  })

  it('returns a new instance after resetAIClient()', () => {
    const first = getAIClient()
    resetAIClient()
    const second = getAIClient()
    expect(first).not.toBe(second)
  })
})
