import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/operator-gateway/jobs', () => ({
  getOperatorJobsView: vi.fn(),
  getSandboxOperatorJobsClient: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { getOperatorJobsView, getSandboxOperatorJobsClient } from '@/lib/operator-gateway/jobs'
import { GET } from '../route'

const mockGetUser = vi.mocked(getUser)
const mockGetOperatorJobsView = vi.mocked(getOperatorJobsView)
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
})
