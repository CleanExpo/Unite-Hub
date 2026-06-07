import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { GET } from '../route'

const mockGetUser = vi.mocked(getUser)

describe('GET /api/hermes/operator-gateway/project-coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
  })

  it('returns project DoD coverage without external execution, prod DB, or deploy', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.source).toBe('static_local_project_dod_registry')
    expect(json.founderOnly).toBe(true)
    expect(json.falseDonePreventionActive).toBe(true)
    expect(json.projectsWithDodSpecs).toBeGreaterThanOrEqual(4)
    expect(json.coverageReconcilerBuilt).toBe(true)
    expect(json.productionDbTouched).toBe(false)
    expect(json.deploymentOccurred).toBe(false)
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.projects[0].projectDone).toBe(false)
    expect(json.projects[0].missingRequirements.length).toBeGreaterThan(0)
    expect(json.nextGeneratedJobs.length).toBeGreaterThan(0)
  })

  it('returns sanitized JSON for unexpected loader errors', async () => {
    mockGetUser.mockRejectedValue(new Error('raw auth internals'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to load project DoD coverage status' })
    expect(JSON.stringify(json)).not.toContain('raw auth internals')
  })
})
