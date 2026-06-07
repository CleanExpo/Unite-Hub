import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { GET } from '../route'

const mockGetUser = vi.mocked(getUser)

describe('GET /api/hermes/operator-gateway/skill-mesh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
  })

  it('returns dashboard-ready skill mesh and mission router status without external execution', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.source).toBe('static_local_registry')
    expect(json.specializedSkillCount).toBeGreaterThanOrEqual(17)
    expect(json.businessMissionTemplateCount).toBeGreaterThanOrEqual(12)
    expect(json.activeLanes).toEqual(expect.arrayContaining(['hermes_local', 'agentic_nexus_skill_exec']))
    expect(json.blockedLanes).toContain('sandbox_voice_migration_blocked_op')
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.apiKeyMode).toBe(false)
    expect(json.sampleRoute.ok).toBe(true)
    expect(json.sampleRoute.actions.length).toBeGreaterThanOrEqual(15)
    expect(json.sampleRoute.actions.length).toBeLessThanOrEqual(20)
  })

  it('returns sanitized JSON for unexpected loader errors', async () => {
    mockGetUser.mockRejectedValue(new Error('raw auth internals'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to load skill mesh status' })
    expect(JSON.stringify(json)).not.toContain('raw auth internals')
  })
})
