// src/lib/advisory/__tests__/readiness-gate.test.ts
import { describe, it, expect } from 'vitest'
import { evaluateReadiness, type BusinessRunResult } from '../readiness-gate'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<BusinessRunResult> = {}): BusinessRunResult {
  return {
    businessKey: 'synthex',
    businessName: 'Synthex',
    status: 'success',
    transactionCount: 100,
    autoReconciled: 90,
    flaggedForReview: 5,
    ...overrides,
  }
}

// ── evaluateReadiness ─────────────────────────────────────────────────────────

describe('evaluateReadiness', () => {
  it('marks a healthy owned business as ready', () => {
    const result = evaluateReadiness([makeResult()], '2026-03-24T11:00:00Z')
    expect(result.ready).toHaveLength(1)
    expect(result.ready[0].businessKey).toBe('synthex')
    expect(result.skipped).toHaveLength(0)
  })

  it('skips a client-type business (ccw)', () => {
    const result = evaluateReadiness([
      makeResult({ businessKey: 'ccw', businessName: 'CCW-ERP/CRM' }),
    ])
    expect(result.ready).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].reason).toMatch(/client/i)
  })

  it('skips a business with run status skipped', () => {
    const result = evaluateReadiness([makeResult({ status: 'skipped' })])
    expect(result.ready).toHaveLength(0)
    expect(result.skipped[0].reason).toMatch(/skipped/i)
  })

  it('skips a business with run status error', () => {
    const result = evaluateReadiness([makeResult({ status: 'error' })])
    expect(result.ready).toHaveLength(0)
    expect(result.skipped[0].reason).toMatch(/error/i)
  })

  it('skips a business with zero transactions', () => {
    const result = evaluateReadiness([makeResult({ transactionCount: 0, flaggedForReview: 0 })])
    expect(result.ready).toHaveLength(0)
    expect(result.skipped[0].reason).toMatch(/no transactions/i)
  })

  it('skips a business exceeding the 20% unreconciled threshold', () => {
    // 25 flagged out of 100 = 25%
    const result = evaluateReadiness([makeResult({ transactionCount: 100, flaggedForReview: 25 })])
    expect(result.ready).toHaveLength(0)
    expect(result.skipped[0].reason).toMatch(/25\.0%/)
  })

  it('accepts a business exactly at the 20% threshold', () => {
    // 20 flagged out of 100 = exactly 20%
    const result = evaluateReadiness([makeResult({ transactionCount: 100, flaggedForReview: 20 })])
    expect(result.ready).toHaveLength(1)
    expect(result.ready[0].unreconciledRatio).toBe(0.2)
  })

  it('processes multiple businesses and separates ready from skipped', () => {
    const results = evaluateReadiness([
      makeResult({ businessKey: 'dr', businessName: 'Disaster Recovery', flaggedForReview: 5 }),
      makeResult({ businessKey: 'nrpg', businessName: 'NRPG', flaggedForReview: 5 }),
      makeResult({ businessKey: 'ccw', businessName: 'CCW-ERP/CRM' }),
      makeResult({ businessKey: 'restore', businessName: 'RestoreAssist', flaggedForReview: 30 }),
    ])
    expect(results.ready).toHaveLength(2)
    expect(results.skipped).toHaveLength(2)
    expect(results.ready.map(r => r.businessKey)).toEqual(
      expect.arrayContaining(['dr', 'nrpg'])
    )
  })

  it('generates a human-readable period label from the run timestamp', () => {
    const result = evaluateReadiness([makeResult()], '2026-03-24T11:00:00Z')
    expect(result.ready[0].periodLabel).toBe('March 2026')
  })

  it('defaults to current date when no runCompletedAt is provided', () => {
    const result = evaluateReadiness([makeResult()])
    expect(result.ready[0].periodLabel).toMatch(/\w+ \d{4}/)
  })

  it('skips unknown business keys', () => {
    const result = evaluateReadiness([
      makeResult({ businessKey: 'unknown-biz', businessName: 'Unknown' }),
    ])
    expect(result.ready).toHaveLength(0)
    expect(result.skipped[0].reason).toMatch(/client/i)
  })
})
