import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { PATCH, DELETE } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const ctx = { params: Promise.resolve({ id: 't1' }) }

describe('PATCH /api/boardroom/team/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: { id: 't1' }, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the team_members update to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const req = new Request('https://app.test/x', { method: 'PATCH', body: JSON.stringify({ name: 'New' }) })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})

describe('DELETE /api/boardroom/team/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: null, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the team_members soft-delete to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await DELETE(new Request('https://app.test/x'), ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
