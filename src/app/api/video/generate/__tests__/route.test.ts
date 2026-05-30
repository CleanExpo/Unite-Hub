import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/content/generator', () => ({
  generateContent: vi.fn(),
}))

vi.mock('@/lib/integrations/heygen', () => ({
  createTalkingHeadVideo: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateContent } from '@/lib/content/generator'
import { createTalkingHeadVideo } from '@/lib/integrations/heygen'
import { POST } from '../route'

function makeChain(results: Array<{ data?: unknown; error: unknown }>) {
  const queue = [...results]
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(queue.shift()))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(queue[0])
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const brandRow = {
  id: 'brand-1',
  founder_id: 'user-123',
  business_key: 'acme',
  tone_of_voice: 'bold',
  target_audience: 'smb',
  industry_keywords: ['x'],
  unique_selling_points: ['y'],
  character_male: { heygenAvatarId: 'avatar-1', heygenVoiceId: 'voice-1' },
  character_female: { heygenAvatarId: 'avatar-2', heygenVoiceId: 'voice-2' },
  colour_primary: null,
  colour_secondary: null,
  do_list: [],
  dont_list: [],
  sample_content: {},
  created_at: '2026-05-30',
  updated_at: '2026-05-30',
}

function validRequest() {
  return new Request('http://localhost/api/video/generate', {
    method: 'POST',
    body: JSON.stringify({
      businessKey: 'acme',
      platform: 'tiktok',
      topic: 'launch',
      characterPreference: 'male',
    }),
  })
}

describe('POST /api/video/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    vi.mocked(generateContent).mockResolvedValue([{ body: 'script body' }] as never)
  })

  it('founder-scopes the video_assets UPDATE on the generating (success) path', async () => {
    const chain = makeChain([
      { data: brandRow, error: null }, // brand_identities select
      { data: { id: 'vid-1' }, error: null }, // video_assets insert
      { data: { id: 'vid-1' }, error: null }, // video_assets update
    ])
    vi.mocked(createServiceClient).mockReturnValue({ from: vi.fn(() => chain) } as never)
    vi.mocked(createTalkingHeadVideo).mockResolvedValue('heygen-job-1' as never)

    const res = await POST(validRequest())

    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })

  it('founder-scopes the video_assets UPDATE on the failed path', async () => {
    const chain = makeChain([
      { data: brandRow, error: null }, // brand_identities select
      { data: { id: 'vid-1' }, error: null }, // video_assets insert
      { data: { id: 'vid-1' }, error: null }, // video_assets failed-path update
    ])
    vi.mocked(createServiceClient).mockReturnValue({ from: vi.fn(() => chain) } as never)
    vi.mocked(createTalkingHeadVideo).mockRejectedValue(new Error('HeyGen down'))

    const res = await POST(validRequest())

    expect(res.status).toBe(500)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
