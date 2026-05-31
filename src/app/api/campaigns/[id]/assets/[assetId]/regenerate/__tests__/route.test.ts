import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/campaigns/image-generator', () => ({ generateCampaignImage: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateCampaignImage } from '@/lib/campaigns/image-generator'
import { makeServiceChain, everyUpdateFounderScoped } from '@/test/founder-scope-chain'
import { POST } from '../route'

describe('POST /api/campaigns/[id]/assets/[assetId]/regenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    // No image returned => storage path skipped, both UPDATE chains still run.
    vi.mocked(generateCampaignImage).mockResolvedValue({
      imageBase64: null,
      error: 'skip',
      mimeType: 'image/png',
      imageEngine: 'test',
      qualityScore: 0,
      qualityStatus: 'pending',
    } as never)
  })

  it('founder-scopes both campaign_assets UPDATE chains (generating + final)', async () => {
    const chain = makeServiceChain([
      {
        data: {
          id: 'asset-1',
          visual_type: 'photo',
          image_prompt: 'p',
          platform: 'facebook',
          headline: null,
          cta: null,
          campaigns: { brand_profiles: { client_name: 'Acme', website_url: 'x' } },
        },
        error: null,
      }, // ownership guard
    ])
    vi.mocked(createServiceClient).mockReturnValue(chain as never)

    const res = await POST(
      new Request('http://localhost/regenerate', { method: 'POST' }),
      { params: Promise.resolve({ id: 'camp-1', assetId: 'asset-1' }) }
    )

    expect(res.status).toBe(200)
    expect(everyUpdateFounderScoped(chain, 'user-123')).toBe(true)
  })
})
