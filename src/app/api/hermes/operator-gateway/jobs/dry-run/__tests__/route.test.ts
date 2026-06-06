import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/operator-gateway/jobs', () => ({
  dryRunSandboxOperatorJob: vi.fn(),
  getSandboxOperatorJobsClient: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { dryRunSandboxOperatorJob, getSandboxOperatorJobsClient } from '@/lib/operator-gateway/jobs'
import { POST } from '../route'

const mockGetUser = vi.mocked(getUser)
const mockDryRunSandboxOperatorJob = vi.mocked(dryRunSandboxOperatorJob)
const mockGetSandboxOperatorJobsClient = vi.mocked(getSandboxOperatorJobsClient)

describe('POST /api/hermes/operator-gateway/jobs/dry-run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSandboxOperatorJobsClient.mockReturnValue({ from: vi.fn() } as never)
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/dry-run', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1' }),
    }))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
    expect(mockDryRunSandboxOperatorJob).not.toHaveBeenCalled()
  })

  it('dry-runs sandbox job without external execution or production connection', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockDryRunSandboxOperatorJob.mockResolvedValue({
      ok: true,
      status: 200,
      source: 'sandbox_dry_run',
      dryRunExecution: 'sandbox_enabled',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      eventAppended: true,
      jobStatusUpdated: true,
      job: {
        id: 'job-1', founderId: 'founder-1', laneId: 'hermes_local', title: 'Doc', taskType: 'documentation', status: 'done',
        externalActionRequested: false, productionActionRequested: false, apiKeyRequested: false, evidenceRefs: [], metadata: {},
        createdAt: '2026-06-06T13:00:00Z', updatedAt: '2026-06-06T14:00:00Z',
      },
      event: { eventType: 'status_changed', fromStatus: 'planned', toStatus: 'done', evidenceRef: '2nd-brain/.agentic_nexus/OPERATOR_GATEWAY_SANDBOX_DRY_RUN_EXECUTION_EVIDENCE_PACKET.md', detail: 'No external execution occurred.' },
    })

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/dry-run', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1', dryRunReason: 'prove lifecycle' }),
    }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(mockGetSandboxOperatorJobsClient).toHaveBeenCalled()
    expect(mockDryRunSandboxOperatorJob).toHaveBeenCalledWith({
      founderId: 'founder-1',
      client: expect.any(Object),
      jobId: 'job-1',
      dryRunReason: 'prove lifecycle',
      externalActionRequested: false,
      productionActionRequested: false,
      apiKeyRequested: false,
    })
    expect(json.dryRunExecution).toBe('sandbox_enabled')
    expect(json.liveExecution).toBe(false)
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.productionConnected).toBe(false)
    expect(json.eventAppended).toBe(true)
    expect(json.jobStatusUpdated).toBe(true)
  })

  it('returns validation failures for prohibited dry-run requests', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockDryRunSandboxOperatorJob.mockResolvedValue({
      ok: false,
      status: 400,
      source: 'validation_failed',
      error: 'Sandbox dry-run refuses external execution requests.',
      reasons: ['externalActionRequested must remain false'],
      dryRunExecution: 'sandbox_rejected',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      eventAppended: false,
      jobStatusUpdated: false,
    })

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/dry-run', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1', externalActionRequested: true }),
    }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.dryRunExecution).toBe('sandbox_rejected')
    expect(json.liveExecution).toBe(false)
    expect(json.externalExecutionEnabled).toBe(false)
  })

  it('sanitizes non-validation sandbox dry-run failures', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockDryRunSandboxOperatorJob.mockResolvedValue({
      ok: false,
      status: 503,
      source: 'sandbox_update_failed',
      error: 'raw supabase internal details should not leak',
      reasons: ['sandbox operator_jobs update failed'],
      dryRunExecution: 'sandbox_rejected',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      eventAppended: false,
      jobStatusUpdated: false,
    })

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/dry-run', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1' }),
    }))
    const json = await res.json()

    expect(res.status).toBe(503)
    expect(json.error).toBe('Sandbox dry-run execution is currently unavailable.')
    expect(JSON.stringify(json)).not.toContain('raw supabase internal details')
    expect(json.liveExecution).toBe(false)
    expect(json.externalExecutionEnabled).toBe(false)
  })
})
