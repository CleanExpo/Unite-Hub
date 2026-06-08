import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET as authorize } from '../authorize/route'
import { GET as callback } from '../callback/route'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { decrypt } from '@/lib/vault'
import { signOAuthState, verifyOAuthState } from '@/lib/oauth-state'
import { getMicrosoftAccessTokenForBusinessKey } from '@/lib/integrations/microsoft-oauth'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
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
    const beforeRequest = Date.now()
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
    const state = new URL(location).searchParams.get('state')
    expect(state).toBeTruthy()
    const decoded = verifyOAuthState(state ?? '')
    expect(decoded.email).toBe('phill@example.com')
    expect(decoded.founderId).toBe('user-123')
    expect(decoded.nonce).toMatch(/^[A-Za-z0-9_-]{20,}$/)
    expect(Number(decoded.expiresAt)).toBeGreaterThan(beforeRequest)
    expect(Number(decoded.expiresAt)).toBeLessThanOrEqual(beforeRequest + 10 * 60 * 1000 + 1000)
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
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as Awaited<ReturnType<typeof getUser>>)
    process.env.MICROSOFT_CLIENT_ID = '11111111-1111-4111-8111-111111111111'
    process.env.MICROSOFT_CLIENT_SECRET = 'valid-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    delete process.env.NEXT_PUBLIC_APP_URL
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    process.env.MICROSOFT_CLIENT_ID = originalEnv.MICROSOFT_CLIENT_ID
    process.env.MICROSOFT_CLIENT_SECRET = originalEnv.MICROSOFT_CLIENT_SECRET
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
    process.env.VAULT_ENCRYPTION_KEY = originalEnv.VAULT_ENCRYPTION_KEY
    vi.clearAllMocks()
    vi.unstubAllGlobals()
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

    const res = await callback(
      new Request('https://preview.test/api/auth/microsoft/callback?code=code&state=bad-state'),
    )

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://preview.test/founder/email?error=microsoft_not_configured',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects callback state for a different founder before token exchange', async () => {
    const state = signOAuthState({
      email: 'phill@example.com',
      founderId: 'other-user',
      nonce: 'nonce',
      expiresAt: String(Date.now() + 60_000),
    })

    const res = await callback(
      new Request(
        `https://preview.test/api/auth/microsoft/callback?code=code&state=${encodeURIComponent(state)}`,
      ),
    )

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://preview.test/founder/email?error=invalid_state',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects expired callback state before token exchange', async () => {
    const state = signOAuthState({
      email: 'phill@example.com',
      founderId: 'user-123',
      nonce: 'nonce',
      expiresAt: String(Date.now() - 1),
    })

    const res = await callback(
      new Request(
        `https://preview.test/api/auth/microsoft/callback?code=code&state=${encodeURIComponent(state)}`,
      ),
    )

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://preview.test/founder/email?error=invalid_state',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stores Microsoft credentials using the authoritative Graph sender', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const businessQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'business-dr' } }),
    }
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn((table: string) => (table === 'businesses' ? businessQuery : { upsert })),
    } as never)
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          scope: 'User.Read Mail.Send',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          displayName: 'Phill McGurk',
          mail: 'phill@disasterrecovery.com.au',
        }),
      } as Response)
    const state = signOAuthState({
      email: 'attacker@example.com',
      founderId: 'user-123',
      nonce: 'nonce',
      expiresAt: String(Date.now() + 60_000),
    })

    const res = await callback(
      new Request(
        `https://preview.test/api/auth/microsoft/callback?code=code&state=${encodeURIComponent(state)}`,
      ),
    )

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://preview.test/founder/email?connected=phill%40disasterrecovery.com.au',
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0])).toContain('https://graph.microsoft.com/v1.0/me')
    expect(businessQuery.eq).toHaveBeenCalledWith('founder_id', 'user-123')
    expect(businessQuery.eq).toHaveBeenCalledWith('slug', 'dr')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        founder_id: 'user-123',
        business_id: 'business-dr',
        service: 'microsoft',
        label: 'Phill McGurk',
        notes: 'phill@disasterrecovery.com.au',
        metadata: {
          email: 'phill@disasterrecovery.com.au',
          displayName: 'Phill McGurk',
          businessKey: 'dr',
          loginHintEmail: 'attacker@example.com',
        },
      }),
      { onConflict: 'founder_id,service,label' },
    )
  })
})

