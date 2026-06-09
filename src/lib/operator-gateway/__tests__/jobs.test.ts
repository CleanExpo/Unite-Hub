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


  it('dry-runs a planned sandbox job by updating status and appending a status_changed event only', async () => {
    const existingJob = {
      id: 'job-dry-1',
      founder_id: 'founder-1',
      lane_id: 'hermes_local',
      title: 'Dry-run evidence job',
      task_type: 'documentation',
      status: 'planned',
      external_action_requested: false,
      production_action_requested: false,
      api_key_requested: false,
      evidence_refs: [],
      metadata: { source: 'test' },
      created_at: '2026-06-06T13:00:00Z',
      updated_at: '2026-06-06T13:00:00Z',
    }
    const updatedJob = {
      ...existingJob,
      status: 'done',
      evidence_refs: ['2nd-brain/.agentic_nexus/OPERATOR_GATEWAY_SANDBOX_DRY_RUN_EXECUTION_EVIDENCE_PACKET.md'],
      metadata: {
        source: 'test',
        dryRun: {
          status: 'completed',
          completedAt: '2026-06-06T14:00:00Z',
          reason: 'prove lifecycle',
          externalExecution: false,
          liveRunner: false,
          productionDbTouched: false,
        },
      },
      updated_at: '2026-06-06T14:00:00Z',
    }
    const readSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
    const readFounderEq = vi.fn(() => ({ single: readSingle }))
    const readIdEq = vi.fn(() => ({ eq: readFounderEq }))
    const select = vi.fn(() => ({ eq: readIdEq }))
    const updateSingle = vi.fn().mockResolvedValue({ data: updatedJob, error: null })
    const updateSelect = vi.fn(() => ({ single: updateSingle }))
    const updateFounderEq = vi.fn(() => ({ select: updateSelect }))
    const updateIdEq = vi.fn(() => ({ eq: updateFounderEq }))
    const update = vi.fn(() => ({ eq: updateIdEq }))
    const eventInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const from = vi.fn((table: string) => {
      if (table === 'operator_jobs') return { select, update }
      if (table === 'operator_events') return { insert: eventInsert }
      throw new Error(`unexpected table ${table}`)
    })

    const { dryRunSandboxOperatorJob } = await import('../jobs')
    const result = await dryRunSandboxOperatorJob({
      founderId: 'founder-1',
      client: { from },
      jobId: 'job-dry-1',
      dryRunReason: 'prove lifecycle',
      now: () => '2026-06-06T14:00:00Z',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected dry-run success')
    expect(result.source).toBe('sandbox_dry_run')
    expect(result.dryRunExecution).toBe('sandbox_enabled')
    expect(result.liveExecution).toBe(false)
    expect(result.externalExecutionEnabled).toBe(false)
    expect(result.productionConnected).toBe(false)
    expect(result.eventAppended).toBe(true)
    expect(result.jobStatusUpdated).toBe(true)
    expect(result.job.status).toBe('done')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'done',
      evidence_refs: expect.arrayContaining(['2nd-brain/.agentic_nexus/OPERATOR_GATEWAY_SANDBOX_DRY_RUN_EXECUTION_EVIDENCE_PACKET.md']),
      metadata: expect.objectContaining({
        dryRun: expect.objectContaining({
          status: 'completed',
          externalExecution: false,
          liveRunner: false,
          productionDbTouched: false,
        }),
      }),
    }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({
      founder_id: 'founder-1',
      job_id: 'job-dry-1',
      event_type: 'status_changed',
      from_status: 'planned',
      to_status: 'done',
      evidence_ref: '2nd-brain/.agentic_nexus/OPERATOR_GATEWAY_SANDBOX_DRY_RUN_EXECUTION_EVIDENCE_PACKET.md',
    }))
  })

  it('refuses dry-run requests for missing founder, missing job, external, production, and API-key inputs without touching DB', async () => {
    const { dryRunSandboxOperatorJob } = await import('../jobs')
    const client = { from: vi.fn() }
    for (const options of [
      { founderId: undefined, client, jobId: 'job-1' },
      { founderId: 'founder-1', client, jobId: '' },
      { founderId: 'founder-1', client, jobId: 'job-1', externalActionRequested: true },
      { founderId: 'founder-1', client, jobId: 'job-1', productionActionRequested: true },
      { founderId: 'founder-1', client, jobId: 'job-1', apiKeyRequested: true },
    ]) {
      const result = await dryRunSandboxOperatorJob(options)
      expect(result.ok).toBe(false)
    }
    expect(client.from).not.toHaveBeenCalled()
  })

  it('refuses dry-run for hard-gated or unsafe sandbox job rows before updating status', async () => {
    const { dryRunSandboxOperatorJob } = await import('../jobs')
    for (const row of [
      { task_type: 'production_deploy', api_key_requested: false, external_action_requested: false, production_action_requested: false },
      { task_type: 'documentation', api_key_requested: true, external_action_requested: false, production_action_requested: false },
      { task_type: 'documentation', api_key_requested: false, external_action_requested: true, production_action_requested: false },
      { task_type: 'documentation', api_key_requested: false, external_action_requested: false, production_action_requested: true },
    ]) {
      const existingJob = {
        id: 'job-unsafe', founder_id: 'founder-1', lane_id: 'hermes_local', title: 'Unsafe', status: 'planned',
        evidence_refs: [], metadata: {}, created_at: '2026-06-06T13:00:00Z', updated_at: '2026-06-06T13:00:00Z', ...row,
      }
      const readSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const client = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: readSingle })) })) })),
          update: vi.fn(),
        })),
      }
      const result = await dryRunSandboxOperatorJob({ founderId: 'founder-1', client, jobId: 'job-unsafe' })
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('expected refusal')
      expect(result.source).toBe('sandbox_dry_run_refused')
    }
  })
})


