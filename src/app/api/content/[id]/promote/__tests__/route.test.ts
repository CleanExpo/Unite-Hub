import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { makeServiceChain, everyUpdateFounderScoped } from '@/test/founder-scope-chain'
import { POST } from '../route'

function req() {
  return new Request('http://localhost/promote', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

describe('POST /api/content/[id]/promote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes the generated_content UPDATE on promote', async () => {
    const chain = makeServiceChain([
      // ownership guard
      { data: { id: 'c-1', status: 'draft', platform: 'facebook', body: 'hi', hashtags: null, business_key: 'synthex', title: 't', media_urls: [] }, error: null },
      // social_posts insert .select('id, status').single()
      { data: { id: 'post-1', status: 'draft' }, error: null },
    ])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)

    const res = await POST(req(), { params: Promise.resolve({ id: 'c-1' }) })

    expect(res.status).toBe(200)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })
})