describe('Microsoft token helper', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    process.env.MICROSOFT_CLIENT_ID = '11111111-1111-4111-8111-111111111111'
    process.env.MICROSOFT_CLIENT_SECRET = 'valid-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    process.env.MICROSOFT_CLIENT_ID = originalEnv.MICROSOFT_CLIENT_ID
    process.env.MICROSOFT_CLIENT_SECRET = originalEnv.MICROSOFT_CLIENT_SECRET
    process.env.VAULT_ENCRYPTION_KEY = originalEnv.VAULT_ENCRYPTION_KEY
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('looks up Microsoft credentials by business key', async () => {
    const encrypted = await import('@/lib/vault').then(({ encrypt }) =>
      encrypt(
        JSON.stringify({
          access_token: 'current-access-token',
          refresh_token: 'current-refresh-token',
          expires_at: Date.now() + 3600_000,
          scope: 'User.Read',
        }),
      ),
    )
    const vaultQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          encrypted_value: encrypted.encryptedValue,
          iv: encrypted.iv,
          salt: encrypted.salt,
          business_id: 'business-dr',
          label: 'DR Primary',
          notes: 'phill@disasterrecovery.com.au',
          metadata: { email: 'phill@disasterrecovery.com.au', businessKey: 'dr' },
        },
      }),
    }
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn(() => vaultQuery),
    } as never)

    const token = await getMicrosoftAccessTokenForBusinessKey('user-123', 'dr')

    expect(token).toBe('current-access-token')
    expect(vaultQuery.eq).toHaveBeenCalledWith('founder_id', 'user-123')
    expect(vaultQuery.eq).toHaveBeenCalledWith('service', 'microsoft')
    expect(vaultQuery.eq).toHaveBeenCalledWith('metadata->>businessKey', 'dr')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('persists rotated Microsoft refresh token data back into credentials_vault', async () => {
    const encrypted = await import('@/lib/vault').then(({ encrypt }) =>
      encrypt(
        JSON.stringify({
          access_token: 'expired-access-token',
          refresh_token: 'old-refresh-token',
          expires_at: Date.now() - 1000,
          scope: 'old-scope',
        }),
      ),
    )
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const vaultQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          encrypted_value: encrypted.encryptedValue,
          iv: encrypted.iv,
          salt: encrypted.salt,
          business_id: 'business-dr',
          label: 'DR Primary',
          notes: 'phill@disasterrecovery.com.au',
          metadata: { email: 'phill@disasterrecovery.com.au', businessKey: 'dr' },
        },
      }),
    }
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValueOnce(vaultQuery).mockReturnValueOnce({ upsert }),
    } as never)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 7200,
        scope: 'new-scope',
      }),
    } as Response)

    const token = await getMicrosoftAccessTokenForBusinessKey('user-123', 'dr')

    expect(token).toBe('new-access-token')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        founder_id: 'user-123',
        business_id: 'business-dr',
        service: 'microsoft',
        label: 'DR Primary',
        notes: 'phill@disasterrecovery.com.au',
        metadata: { email: 'phill@disasterrecovery.com.au', businessKey: 'dr' },
      }),
      { onConflict: 'founder_id,service,label' },
    )
    const persisted = upsert.mock.calls[0][0] as {
      encrypted_value: string
      iv: string
      salt: string
    }
    const persistedTokens = JSON.parse(
      decrypt({
        encryptedValue: persisted.encrypted_value,
        iv: persisted.iv,
        salt: persisted.salt,
      }),
    ) as {
      access_token: string
      refresh_token: string
      expires_at: number
      scope: string
    }
    expect(persistedTokens.access_token).toBe('new-access-token')
    expect(persistedTokens.refresh_token).toBe('new-refresh-token')
    expect(persistedTokens.scope).toBe('new-scope')
    expect(persistedTokens.expires_at).toBeGreaterThan(Date.now() + 7000_000)
  })
})
