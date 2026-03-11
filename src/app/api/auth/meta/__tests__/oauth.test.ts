import { describe, it, expect, vi } from 'vitest'
import { GET as authorize } from '../authorize/route'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))

describe('Meta authorize route', () => {
  it('redirects to Facebook OAuth with correct params', async () => {
    process.env.FACEBOOK_APP_ID = 'test-app-id'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/meta/authorize?business=dr')
    const res = await authorize(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('facebook.com/v19.0/dialog/oauth')
    expect(location).toContain('test-app-id')
    expect(location).toContain('pages_manage_posts')
  })

  it('returns 400 if business param missing', async () => {
    const req = new Request('https://app.test/api/auth/meta/authorize')
    const res = await authorize(req)
    expect(res.status).toBe(400)
  })
})
