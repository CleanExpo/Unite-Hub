import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

describe('GET /api/strategy/insights', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: [], error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the strategy_insights query to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await GET(new Request('https://app.test/api/strategy/insights'))
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
