import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { GET } from '../route'

const mockGetUser = vi.mocked(getUser)

describe('GET /api/hermes/operator-gateway/command-centre', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is founder/session guarded', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorised' })
  })

  it('returns the safe command-centre operator surface without live execution', async () => {
    mockGetUser.mockResolvedValue({ id: 'founder-1' } as never)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.surface).toBe('command_centre_operator_execution_surface')
    expect(json.founderOnly).toBe(true)
    expect(json.noApiKeyMode).toBe(true)
    expect(json.externalExecutionEnabled).toBe(false)
    expect(json.jobSubmission.enabled).toBe(false)
    expect(json.jobSubmission.canExecute).toBe(false)
    expect(json.safetyStatus.apiKeyMode).toBe(false)
    expect(json.safetyStatus.webSessionScraping).toBe(false)
    expect(json.blockedGates.map((gate: { gateId: string }) => gate.gateId)).toContain('enable_external_operator_execution')
  })
})
