import { describe, it, expect } from 'vitest'
import { runCfoGateReview, assessGate, makeRecommendation, type GateLiftAssessment } from '../cfo-gate-review'

describe('assessGate (heuristic)', () => {
  it('returns can_lift=true for read-only env var name queries', () => {
    const a = assessGate('Read the env var NAMES (no values) for the OAuth providers.')
    expect(a.can_lift).toBe(true)
    expect(a.blast_radius).toBe('NONE')
  })

  it('returns can_lift=true for kanban / ci re-trigger / docs-only PR', () => {
    const a = assessGate('Re-trigger the CI run with a typed reason; post a card to the kanban.')
    expect(a.can_lift).toBe(true)
  })

  it('returns can_lift=false for 1Password / signin / rotate', () => {
    const a = assessGate('Sign in to 1Password as Phill and rotate the sandbox DB password.')
    expect(a.can_lift).toBe(false)
    expect(a.blast_radius).toBe('PROD')
  })

  it('returns can_lift=false for send email / client comm / publish', () => {
    const a = assessGate('Send the first email to a real client (Toby) for the CCW magic-link.')
    expect(a.can_lift).toBe(false)
    expect(a.blast_radius).toBe('NAMESPACE')
  })

  it('returns can_lift=false for deploy to prod / production authority', () => {
    const a = assessGate('Grant production authority for Lane 13 and deploy to prod.')
    expect(a.can_lift).toBe(false)
    expect(a.blast_radius).toBe('PROD')
  })

  it('returns the default KEEP_GATED for unmatched packets', () => {
    const a = assessGate('A random question about a topic not in the keyword list.')
    expect(a.can_lift).toBe(false)
  })
})

describe('makeRecommendation (mapping from assessment)', () => {
  it('LIFT for can_lift=true + blast=NONE', () => {
    const a: GateLiftAssessment = {
      can_lift: true,
      guardrails: [],
      blast_radius: 'NONE',
      reversibility: 'TRIVIAL',
      effort_to_undo: 'N/A',
      audit_chain_impact: 'NONE',
    }
    expect(makeRecommendation(a)).toBe('LIFT')
  })

  it('LIFT_WITH_GUARDRAILS for can_lift=true + blast=LOCAL or NAMESPACE', () => {
    const a: GateLiftAssessment = {
      can_lift: true,
      guardrails: [],
      blast_radius: 'LOCAL',
      reversibility: 'TRIVIAL',
      effort_to_undo: 'N/A',
      audit_chain_impact: 'NONE',
    }
    expect(makeRecommendation(a)).toBe('LIFT_WITH_GUARDRAILS')
  })

  it('KEEP_GATED for can_lift=false', () => {
    const a: GateLiftAssessment = {
      can_lift: false,
      guardrails: [],
      blast_radius: 'PROD',
      reversibility: 'EXPENSIVE',
      effort_to_undo: 'rotate keys',
      audit_chain_impact: 'HIGH',
    }
    expect(makeRecommendation(a)).toBe('KEEP_GATED')
  })
})

describe('runCfoGateReview (end-to-end)', () => {
  it('produces a structured packet for a "lane-12" gate', async () => {
    const r = await runCfoGateReview({
      gate: 'lane-12',
      packet: 'Sign in to 1Password as Phill and rotate the sandbox DB password.',
    })
    expect(r.profile).toBe('nexus-cfo')
    expect(r.input.gate).toBe('lane-12')
    expect(r.assessment.can_lift).toBe(false)
    expect(r.recommendation).toBe('KEEP_GATED')
    expect(r.decision_request.type_options.length).toBeGreaterThan(0)
    expect(r.decision_request.estimated_phill_time_seconds).toBeGreaterThan(0)
    expect(r.safety.production_db_touched).toBe(false)
    expect(r.safety.deployment_occurred).toBe(false)
  })

  it('produces a LIFT recommendation for a read-only env var name lookup', async () => {
    const r = await runCfoGateReview({
      gate: 'env-var-names',
      packet: 'Read the env var NAMES (not values) for the OAuth providers.',
    })
    expect(r.assessment.can_lift).toBe(true)
    expect(r.recommendation).toBe('LIFT')
  })

  it('produces a LIFT recommendation for a docs-only PR (also blast=NONE)', async () => {
    const r = await runCfoGateReview({
      gate: 'docs-pr',
      packet: 'Open a docs-only PR with the bounded OAuth test results.',
    })
    expect(r.assessment.can_lift).toBe(true)
    expect(r.recommendation).toBe('LIFT')
  })

  it('honors a custom question in the decision_request', async () => {
    const r = await runCfoGateReview({
      gate: 'lane-12',
      packet: 'Sign in to 1Password.',
      question: 'Can the agent sign in to 1Password on my behalf?',
    })
    expect(r.decision_request.question_to_phill).toBe('Can the agent sign in to 1Password on my behalf?')
  })
})
