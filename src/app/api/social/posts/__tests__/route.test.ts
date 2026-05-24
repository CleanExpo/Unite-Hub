import { describe, it, expect, vi } from 'vitest'

const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) })
const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: '1', status: 'draft' }, error: null }) }) })

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: mockSelect, insert: mockInsert })),
  })),
}))

describe('POST /api/social/posts', () => {
  it('creates a draft post', async () => {
    const { POST } = await import('../route')
    const req = new Request('https://app.test/api/social/posts', {
      method: 'POST',
      body: JSON.stringify({ businessKey: 'dr', content: 'Hello', platforms: ['facebook'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 if content missing', async () => {
    const { POST } = await import('../route')
    const req = new Request('https://app.test/api/social/posts', {
      method: 'POST',
      body: JSON.stringify({ businessKey: 'dr', platforms: ['facebook'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