describe('controlled real-local execution foundation', () => {
  it('validates approved local-only lanes and refuses pending or unregistered lanes', async () => {
    const { validateControlledLocalExecutionRequest } = await import('../jobs')

    const safe = validateControlledLocalExecutionRequest({
      laneId: 'hermes_local',
      taskType: 'documentation',
      localOnly: true,
      requestedCommand: 'pnpm vitest run src/lib/operator-gateway/__tests__/jobs.test.ts',
    })

    expect(safe.ok).toBe(true)
    expect(safe.mode).toBe('controlled_real_local')
    expect(safe.laneStatus).toBe('active')

    for (const laneId of ['claude_code_max_primary', 'cursor_cli', 'unknown_lane']) {
      const result = validateControlledLocalExecutionRequest({
        laneId,
        taskType: 'documentation',
        localOnly: true,
        requestedCommand: 'pnpm test',
      })
      expect(result.ok).toBe(false)
      expect(result.reasons.join(' ')).toMatch(/pending|not registered|not active/i)
    }
  })

  it('refuses hard-gated, external, production, API-key, browser, Computer Use, and secret-like requests before mutation', async () => {
    const { validateControlledLocalExecutionRequest } = await import('../jobs')

    for (const request of [
      { laneId: 'hermes_local', taskType: 'production_deploy', localOnly: true },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: false },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, externalActionRequested: true },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, productionActionRequested: true },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, apiKeyRequested: true },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, browserAutomationRequested: true },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, computerUseRequested: true },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, requestedCommand: 'op item get secret' },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, requestedCommand: 'supabase db push' },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, requestedCommand: 'psql postgres://prod' },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, requestedCommand: 'vercel deploy --prod' },
      { laneId: 'hermes_local', taskType: 'documentation', localOnly: true, requestedCommand: 'curl https://example.com' },
    ]) {
      const result = validateControlledLocalExecutionRequest(request)
      expect(result.ok).toBe(false)
    }
  })

  it('records a controlled local execution approval event and running status without dispatching external tools', async () => {
    const { requestControlledLocalOperatorExecution } = await import('../jobs')
    const existingJob = {
      id: 'job-local-1',
      founder_id: 'founder-1',
      lane_id: 'hermes_local',
      title: 'Local policy proof',
      task_type: 'documentation',
      status: 'planned',
      external_action_requested: false,
      production_action_requested: false,
      api_key_requested: false,
      evidence_refs: [],
      metadata: {},
      created_at: '2026-06-07T09:00:00Z',
      updated_at: '2026-06-07T09:00:00Z',
    }
    const updatedJob = {
      ...existingJob,
      status: 'running',
      evidence_refs: ['2nd-brain/.agentic_nexus/CONTROLLED_REAL_LOCAL_EXECUTION_EVIDENCE_PACKET.md'],
      metadata: {
        controlledRealLocalExecution: {
          status: 'foundation_ready',
          laneId: 'hermes_local',
          taskType: 'documentation',
          localOnly: true,
          externalExecution: false,
          liveRunner: false,
          productionDbTouched: false,
          dispatchPerformed: false,
          requestedAt: '2026-06-07T10:00:00Z',
        },
      },
      updated_at: '2026-06-07T10:00:00Z',
    }
    const readSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
    const readFounderEq = vi.fn(() => ({ single: readSingle }))
    const readIdEq = vi.fn(() => ({ eq: readFounderEq }))
    const select = vi.fn(() => ({ eq: readIdEq }))
    const updateSingle = vi.fn().mockResolvedValue({ data: updatedJob, error: null })
    const updateSelect = vi.fn(() => ({ single: updateSingle }))
    const updateFounderEq = vi.fn(() => ({ select: updateSelect }))
    const updateIdEq = vi.fn(() => ({ eq: updateFounderEq }))
    const update = vi.fn(() => ({ eq: updateIdEq }))
    const eventInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const from = vi.fn((table: string) => {
      if (table === 'operator_jobs') return { select, update }
      if (table === 'operator_events') return { insert: eventInsert }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await requestControlledLocalOperatorExecution({
      founderId: 'founder-1',
      client: { from },
      jobId: 'job-local-1',
      laneId: 'hermes_local',
      taskType: 'documentation',
      localOnly: true,
      requestedCommand: 'pnpm vitest run src/lib/operator-gateway/__tests__/jobs.test.ts',
      now: () => '2026-06-07T10:00:00Z',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected controlled local foundation success')
    expect(result.source).toBe('controlled_real_local_foundation')
    expect(result.localExecutionFoundation).toBe('local_foundation_ready')
    expect(result.dispatchPerformed).toBe(false)
    expect(result.externalExecutionEnabled).toBe(false)
    expect(result.liveExecution).toBe(false)
    expect(result.productionConnected).toBe(false)
    expect(result.eventAppended).toBe(true)
    expect(result.jobStatusUpdated).toBe(true)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'running' }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'status_changed',
      from_status: 'planned',
      to_status: 'running',
      evidence_ref: '2nd-brain/.agentic_nexus/CONTROLLED_REAL_LOCAL_EXECUTION_EVIDENCE_PACKET.md',
    }))
  })

  it('refuses controlled local execution requests without touching DB when policy fails', async () => {
    const { requestControlledLocalOperatorExecution } = await import('../jobs')
    const client = { from: vi.fn() }
    const result = await requestControlledLocalOperatorExecution({
      founderId: 'founder-1',
      client,
      jobId: 'job-local-1',
      laneId: 'hermes_local',
      taskType: 'documentation',
      localOnly: true,
      requestedCommand: 'op item get sandbox voice',
    })

    expect(result.ok).toBe(false)
    expect(result.source).toBe('policy_refused')
    expect(client.from).not.toHaveBeenCalled()
  })
})
