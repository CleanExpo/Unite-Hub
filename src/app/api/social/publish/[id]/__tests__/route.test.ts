import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/integrations/social/channels', () => ({ decodeToken: vi.fn(() => 'tok') }))
vi.mock('@/lib/integrations/social/publisher', () => ({ publishToPlatform: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { makeServiceChain, everyUpdateFounderScoped } from '@/test/founder-scope-chain'
import { POST } from '../route'

describe('POST /api/social/publish/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes both social_posts UPDATE chains (publishing + final status)', async () => {
    const chain = makeServiceChain([
      // ownership guard — single connected platform, no channel found => fast finish
      { data: { id: 'post-1', status: 'draft', platforms: ['facebook'], business_key: 'synthex', platform_post_ids: {} }, error: null },
    ])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)

    const res = await POST(
      new Request('http://localhost/publish', { method: 'POST' }),
      { params: Promise.resolve({ id: 'post-1' }) }
    )

    expect(res.status).toBe(200)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })
})
