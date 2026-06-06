import { describe, it, expect } from 'vitest'
import {
  validateJobProposal,
  canTransition,
  getOperatorJobsView,
  OPERATOR_JOB_STATUSES,
  type JobProposal,
} from '../jobs'

describe('operator gateway jobs layer', () => {
  it('accepts a safe, non-hard-gated job proposal', () => {
    const p: JobProposal = {
      laneId: 'openai_codex_max',
      title: 'Refactor lane registry tests',
      taskType: 'refactor',
    }
    const r = validateJobProposal(p)
    expect(r.ok).toBe(true)
    expect(r.reasons).toEqual([])
  })

  it('rejects every hard-gated task type by default', () => {
    for (const taskType of [
      'production_deploy',
      'production_db_write',
      'payments',
      'email_send',
      'claims_orders',
      'secrets_access',
    ]) {
      const r = validateJobProposal({ laneId: 'hermes_local', title: 't', taskType })
      expect(r.ok).toBe(false)
      expect(r.reasons.some((x) => x.includes('hard-gated'))).toBe(true)
    }
  })

  it('rejects any job that requests an API key (no-API-key principle)', () => {
    const r = validateJobProposal({
      laneId: 'hermes_local',
      title: 't',
      taskType: 'documentation',
      apiKeyRequested: true,
    })
    expect(r.ok).toBe(false)
    expect(r.reasons.some((x) => x.toLowerCase().includes('apikey') || x.includes('no-API-key'))).toBe(true)
  })

  it('rejects external/production action requests by default (separate Board gate)', () => {
    const ext = validateJobProposal({
      laneId: 'hermes_local',
      title: 't',
      taskType: 'documentation',
      externalActionRequested: true,
    })
    const prod = validateJobProposal({
      laneId: 'hermes_local',
      title: 't',
      taskType: 'documentation',
      productionActionRequested: true,
    })
    expect(ext.ok).toBe(false)
    expect(prod.ok).toBe(false)
  })

  it('requires laneId, title and taskType', () => {
    const r = validateJobProposal({ laneId: '', title: '', taskType: '' })
    expect(r.ok).toBe(false)
    expect(r.reasons.length).toBeGreaterThanOrEqual(3)
  })

  it('enforces the recorded lifecycle transition contract', () => {
    expect(canTransition('planned', 'queued')).toBe(true)
    expect(canTransition('queued', 'running')).toBe(true)
    expect(canTransition('running', 'done')).toBe(true)
    expect(canTransition('blocked', 'running')).toBe(true)
    // terminal states cannot transition onward
    expect(canTransition('done', 'running')).toBe(false)
    expect(canTransition('cancelled', 'queued')).toBe(false)
    // illegal skips
    expect(canTransition('planned', 'done')).toBe(false)
  })

  it('jobs view is read-only, not connected, no live execution', () => {
    const v = getOperatorJobsView()
    expect(v.source).toBe('not_connected')
    expect(v.liveExecution).toBe(false)
    expect(v.noApiKeyMode).toBe(true)
    expect(v.jobCount).toBe(0)
    expect(v.jobs).toEqual([])
  })

  it('exposes the seven lifecycle statuses', () => {
    expect(OPERATOR_JOB_STATUSES).toEqual([
      'planned',
      'queued',
      'running',
      'blocked',
      'done',
      'failed',
      'cancelled',
    ])
  })
})
