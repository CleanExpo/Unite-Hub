import { describe, it, expect, vi } from 'vitest'
import {
  validateJobProposal,
  canTransition,
  getOperatorJobsView,
  createSandboxOperatorJob,
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

  it('jobs view default fallback is read-only, not connected, no live execution', async () => {
    const v = await getOperatorJobsView()
    expect(v.source).toBe('not_connected')
    expect(v.liveExecution).toBe(false)
    expect(v.noApiKeyMode).toBe(true)
    expect(v.jobCount).toBe(0)
    expect(v.jobs).toEqual([])
  })


  it('reads sandbox operator_jobs with founder-scoped SELECT and maps rows', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'job-1',
          founder_id: 'founder-1',
          lane_id: 'hermes_local',
          title: 'Verify sandbox queue',
          task_type: 'verification',
          status: 'planned',
          external_action_requested: false,
          production_action_requested: false,
          api_key_requested: false,
          evidence_refs: ['evidence/a.md'],
          metadata: { priority: 'low' },
          created_at: '2026-06-06T12:00:00Z',
          updated_at: '2026-06-06T12:01:00Z',
        },
      ],
      error: null,
    })
    const eq = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))

    const v = await getOperatorJobsView({ founderId: 'founder-1', client: { from } })

    expect(v.source).toBe('sandbox_select')
    expect(v.jobCount).toBe(1)
    expect(v.liveExecution).toBe(false)
    expect(v.noApiKeyMode).toBe(true)
    expect(v.jobs[0]).toEqual({
      id: 'job-1',
      founderId: 'founder-1',
      laneId: 'hermes_local',
      title: 'Verify sandbox queue',
      taskType: 'verification',
      status: 'planned',
      externalActionRequested: false,
      productionActionRequested: false,
      apiKeyRequested: false,
      evidenceRefs: ['evidence/a.md'],
      metadata: { priority: 'low' },
      createdAt: '2026-06-06T12:00:00Z',
      updatedAt: '2026-06-06T12:01:00Z',
    })
    expect(from).toHaveBeenCalledWith('operator_jobs')
    expect(select).toHaveBeenCalledWith(expect.stringContaining('founder_id'))
    expect(eq).toHaveBeenCalledWith('founder_id', 'founder-1')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(v.note).toContain('sandbox')
  })

  it('returns sandbox_select empty state when sandbox SELECT succeeds with zero jobs', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order })) })) })) }

    const v = await getOperatorJobsView({ founderId: 'founder-1', client })

    expect(v.source).toBe('sandbox_select')
    expect(v.jobCount).toBe(0)
    expect(v.jobs).toEqual([])
    expect(v.note).toContain('0 jobs')
  })

  it('falls back safely when sandbox SELECT is unavailable and does not enable execution', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'sandbox unavailable' } })
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order })) })) })) }

    const v = await getOperatorJobsView({ founderId: 'founder-1', client })

    expect(v.source).toBe('not_connected')
    expect(v.liveExecution).toBe(false)
    expect(v.noApiKeyMode).toBe(true)
    expect(v.jobs).toEqual([])
    expect(v.note).toContain('unavailable')
  })



  it('creates a sandbox-only operator job and appends a created event without execution', async () => {
    const insertedJob = {
      id: 'job-created-1',
      founder_id: 'founder-1',
      lane_id: 'hermes_local',
      title: 'Write sandbox evidence packet',
      task_type: 'documentation',
      status: 'planned',
      external_action_requested: false,
      production_action_requested: false,
      api_key_requested: false,
      evidence_refs: [],
      metadata: { priority: 'low' },
      created_at: '2026-06-06T13:00:00Z',
      updated_at: '2026-06-06T13:00:00Z',
    }
    const jobSingle = vi.fn().mockResolvedValue({ data: insertedJob, error: null })
    const jobSelect = vi.fn(() => ({ single: jobSingle }))
    const jobInsert = vi.fn(() => ({ select: jobSelect }))
    const eventInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const from = vi.fn((table: string) => {
      if (table === 'operator_jobs') return { insert: jobInsert }
      if (table === 'operator_events') return { insert: eventInsert }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await createSandboxOperatorJob({
      founderId: 'founder-1',
      client: { from },
      proposal: {
        laneId: 'hermes_local',
        title: 'Write sandbox evidence packet',
        taskType: 'documentation',
        metadata: { priority: 'low' },
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected success')
    expect(result.source).toBe('sandbox_insert')
    expect(result.liveExecution).toBe(false)
    expect(result.externalExecutionEnabled).toBe(false)
    expect(result.job.apiKeyRequested).toBe(false)
    expect(from).toHaveBeenCalledWith('operator_jobs')
    expect(from).toHaveBeenCalledWith('operator_events')
    expect(jobInsert).toHaveBeenCalledWith(expect.objectContaining({
      founder_id: 'founder-1',
      lane_id: 'hermes_local',
      task_type: 'documentation',
      status: 'planned',
      external_action_requested: false,
      production_action_requested: false,
      api_key_requested: false,
    }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({
      founder_id: 'founder-1',
      job_id: 'job-created-1',
      event_type: 'created',
      from_status: null,
      to_status: 'planned',
    }))
  })

  it('refuses sandbox job creation for hard-gated, API-key, external, and production requests', async () => {
    const client = { from: vi.fn() }
    for (const proposal of [
      { laneId: 'hermes_local', title: 'Deploy prod', taskType: 'production_deploy' },
      { laneId: 'hermes_local', title: 'Needs key', taskType: 'documentation', apiKeyRequested: true },
      { laneId: 'hermes_local', title: 'External', taskType: 'documentation', externalActionRequested: true },
      { laneId: 'hermes_local', title: 'Prod', taskType: 'documentation', productionActionRequested: true },
      { laneId: 'hermes_local', title: 'Bad lane task', taskType: 'feature_implementation' },
    ]) {
      const result = await createSandboxOperatorJob({ founderId: 'founder-1', client, proposal })
      expect(result.ok).toBe(false)
    }
    expect(client.from).not.toHaveBeenCalled()
  })

  it('fails closed when sandbox write client is unavailable', async () => {
    const result = await createSandboxOperatorJob({
      founderId: 'founder-1',
      client: null,
      proposal: { laneId: 'hermes_local', title: 'Doc', taskType: 'documentation' },
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.status).toBe(503)
    expect(result.error).toContain('Sandbox operator_jobs INSERT is unavailable')
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
