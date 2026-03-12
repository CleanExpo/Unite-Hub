// src/lib/ai/__tests__/cost-tracker.test.ts
// Unit tests for the per-capability cost tracker.

import { describe, it, expect, beforeEach } from 'vitest'
import { trackUsage, getUsageSummary, resetUsage } from '../cost-tracker'

describe('Cost Tracker', () => {
  beforeEach(() => {
    resetUsage()
  })

  it('tracks cumulative tokens by capability', () => {
    trackUsage('chat', { inputTokens: 100, outputTokens: 50, model: 'claude-sonnet-4-6' })
    trackUsage('chat', { inputTokens: 200, outputTokens: 80, model: 'claude-sonnet-4-6' })

    const summary = getUsageSummary()
    expect(summary.chat.totalInputTokens).toBe(300)
    expect(summary.chat.totalOutputTokens).toBe(130)
    expect(summary.chat.calls).toBe(2)
    expect(summary.chat.models).toEqual(['claude-sonnet-4-6'])
  })

  it('tracks across different capabilities', () => {
    trackUsage('chat', { inputTokens: 100, outputTokens: 50, model: 'claude-sonnet-4-6' })
    trackUsage('analyze', { inputTokens: 500, outputTokens: 200, model: 'claude-opus-4-6' })

    const summary = getUsageSummary()
    expect(Object.keys(summary)).toHaveLength(2)
    expect(summary.chat.totalInputTokens).toBe(100)
    expect(summary.analyze.totalInputTokens).toBe(500)
    expect(summary.analyze.models).toEqual(['claude-opus-4-6'])
  })

  it('resetUsage clears all data', () => {
    trackUsage('chat', { inputTokens: 100, outputTokens: 50, model: 'claude-sonnet-4-6' })
    resetUsage()

    const summary = getUsageSummary()
    expect(Object.keys(summary)).toHaveLength(0)
  })

  it('tracks multiple distinct models for same capability', () => {
    trackUsage('chat', { inputTokens: 100, outputTokens: 50, model: 'claude-sonnet-4-6' })
    trackUsage('chat', { inputTokens: 200, outputTokens: 80, model: 'claude-opus-4-6' })

    const summary = getUsageSummary()
    expect(summary.chat.models).toEqual(['claude-sonnet-4-6', 'claude-opus-4-6'])
  })
})
