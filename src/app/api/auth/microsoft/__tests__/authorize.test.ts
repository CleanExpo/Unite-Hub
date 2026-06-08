import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET as authorize } from '../authorize/route'
import { GET as callback } from '../callback/route'
import { getUser } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

const originalEnv = {
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  VAULT_ENCRYPTION_KEY: process.env.VAULT_ENCRYPTION_KEY,
}

describe('Microsoft authorize route', () => {
  beforeEach(() => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as Awaited<ReturnType<typeof getUser>>)
    process.env.MICROSOFT_CLIENT_ID = '11111111-1111-4111-8111-111111111111'
    process.env.MICROSOFT_CLIENT_SECRET = 'valid-secret'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
  })

  afterEach(() => {
    process.env.MICROSOFT_CLIENT_ID = originalEnv.MICROSOFT_CLIENT_ID
    process.env.MICROSOFT_CLIENT_SECRET = originalEnv.MICROSOFT_CLIENT_SECRET
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
    process.env.VAULT_ENCRYPTION_KEY = originalEnv.VAULT_ENCRYPTION_KEY
    vi.clearAllMocks()
  })

  it('returns 401 for anonymous users', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const res = await authorize(
      new Request('https://app.test/api/auth/microsoft/authorize?email=phill@example.com'),
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 when email is missing', async () => {
    const res = await authorize(new Request('https://app.test/api/auth/microsoft/authorize'))

    expect(res.status).toBe(400)
  })

  it('returns 503 when Microsoft OAuth is missing or placeholder configured', async () => {
    process.env.MICROSOFT_CLIENT_ID = 'your-production-client-id'

    const res = await authorize(
      new Request('https://app.test/api/auth/microsoft/authorize?email=phill@example.com'),
    )
    const body = (await res.json()) as { error: string }

    expect(res.status).toBe(503)
    expect(body.error).toContain('Microsoft OAuth is not configured')
  })

  it('redirects to Microsoft OAuth with the configured client and login hint', async () => {
    const res = await authorize(
      new Request('https://app.test/api/auth/microsoft/authorize?email=phill@example.com'),
    )

    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
    expect(location).toContain('client_id=11111111-1111-4111-8111-111111111111')
    expect(location).toContain('login_hint=phill%40example.com')
    expect(location).toContain(
      'redirect_uri=https%3A%2F%2Fapp.test%2Fapi%2Fauth%2Fmicrosoft%2Fcallback',
    )
  })

  it('uses the request origin for redirects when NEXT_PUBLIC_APP_URL is absent', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    const res = await authorize(
      new Request('https://preview.test/api/auth/microsoft/authorize?email=phill@example.com'),
    )

    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain(
      'redirect_uri=https%3A%2F%2Fpreview.test%2Fapi%2Fauth%2Fmicrosoft%2Fcallback',
    )
  })
})

describe('Microsoft callback route', () => {
  beforeEach(() => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as Awaited<ReturnType<typeof getUser>>)
    process.env.MICROSOFT_CLIENT_ID = '11111111-1111-4111-8111-111111111111'
    process.env.MICROSOFT_CLIENT_SECRET = 'valid-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  afterEach(() => {
    process.env.MICROSOFT_CLIENT_ID = originalEnv.MICROSOFT_CLIENT_ID
    process.env.MICROSOFT_CLIENT_SECRET = originalEnv.MICROSOFT_CLIENT_SECRET
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
    process.env.VAULT_ENCRYPTION_KEY = originalEnv.VAULT_ENCRYPTION_KEY
    vi.clearAllMocks()
  })

  it('redirects anonymous callback requests to login when NEXT_PUBLIC_APP_URL is absent', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const res = await callback(new Request('https://preview.test/api/auth/microsoft/callback'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://preview.test/auth/login')
  })

  it('redirects missing callback params without throwing when NEXT_PUBLIC_APP_URL is absent', async () => {
    const res = await callback(new Request('https://preview.test/api/auth/microsoft/callback'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://preview.test/founder/email?error=missing_params',
    )
  })

  it('redirects before token exchange when Microsoft OAuth env is missing', async () => {
    process.env.MICROSOFT_CLIENT_SECRET = ''
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const res = await callback(
      new Request('https://preview.test/api/auth/microsoft/callback?code=code&state=bad-state'),
    )

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://preview.test/founder/email?error=microsoft_not_configured',
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
