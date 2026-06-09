import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { GET } from '../route'

const mockGetUser = vi.mocked(getUser)

describe('GET /api/hermes/operator-gateway/skill-evolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
  })

  it('returns self-evolving skill mesh status without external evals or auto-promotion', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.source).toBe('static_local_evolution_registry')
    expect(json.founderOnly).toBe(true)
    expect(json.skillsUnderEvaluation).toBeGreaterThanOrEqual(10)
    expect(json.gradersDefined).toBe(10)
    expect(json.noApiKeyMode).toBe(true)
    expect(json.externalEvalApiCalled).toBe(false)
    expect(json.liveAutoPromotionEnabled).toBe(false)
    expect(json.productionDbTouched).toBe(false)
    expect(json.productionAutoPromotionAllowed).toBe(false)
    expect(json.nextRecommendedSkillToEvaluate).toBe('senior_project_manager_autopilot')
  })

  it('returns sanitized JSON for unexpected loader errors', async () => {
    mockGetUser.mockRejectedValue(new Error('raw evolution internals'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to load skill evolution status' })
    expect(JSON.stringify(json)).not.toContain('raw evolution internals')
  })
})
