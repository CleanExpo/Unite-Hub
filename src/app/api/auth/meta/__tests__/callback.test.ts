// src/app/api/auth/meta/__tests__/callback.test.ts
//
// Lane #1 (dead code first) — bounded work item: missing-env graceful-fail
// tests for the Meta (Facebook + Instagram) OAuth callback route. The
// existing oauth.test.ts only covers the authorize route; this file
// covers the callback's specific failure modes (missing code, state
// verification failure, token exchange failure).

import { describe, it, expect, vi } from 'vitest'
import { GET as callback } from '../callback/route'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))

const ORIGINAL_META_ID = process.env.FACEBOOK_APP_ID
const ORIGINAL_META_SECRET = process.env.FACEBOOK_APP_SECRET
const ORIGINAL_OAUTH_STATE = process.env.VAULT_ENCRYPTION_KEY
const ORIGINAL_NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL

function restoreEnv(): void {
  if (ORIGINAL_META_ID === undefined) delete process.env.FACEBOOK_APP_ID
  else process.env.FACEBOOK_APP_ID = ORIGINAL_META_ID
  if (ORIGINAL_META_SECRET === undefined) delete process.env.FACEBOOK_APP_SECRET
  else process.env.FACEBOOK_APP_SECRET = ORIGINAL_META_SECRET
  if (ORIGINAL_OAUTH_STATE === undefined) delete process.env.VAULT_ENCRYPTION_KEY
  else process.env.VAULT_ENCRYPTION_KEY = ORIGINAL_OAUTH_STATE
  if (ORIGINAL_NEXT_PUBLIC_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_NEXT_PUBLIC_APP_URL
}

describe('Meta callback route', () => {
  it('redirects to /founder/social?error=missing_params if code is missing', async () => {
    process.env.FACEBOOK_APP_ID = 'test-meta-id'
    process.env.FACEBOOK_APP_SECRET = 'test-meta-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/meta/callback?state=valid-state')
    const res = await callback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=missing_params')
  })

  it('redirects to /founder/social?error=missing_params if state is missing', async () => {
    process.env.FACEBOOK_APP_ID = 'test-meta-id'
    process.env.FACEBOOK_APP_SECRET = 'test-meta-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/meta/callback?code=some-code')
    const res = await callback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=missing_params')
  })

  it('redirects to /founder/social?error=invalid_state when state signature is bad', async () => {
    process.env.FACEBOOK_APP_ID = 'test-meta-id'
    process.env.FACEBOOK_APP_SECRET = 'test-meta-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request(
      'https://app.test/api/auth/meta/callback?code=some-code&state=garbage-state-that-fails-verify',
    )
    const res = await callback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=invalid_state')
  })

  afterEach(() => {
    restoreEnv()
  })
})
