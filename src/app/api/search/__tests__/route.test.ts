// src/app/api/search/__tests__/route.test.ts
import { NextRequest } from 'next/server'
import { GET } from '../route'

// --- Mocks ---
const mockGetUser = vi.fn()

// Chainable query builder factory
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    or:     vi.fn().mockReturnThis(),
    ilike:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockResolvedValue(result),
  }
  return builder
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getUser:      () => mockGetUser(),
  createClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}))

function makeRequest(q?: string): NextRequest {
  const url = q !== undefined
    ? `http://localhost/api/search?q=${encodeURIComponent(q)}`
    : 'http://localhost/api/search'
  return new NextRequest(url)
}

// Default mock data (empty arrays — override per test)
const mockContactsData: unknown[] = []
const mockPagesData: unknown[]    = []
const mockApprovalsData: unknown[] = []

// --- Tests ---

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset shared mutable arrays so mutations in one test don't bleed into the next
    mockContactsData.length = 0
    mockPagesData.length = 0
    mockApprovalsData.length = 0
    mockGetUser.mockResolvedValue({ id: 'founder-uuid' })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'contacts')
        return makeQueryBuilder({ data: mockContactsData, error: null })
      if (table === 'nexus_pages')
        return makeQueryBuilder({ data: mockPagesData, error: null })
      if (table === 'approval_queue')
        return makeQueryBuilder({ data: mockApprovalsData, error: null })
      return makeQueryBuilder({ data: [], error: null })
    })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await GET(makeRequest('test'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorised')
  })

  it('returns 400 when q is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/at least 2/)
  })

  it('returns 400 when q is 1 character', async () => {
    const res = await GET(makeRequest('a'))
    expect(res.status).toBe(400)
  })

  it('returns grouped results when query matches', async () => {
    mockContactsData.length = 0
    mockContactsData.push({ id: 'c1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', company: 'Acme' })
    mockPagesData.length = 0
    mockPagesData.push({ id: 'p1', title: 'Alice strategy doc' })
    mockApprovalsData.length = 0
    mockApprovalsData.push({ id: 'a1', title: 'Alice budget approval', status: 'pending' })

    const res = await GET(makeRequest('alice'))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.contacts).toHaveLength(1)
    expect(body.contacts[0]).toEqual({ id: 'c1', name: 'Alice Smith', email: 'alice@test.com', company: 'Acme' })
    expect(body.pages).toHaveLength(1)
    expect(body.pages[0]).toEqual({ id: 'p1', title: 'Alice strategy doc' })
    expect(body.approvals).toHaveLength(1)
    expect(body.approvals[0]).toEqual({ id: 'a1', title: 'Alice budget approval', status: 'pending' })
  })

  it('returns empty arrays when no matches (200, not an error)', async () => {
    // mockContactsData/Pages/Approvals are already [] from beforeEach
    const res = await GET(makeRequest('zzznomatch'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contacts).toEqual([])
    expect(body.pages).toEqual([])
    expect(body.approvals).toEqual([])
  })

  it('returns partial results when one entity query rejects', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'contacts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          or:     vi.fn().mockReturnThis(),
          ilike:  vi.fn().mockReturnThis(),
          limit:  vi.fn().mockRejectedValue(new Error('DB timeout')),
        }
      }
      if (table === 'nexus_pages')
        return makeQueryBuilder({ data: [{ id: 'p1', title: 'Found page' }], error: null })
      return makeQueryBuilder({ data: [{ id: 'a1', title: 'Found approval', status: 'pending' }], error: null })
    })

    const res = await GET(makeRequest('found'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contacts).toEqual([])  // failed → empty fallback
    expect(body.pages).toHaveLength(1)
    expect(body.approvals).toHaveLength(1)
  })
})
