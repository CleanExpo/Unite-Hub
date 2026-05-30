import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/integrations/heygen', () => ({
  getVideoStatus: vi.fn(),
}))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getVideoStatus } from '@/lib/integrations/heygen'
import { GET } from '../route'

function makeChain(results: Array<{ data?: unknown; error: unknown }>) {
  const queue = [...results]
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(queue.shift()))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(queue[0])
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

describe('GET /api/video/[id]/status', () => {
  let chain: ReturnType<typeof makeChain>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
  })

  it('founder-scopes the video_assets UPDATE on the completed path', async () => {
    chain = makeChain([
      {
        data: {
          id: 'vid-1',
          status: 'generating',
          external_job_id: 'job-1',
          founder_id: 'user-123',
        },
        error: null,
      },
      { data: { id: 'vid-1', status: 'ready' }, error: null },
    ])
    vi.mocked(createServiceClient).mockReturnValue({ from: vi.fn(() => chain) } as never)
    vi.mocked(getVideoStatus).mockResolvedValue({
      status: 'completed',
      videoUrl: 'https://x/v.mp4',
      thumbnailUrl: 'https://x/t.jpg',
      duration: 42,
    } as never)

    const request = new Request('http://localhost/api/video/vid-1/status')
    const res = await GET(request, { params: Promise.resolve({ id: 'vid-1' }) })

    expect(res.status).toBe(200)

    // The founder_id filter must appear on both the fetch AND the update
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')

    const founderCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[0] === 'founder_id'
    )
    expect(founderCalls.length).toBeGreaterThanOrEqual(2)
  })
})
