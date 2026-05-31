import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET } from '../route'

type Row = Record<string, unknown>

// Per-table mock: `.from(table).select(...).eq('founder_id', id)` resolves to {data,error}.
// `.eq` is the terminal awaited call, so it returns the promise. Records eq calls.
function makeSupabase(
  vault: Row[],
  social: Row[],
  opts: { vaultError?: boolean; socialError?: boolean } = {}
) {
  const eqCalls: Array<[string, unknown]> = []
  const from = vi.fn((table: string) => {
    const result =
      table === 'credentials_vault'
        ? opts.vaultError
          ? { data: null, error: new Error('vault boom') }
          : { data: vault, error: null }
        : opts.socialError
          ? { data: null, error: new Error('social boom') }
          : { data: social, error: null }

    const chain: Record<string, unknown> = {}
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn((col: string, val: unknown) => {
      eqCalls.push([col, val])
      return Promise.resolve(result)
    })
    return chain
  })
  return { client: { from } as never, eqCalls }
}

describe('GET /api/integrations/status', () => {
  const savedEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  afterEach(() => {
    process.env = { ...savedEnv }
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('founder-scopes both reads and derives connection state per source', async () => {
    process.env.LINEAR_API_KEY = 'lin_test_key'
    delete process.env.SENDGRID_API_KEY

    const { client, eqCalls } = makeSupabase(
      [{ service: 'xero', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-02T00:00:00Z', last_accessed_at: null }],
      // social_channels is single-tenant via legacy `owner_id`; columns are `connected` / `last_post_at`
      [{ platform: 'linkedin', connected: true, last_post_at: '2026-05-03T00:00:00Z', updated_at: '2026-05-03T00:00:00Z' }]
    )
    vi.mocked(createClient).mockResolvedValue(client)

    const res = await GET()
    expect(res.status).toBe(200)

    // vault scoped by founder_id; social_channels scoped by legacy owner_id (holds the founder uuid)
    expect(eqCalls).toEqual([
      ['founder_id', 'user-123'],
      ['owner_id', 'user-123'],
    ])

    const body = await res.json()
    const by = (id: string) => body.providers.find((p: { id: string }) => p.id === id)

    // vault: xero has a row → connected, tokenCount 1, lastSync = newest of updated/created
    expect(by('xero').connected).toBe(true)
    expect(by('xero').tokenCount).toBe(1)
    expect(by('xero').lastSync).toBe('2026-05-02T00:00:00Z')

    // vault: gmail (service 'google') has no row → disconnected
    expect(by('gmail').connected).toBe(false)

    // social: linkedin connected; facebook not
    expect(by('linkedin').connected).toBe(true)
    expect(by('facebook').connected).toBe(false)

    // env: linear key present → connected/configured; sendgrid absent → not
    expect(by('linear').connected).toBe(true)
    expect(by('linear').configured).toBe(true)
    expect(by('sendgrid').connected).toBe(false)

    expect(body.summary.total).toBe(body.providers.length)
    expect(body.summary.connected).toBeGreaterThanOrEqual(3) // xero + linkedin + linear
  })

  it('returns 500 when a read errors', async () => {
    const { client } = makeSupabase([], [], { vaultError: true })
    vi.mocked(createClient).mockResolvedValue(client)

    const res = await GET()
    expect(res.status).toBe(500)
  })
})
