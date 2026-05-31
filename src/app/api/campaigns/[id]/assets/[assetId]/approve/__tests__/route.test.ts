import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { makeServiceChain, everyUpdateFounderScoped } from '@/test/founder-scope-chain'
import { POST } from '../route'

function ctx() {
  return { params: Promise.resolve({ id: 'camp-1', assetId: 'asset-1' }) }
}

describe('POST /api/campaigns/[id]/assets/[assetId]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes the campaign_assets UPDATE on approve', async () => {
    const chain = makeServiceChain([
      { data: { id: 'asset-1', status: 'review' }, error: null }, // ownership guard
    ])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)

    const res = await POST(new Request('http://localhost/approve', { method: 'POST' }), ctx())

    expect(res.status).toBe(200)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })
})
