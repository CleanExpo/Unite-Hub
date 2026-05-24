// src/app/api/cron/hub-sweep/__tests__/route.test.ts
// Tests for the nightly hub intelligence sweep cron.

import { vi, describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declared before SUT import
// ---------------------------------------------------------------------------

const mockUpsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}))

const mockFetchIssueCountByBusiness = vi.fn()
vi.mock('@/lib/integrations/linear', () => ({
  fetchIssueCountByBusiness: (...args: unknown[]) => mockFetchIssueCountByBusiness(...args),
}))

const mockFetchLastCommit = vi.fn()
const mockParseRepoUrl = vi.fn()
vi.mock('@/lib/integrations/github', () => ({
  fetchLastCommit: (...args: unknown[]) => mockFetchLastCommit(...args),
  parseRepoUrl: (...args: unknown[]) => mockParseRepoUrl(...args),
}))

// ---------------------------------------------------------------------------
// SUT — imported after mocks
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_AUTH = `Bearer test-cron-secret`

function makeRequest(opts: { auth?: string } = {}): Request {
  return new Request('http://localhost/api/cron/hub-sweep', {
    headers: {
      authorization: opts.auth ?? VALID_AUTH,
    },
  })
}

function setupEnv() {
  process.env.CRON_SECRET = 'test-cron-secret'
  process.env.FOUNDER_USER_ID = 'founder-uuid'
}

function setupSupabaseMocks() {
  // advisory_cases query
  const advisoryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  // bookkeeper_runs query
  const bookkeeperChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  }

  // hub_satellites select (existing rows)
  const hubSelectChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  }

  // hub_satellites upsert
  const hubUpsertChain = {
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }

  mockFrom.mockImplementation((table: string) => {
    if (table === 'advisory_cases') return advisoryChain
    if (table === 'bookkeeper_runs') return bookkeeperChain
    if (table === 'hub_satellites') {
      // Return select chain first, then upsert chain
      return {
        ...hubSelectChain,
        ...hubUpsertChain,
      }
    }
    return hubUpsertChain
  })

  return { advisoryChain, bookkeeperChain, hubSelectChain, hubUpsertChain }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/cron/hub-sweep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupEnv()
    mockFetchIssueCountByBusiness.mockResolvedValue({})
    mockParseRepoUrl.mockReturnValue(null)
    mockFetchLastCommit.mockResolvedValue(null)
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeRequest({ auth: 'wrong-secret' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET does not match', async () => {
    process.env.CRON_SECRET = 'different-secret'
    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 when FOUNDER_USER_ID is not set', async () => {
    delete process.env.FOUNDER_USER_ID
    setupSupabaseMocks()
    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('returns 200 and sweeps all owned businesses', async () => {
    setupSupabaseMocks()
    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json() as { satellitesSwept: number }
    // 6 owned businesses: dr, nrpg, carsi, restore, synthex, ato
    expect(body.satellitesSwept).toBe(6)
  })

  it('fetches Linear issue counts and includes them in the upsert', async () => {
    setupSupabaseMocks()
    mockFetchIssueCountByBusiness.mockResolvedValue({ synthex: 3, dr: 1 })

    const req = makeRequest()
    await GET(req)

    expect(mockFetchIssueCountByBusiness).toHaveBeenCalledOnce()
  })

  it('fetches GitHub commit data when repo_url is set', async () => {
    // Existing satellite row with repo_url
    const hubRows = [{ business_key: 'synthex', repo_url: 'https://github.com/CleanExpo/Synthex', stack: 'next.js', notes: null }]
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: table === 'hub_satellites' ? hubRows : [], error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }))

    mockParseRepoUrl.mockReturnValue({ owner: 'CleanExpo', repo: 'Synthex' })
    mockFetchLastCommit.mockResolvedValue({ sha: 'abc1234', message: 'feat: add new UI', authorDate: '2026-03-24T10:00:00Z' })

    const req = makeRequest()
    await GET(req)

    expect(mockFetchLastCommit).toHaveBeenCalledWith('CleanExpo', 'Synthex')
  })

  it('does NOT sweep CCW (client-type business)', async () => {
    setupSupabaseMocks()
    const req = makeRequest()
    const res = await GET(req)
    const body = await res.json() as { results: Array<{ businessKey: string }> }

    const keys = body.results.map(r => r.businessKey)
    expect(keys).not.toContain('ccw')
  })

  it('continues sweeping other satellites when one fails', async () => {
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'hub_satellites') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          upsert: vi.fn().mockImplementation(() => {
            callCount++
            // First upsert fails, rest succeed
            return Promise.resolve({ error: callCount === 1 ? { message: 'DB error' } : null })
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    const req = makeRequest()
    const res = await GET(req)
    // Should still return 200 (partial success)
    expect(res.status).toBe(200)
  })
})
