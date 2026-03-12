import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (hoisted above all imports by Vitest transform) ────────────────────

const mockSingle = vi.fn()
const mockOrder = vi.fn(() => ({ data: [], error: null }))
const mockEq = vi.fn(() => ({ order: mockOrder }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockInsertSingle = vi.fn()
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }))
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'contacts') {
    return { select: mockSelect, insert: mockInsert }
  }
  return {}
})

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

// ── Static imports ──────────────────────────────────────────────────────────

import { getUser, createClient } from '@/lib/supabase/server'
import { GET, POST } from '../route'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as any)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorised')
  })

  it('returns contacts array when authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as any)

    const mockContacts = [
      { id: 'c1', first_name: 'Alice', status: 'lead' },
      { id: 'c2', first_name: 'Bob', status: 'client' },
    ]
    mockOrder.mockReturnValue({ data: mockContacts, error: null })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(mockContacts)
    expect(mockFrom).toHaveBeenCalledWith('contacts')
    expect(mockEq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})

describe('POST /api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as any)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const req = new Request('https://app.test/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ first_name: 'Test' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorised')
  })

  it('returns 400 when first_name is missing', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as any)

    const req = new Request('https://app.test/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('first_name is required')
  })

  it('creates a contact and returns the id', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as any)
    mockInsertSingle.mockResolvedValue({ data: { id: 'new-id' }, error: null })

    const req = new Request('https://app.test/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ first_name: 'Alice', email: 'alice@test.com' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe('new-id')
  })
})
