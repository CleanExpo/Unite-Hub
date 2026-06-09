import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET as authorize } from '../authorize/route'
import { GET as callback } from '../callback/route'
import { getUser } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

const originalEnv = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  VAULT_ENCRYPTION_KEY: process.env.VAULT_ENCRYPTION_KEY,
}

describe('Google authorize route', () => {
  beforeEach(() => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as Awaited<ReturnType<typeof getUser>>)
    process.env.GOOGLE_CLIENT_ID = 'valid-client.apps.googleusercontent.com'
    process.env.GOOGLE_CLIENT_SECRET = 'valid-secret'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
  })

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = originalEnv.GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_SECRET = originalEnv.GOOGLE_CLIENT_SECRET
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
    process.env.VAULT_ENCRYPTION_KEY = originalEnv.VAULT_ENCRYPTION_KEY
    vi.clearAllMocks()
  })

  it('returns 401 for anonymous users', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const res = await authorize(new Request('https://app.test/api/auth/google/authorize?email=phill@example.com'))

    expect(res.status).toBe(401)
  })

  it('returns 400 when email is missing', async () => {
    const res = await authorize(new Request('https://app.test/api/auth/google/authorize'))

    expect(res.status).toBe(400)
  })

  it('returns 503 when Google OAuth is missing or placeholder configured', async () => {
    process.env.GOOGLE_CLIENT_ID = 'your-production-client-id'

    const res = await authorize(new Request('https://app.test/api/auth/google/authorize?email=phill@example.com'))
    const body = await res.json() as { error: string }

    expect(res.status).toBe(503)
    expect(body.error).toContain('Google OAuth is not configured')
  })

  it('redirects to Google OAuth with the configured client and login hint', async () => {
    const res = await authorize(new Request('https://app.test/api/auth/google/authorize?email=phill@example.com'))

    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth')
    expect(location).toContain('client_id=valid-client.apps.googleusercontent.com')
    expect(location).toContain('login_hint=phill%40example.com')
    expect(location).toContain('redirect_uri=https%3A%2F%2Fapp.test%2Fapi%2Fauth%2Fgoogle%2Fcallback')
  })

  it('uses the request origin for redirects when NEXT_PUBLIC_APP_URL is absent', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    const res = await authorize(new Request('https://preview.test/api/auth/google/authorize?email=phill@example.com'))

    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('redirect_uri=https%3A%2F%2Fpreview.test%2Fapi%2Fauth%2Fgoogle%2Fcallback')
  })
})

describe('Google callback route', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'valid-client.apps.googleusercontent.com'
    process.env.GOOGLE_CLIENT_SECRET = 'valid-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = originalEnv.GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_SECRET = originalEnv.GOOGLE_CLIENT_SECRET
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
    process.env.VAULT_ENCRYPTION_KEY = originalEnv.VAULT_ENCRYPTION_KEY
    vi.clearAllMocks()
  })

  it('redirects anonymous callback requests to login when NEXT_PUBLIC_APP_URL is absent', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const res = await callback(new Request('https://preview.test/api/auth/google/callback'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://preview.test/auth/login')
  })

  it('redirects missing callback params without throwing when NEXT_PUBLIC_APP_URL is absent', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as Awaited<ReturnType<typeof getUser>>)

    const res = await callback(new Request('https://preview.test/api/auth/google/callback'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://preview.test/founder/email?error=missing_params')
  })
})
