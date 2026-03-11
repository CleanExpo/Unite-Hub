import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))

vi.mock('@/lib/integrations/social/channels', () => ({
  getChannels: vi.fn().mockResolvedValue([
    { id: '1', platform: 'facebook', businessKey: 'dr', isConnected: true, channelName: 'DR FB Page' },
  ]),
}))

describe('GET /api/social/channels', () => {
  it('returns channels array', async () => {
    const { GET } = await import('../route')
    const req = new Request('https://app.test/api/social/channels?business=dr')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json() as { channels: unknown[] }
    expect(json.channels).toHaveLength(1)
  })
})
