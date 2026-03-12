import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET } from '../route'

const mockGetUser = vi.mocked(getUser)
const mockCreateClient = vi.mocked(createClient)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/dashboard/stats', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns aggregate stats when authenticated', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' } as never)

    const fromMock = vi.fn()
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 25, error: null }) }) })  // contacts
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 12, error: null }) }) })  // vault
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 3, error: null }) }) }) })  // approvals pending
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 2, error: null }) }) }) })  // advisory active
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { status: 'completed', created_at: '2026-03-12T00:00:00Z' }, error: null }) }) }) }) }) })  // bookkeeper last run

    mockCreateClient.mockResolvedValue({ from: fromMock } as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('contacts')
    expect(json).toHaveProperty('vaultEntries')
    expect(json).toHaveProperty('pendingApprovals')
    expect(json).toHaveProperty('activeCases')
    expect(json).toHaveProperty('lastBookkeeperRun')
  })
})
