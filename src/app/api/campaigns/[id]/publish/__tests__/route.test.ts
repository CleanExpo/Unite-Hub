import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { makeServiceChain, everyUpdateFounderScoped } from '@/test/founder-scope-chain'
import { POST } from '../route'

describe('POST /api/campaigns/[id]/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes the campaign_assets + campaigns UPDATE chains', async () => {
    const chain = makeServiceChain([
      // ready assets guard (awaited, no .single())
      { data: [{ id: 'asset-1', platform: 'facebook', copy: 'hi', image_url: null }], error: null },
      // campaign select .single() for businessKey
      { data: { brand_profiles: { business_key: 'synthex' } }, error: null },
      // social_posts insert .select('id').single()
      { data: { id: 'post-1' }, error: null },
    ])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)

    const res = await POST(
      new Request('http://localhost/publish', { method: 'POST', body: JSON.stringify({}) }),
      { params: Promise.resolve({ id: 'camp-1' }) }
    )

    expect(res.status).toBe(200)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })
})
