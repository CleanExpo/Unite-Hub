import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/campaigns/brand-extractor', () => ({
  extractBrandDNA: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { extractBrandDNA } from '@/lib/campaigns/brand-extractor'
import { POST } from '../route'

function makeChain(results: Array<{ data?: unknown; error: unknown }>) {
  const queue = [...results]
  const chain: Record<string, unknown> = {}
  chain.upsert = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(queue.shift()))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(queue[0])
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const brandDNA = {
  logoUrl: null,
  colours: { primary: '#000', secondary: '#fff', accent: '#00f', neutrals: [] },
  fonts: { heading: 'sans', body: 'sans', accent: null },
  toneOfVoice: 'bold',
  brandValues: [],
  tagline: 'go',
  targetAudience: 'smb',
  industry: 'tech',
  imageryStyle: 'clean',
  referenceImages: [],
}

function validRequest() {
  return new Request('http://localhost/api/campaigns/scan', {
    method: 'POST',
    body: JSON.stringify({ websiteUrl: 'https://example.com', clientName: 'Acme' }),
  })
}

describe('POST /api/campaigns/scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes the brand_profiles UPDATE on the success path', async () => {
    const chain = makeChain([
      { data: { id: 'prof-1' }, error: null }, // upsert .select('id').single()
      { data: { id: 'prof-1' }, error: null }, // success-path update
    ])
    vi.mocked(createServiceClient).mockReturnValue({ from: vi.fn(() => chain) } as never)
    vi.mocked(extractBrandDNA).mockResolvedValue(brandDNA as never)

    const res = await POST(validRequest())

    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })

  it('founder-scopes the brand_profiles UPDATE on the failed (catch) path', async () => {
    const chain = makeChain([
      { data: { id: 'prof-1' }, error: null }, // upsert .select('id').single()
      { data: { id: 'prof-1' }, error: null }, // failed-path update
    ])
    vi.mocked(createServiceClient).mockReturnValue({ from: vi.fn(() => chain) } as never)
    vi.mocked(extractBrandDNA).mockRejectedValue(new Error('extraction boom'))

    const res = await POST(validRequest())

    expect(res.status).toBe(500)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
