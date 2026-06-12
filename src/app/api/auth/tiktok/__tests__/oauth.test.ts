// src/app/api/auth/tiktok/__tests__/oauth.test.ts
//
// Lane #1 (dead code first) — bounded work item: missing-env graceful-fail
// tests for the TikTok OAuth route. Same pattern as the LinkedIn test.

import { describe, it, expect, vi } from 'vitest'
import { GET as authorize } from '../authorize/route'
import { GET as callback } from '../callback/route'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))

const ORIGINAL_TIKTOK_KEY = process.env.TIKTOK_CLIENT_KEY
const ORIGINAL_TIKTOK_SECRET = process.env.TIKTOK_CLIENT_SECRET
const ORIGINAL_OAUTH_STATE = process.env.VAULT_ENCRYPTION_KEY
const ORIGINAL_NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL

function restoreEnv(): void {
  if (ORIGINAL_TIKTOK_KEY === undefined) delete process.env.TIKTOK_CLIENT_KEY
  else process.env.TIKTOK_CLIENT_KEY = ORIGINAL_TIKTOK_KEY
  if (ORIGINAL_TIKTOK_SECRET === undefined) delete process.env.TIKTOK_CLIENT_SECRET
  else process.env.TIKTOK_CLIENT_SECRET = ORIGINAL_TIKTOK_SECRET
  if (ORIGINAL_OAUTH_STATE === undefined) delete process.env.VAULT_ENCRYPTION_KEY
  else process.env.VAULT_ENCRYPTION_KEY = ORIGINAL_OAUTH_STATE
  if (ORIGINAL_NEXT_PUBLIC_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_NEXT_PUBLIC_APP_URL
}

describe('TikTok authorize route', () => {
  it('redirects to TikTok OAuth with correct params when env is configured', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'test-tiktok-key'
    process.env.TIKTOK_CLIENT_SECRET = 'test-tiktok-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/tiktok/authorize?business=synthex')
    const res = await authorize(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('tiktok.com/v2/auth/authorize')
    expect(location).toContain('test-tiktok-key')
    expect(location).toContain('user.info.basic')
  })

  it('returns 400 if business param missing', async () => {
    const req = new Request('https://app.test/api/auth/tiktok/authorize')
    const res = await authorize(req)
    expect(res.status).toBe(400)
  })

  it('RED TEST: today the route redirects with client_key=undefined when env is unset (fail-silently bug — bounded follow-on PR fixes)', async () => {
    delete process.env.TIKTOK_CLIENT_KEY
    delete process.env.TIKTOK_CLIENT_SECRET
    process.env.VAULT_ENCRYPTION_KEY = 'test-暗号化-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/tiktok/authorize?business=synthex')
    const res = await authorize(req)
    // Same fail-silently bug as LinkedIn. Documents the current behavior.
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('tiktok.com/v2/auth/authorize')
    expect(location).toContain('client_key=undefined')
  })
})

describe('TikTok callback route', () => {
  it('redirects to /founder/social?error=missing_params if code is missing', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'test-tiktok-key'
    process.env.TIKTOK_CLIENT_SECRET = 'test-tiktok-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/tiktok/callback?state=valid-state')
    const res = await callback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=missing_params')
  })

  it('redirects to /founder/social?error=missing_params if state is missing', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'test-tiktok-key'
    process.env.TIKTOK_CLIENT_SECRET = 'test-tiktok-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/tiktok/callback?code=some-code')
    const res = await callback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=missing_params')
  })

  afterEach(() => {
    restoreEnv()
  })
})
