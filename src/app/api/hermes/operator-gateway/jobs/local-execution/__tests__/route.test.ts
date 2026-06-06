import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/operator-gateway/jobs', () => ({
  getSandboxOperatorJobsClient: vi.fn(),
  requestControlledLocalOperatorExecution: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { getSandboxOperatorJobsClient, requestControlledLocalOperatorExecution } from '@/lib/operator-gateway/jobs'
import { POST } from '../route'

const mockGetUser = vi.mocked(getUser)
const mockGetSandboxOperatorJobsClient = vi.mocked(getSandboxOperatorJobsClient)
const mockRequestControlledLocalOperatorExecution = vi.mocked(requestControlledLocalOperatorExecution)

describe('POST /api/hermes/operator-gateway/jobs/local-execution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSandboxOperatorJobsClient.mockReturnValue({ from: vi.fn() } as never)
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/local-execution', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1', laneId: 'hermes_local', taskType: 'documentation', localOnly: true }),
    }))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
    expect(mockRequestControlledLocalOperatorExecution).not.toHaveBeenCalled()
  })

  it('requests controlled local execution foundation without dispatching external tools', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockRequestControlledLocalOperatorExecution.mockResolvedValue({
      ok: true,
      status: 200,
      source: 'controlled_real_local_foundation',
      localExecutionFoundation: 'local_foundation_ready',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      dispatchPerformed: false,
      eventAppended: true,
      jobStatusUpdated: true,
      job: {
        id: 'job-1', founderId: 'founder-1', laneId: 'hermes_local', title: 'Doc', taskType: 'documentation', status: 'running',
        externalActionRequested: false, productionActionRequested: false, apiKeyRequested: false, evidenceRefs: [], metadata: {},
        createdAt: '2026-06-07T09:00:00Z', updatedAt: '2026-06-07T10:00:00Z',
      },
      event: { eventType: 'status_changed', fromStatus: 'planned', toStatus: 'running', evidenceRef: '2nd-brain/.agentic_nexus/CONTROLLED_REAL_LOCAL_EXECUTION_EVIDENCE_PACKET.md', detail: 'Controlled real-local execution foundation accepted; dispatch disabled.' },
    } as never)

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/local-execution', {
      method: 'POST',
      body: JSON.stringify({
        jobId: 'job-1',
        laneId: 'hermes_local',
        taskType: 'documentation',
        localOnly: true,
        requestedCommand: 'pnpm vitest run src/lib/operator-gateway/__tests__/jobs.test.ts',
      }),
    }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(mockGetSandboxOperatorJobsClient).toHaveBeenCalled()
    expect(mockRequestControlledLocalOperatorExecution).toHaveBeenCalledWith({
      founderId: 'founder-1',
      client: expect.any(Object),
      jobId: 'job-1',
      laneId: 'hermes_local',
      taskType: 'documentation',
      localOnly: true,
      requestedCommand: 'pnpm vitest run src/lib/operator-gateway/__tests__/jobs.test.ts',
      externalActionRequested: false,
      productionActionRequested: false,
      apiKeyRequested: false,
      browserAutomationRequested: false,
      computerUseRequested: false,
    })
    expect(json.localExecutionFoundation).toBe('local_foundation_ready')
    expect(json.dispatchPerformed).toBe(false)
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.liveExecution).toBe(false)
    expect(json.productionConnected).toBe(false)
  })

  it('returns policy refusals while preserving safety flags', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockRequestControlledLocalOperatorExecution.mockResolvedValue({
      ok: false,
      status: 400,
      source: 'policy_refused',
      error: 'Controlled real-local execution refused by policy.',
      reasons: ['externalActionRequested must remain false'],
      localExecutionFoundation: 'policy_refused',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      dispatchPerformed: false,
      eventAppended: false,
      jobStatusUpdated: false,
    } as never)

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/local-execution', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1', laneId: 'hermes_local', taskType: 'documentation', localOnly: true, externalActionRequested: true }),
    }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.localExecutionFoundation).toBe('policy_refused')
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.dispatchPerformed).toBe(false)
  })

  it('sanitizes non-policy sandbox failures', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockRequestControlledLocalOperatorExecution.mockResolvedValue({
      ok: false,
      status: 503,
      source: 'sandbox_update_failed',
      error: 'raw sandbox internals should not leak',
      reasons: ['sandbox operator_jobs update failed'],
      localExecutionFoundation: 'sandbox_rejected',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      dispatchPerformed: false,
      eventAppended: false,
      jobStatusUpdated: false,
    } as never)

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs/local-execution', {
      method: 'POST',
      body: JSON.stringify({ jobId: 'job-1', laneId: 'hermes_local', taskType: 'documentation', localOnly: true }),
    }))
    const json = await res.json()

    expect(res.status).toBe(503)
    expect(json.error).toBe('Controlled real-local execution request is currently unavailable.')
    expect(JSON.stringify(json)).not.toContain('raw sandbox internals')
  })
})
