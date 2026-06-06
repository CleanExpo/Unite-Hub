import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/operator-gateway/jobs', () => ({
  getOperatorJobsView: vi.fn(),
  createSandboxOperatorJob: vi.fn(),
  getSandboxOperatorJobsClient: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { getOperatorJobsView, createSandboxOperatorJob, getSandboxOperatorJobsClient } from '@/lib/operator-gateway/jobs'
import { GET, POST } from '../route'

const mockGetUser = vi.mocked(getUser)
const mockGetOperatorJobsView = vi.mocked(getOperatorJobsView)
const mockCreateSandboxOperatorJob = vi.mocked(createSandboxOperatorJob)
const mockGetSandboxOperatorJobsClient = vi.mocked(getSandboxOperatorJobsClient)

describe('GET /api/hermes/operator-gateway/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSandboxOperatorJobsClient.mockReturnValue({ from: vi.fn() } as never)
    mockGetOperatorJobsView.mockResolvedValue({
      source: 'sandbox_select',
      noApiKeyMode: true,
      liveExecution: false,
      jobCount: 0,
      jobs: [],
      note: 'Sandbox persistence connected; 0 jobs visible.',
    })
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
    expect(mockGetOperatorJobsView).not.toHaveBeenCalled()
  })

  it('returns sandbox_select empty state without enabling execution or API-key mode', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(mockGetSandboxOperatorJobsClient).toHaveBeenCalled()
    expect(mockGetOperatorJobsView).toHaveBeenCalledWith({
      founderId: 'founder-1',
      client: expect.any(Object),
    })
    expect(json.source).toBe('sandbox_select')
    expect(json.jobCount).toBe(0)
    expect(json.jobs).toEqual([])
    expect(json.liveExecution).toBe(false)
    expect(json.noApiKeyMode).toBe(true)
  })

  it('POST is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs', {
      method: 'POST',
      body: JSON.stringify({ laneId: 'hermes_local', title: 'Doc', taskType: 'documentation' }),
    }))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
    expect(mockCreateSandboxOperatorJob).not.toHaveBeenCalled()
  })

  it('POST creates sandbox job metadata without execution or API-key mode', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockCreateSandboxOperatorJob.mockResolvedValue({
      ok: true,
      status: 201,
      source: 'sandbox_insert',
      jobCreation: 'sandbox_enabled',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      eventAppended: true,
      job: {
        id: 'job-created-1',
        founderId: 'founder-1',
        laneId: 'hermes_local',
        title: 'Doc',
        taskType: 'documentation',
        status: 'planned',
        externalActionRequested: false,
        productionActionRequested: false,
        apiKeyRequested: false,
        evidenceRefs: [],
        metadata: {},
        createdAt: '2026-06-06T13:00:00Z',
        updatedAt: '2026-06-06T13:00:00Z',
      },
    })

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs', {
      method: 'POST',
      body: JSON.stringify({ laneId: 'hermes_local', title: 'Doc', taskType: 'documentation' }),
    }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(mockCreateSandboxOperatorJob).toHaveBeenCalledWith({
      founderId: 'founder-1',
      client: expect.any(Object),
      proposal: { laneId: 'hermes_local', title: 'Doc', taskType: 'documentation' },
    })
    expect(json.source).toBe('sandbox_insert')
    expect(json.jobCreation).toBe('sandbox_enabled')
    expect(json.liveExecution).toBe(false)
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.productionConnected).toBe(false)
    expect(json.job.apiKeyRequested).toBe(false)
  })

  it('POST returns validation failure for prohibited jobs', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)
    mockCreateSandboxOperatorJob.mockResolvedValue({
      ok: false,
      status: 400,
      source: 'validation_failed',
      error: 'taskType is hard-gated',
      reasons: ['taskType is hard-gated'],
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      jobCreation: 'sandbox_rejected',
    })

    const res = await POST(new Request('http://test.local/api/hermes/operator-gateway/jobs', {
      method: 'POST',
      body: JSON.stringify({ laneId: 'hermes_local', title: 'Deploy', taskType: 'production_deploy' }),
    }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.jobCreation).toBe('sandbox_rejected')
    expect(json.liveExecution).toBe(false)
  })
})
