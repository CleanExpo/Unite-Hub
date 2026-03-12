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
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

/** Build a chained mock: .select().eq()...resolved */
function mockCountQuery(count: number) {
  return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count, error: null }) }) }
}

function mockFilteredCountQuery(count: number) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count, error: null }) }),
    }),
  }
}

function mockBookkeeperQuery(data: Record<string, unknown> | null, error: Record<string, unknown> | null = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data, error }),
          }),
        }),
      }),
    }),
  }
}

function mockErrorCountQuery(error: Record<string, unknown>) {
  return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: null, error }) }) }
}

describe('GET /api/dashboard/stats', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns aggregate stats with correct values when authenticated', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' } as never)

    const fromMock = vi.fn()
      .mockReturnValueOnce(mockCountQuery(25))           // contacts
      .mockReturnValueOnce(mockCountQuery(12))           // vault
      .mockReturnValueOnce(mockFilteredCountQuery(3))    // approvals pending
      .mockReturnValueOnce(mockFilteredCountQuery(2))    // advisory active
      .mockReturnValueOnce(mockBookkeeperQuery(          // bookkeeper last run
        { status: 'completed', created_at: '2026-03-12T00:00:00Z' },
      ))

    mockCreateClient.mockResolvedValue({ from: fromMock } as never)

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.contacts).toBe(25)
    expect(json.vaultEntries).toBe(12)
    expect(json.pendingApprovals).toBe(3)
    expect(json.activeCases).toBe(2)
    expect(json.lastBookkeeperRun).toEqual({
      status: 'completed',
      createdAt: '2026-03-12T00:00:00Z',
    })
  })

  it('returns null lastBookkeeperRun when no rows exist (PGRST116)', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' } as never)

    const fromMock = vi.fn()
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockFilteredCountQuery(0))
      .mockReturnValueOnce(mockFilteredCountQuery(0))
      .mockReturnValueOnce(mockBookkeeperQuery(null, { code: 'PGRST116', message: 'no rows' }))

    mockCreateClient.mockResolvedValue({ from: fromMock } as never)

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.lastBookkeeperRun).toBeNull()
  })

  it('returns 500 when a count query fails', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' } as never)

    const fromMock = vi.fn()
      .mockReturnValueOnce(mockErrorCountQuery({ code: '42P01', message: 'relation does not exist' }))
      .mockReturnValueOnce(mockCountQuery(0))
      .mockReturnValueOnce(mockFilteredCountQuery(0))
      .mockReturnValueOnce(mockFilteredCountQuery(0))
      .mockReturnValueOnce(mockBookkeeperQuery(null, { code: 'PGRST116', message: 'no rows' }))

    mockCreateClient.mockResolvedValue({ from: fromMock } as never)

    const res = await GET()
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to load dashboard stats')
  })

  it('returns 500 when bookkeeper query has a real error', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' } as never)

    const fromMock = vi.fn()
      .mockReturnValueOnce(mockCountQuery(5))
      .mockReturnValueOnce(mockCountQuery(3))
      .mockReturnValueOnce(mockFilteredCountQuery(1))
      .mockReturnValueOnce(mockFilteredCountQuery(0))
      .mockReturnValueOnce(mockBookkeeperQuery(null, { code: '42501', message: 'permission denied' }))

    mockCreateClient.mockResolvedValue({ from: fromMock } as never)

    const res = await GET()
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to load dashboard stats')
  })
})
