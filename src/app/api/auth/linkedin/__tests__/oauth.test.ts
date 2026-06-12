// src/app/api/auth/linkedin/__tests__/oauth.test.ts
//
// Lane #1 (dead code first) — bounded work item: missing-env graceful-fail
// tests for the LinkedIn OAuth route. The route is reachable from
// production via the founder UI's ConnectionStrip "Connect LinkedIn" button.
// Without these tests, an absent LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
// would surface as a confusing 500 in the founder's browser, not as the
// structured 500 the health-connector route already reports.

import { describe, it, expect, vi } from 'vitest'
import { GET as authorize } from '../authorize/route'
import { GET as callback } from '../callback/route'

// Mock the Supabase server client to return a logged-in user.
vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))

const ORIGINAL_LINKEDIN_ID = process.env.LINKEDIN_CLIENT_ID
const ORIGINAL_LINKEDIN_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const ORIGINAL_OAUTH_STATE = process.env.VAULT_ENCRYPTION_KEY
const ORIGINAL_NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL

function restoreEnv(): void {
  if (ORIGINAL_LINKEDIN_ID === undefined) delete process.env.LINKEDIN_CLIENT_ID
  else process.env.LINKEDIN_CLIENT_ID = ORIGINAL_LINKEDIN_ID
  if (ORIGINAL_LINKEDIN_SECRET === undefined) delete process.env.LINKEDIN_CLIENT_SECRET
  else process.env.LINKEDIN_CLIENT_SECRET = ORIGINAL_LINKEDIN_SECRET
  if (ORIGINAL_OAUTH_STATE === undefined) delete process.env.VAULT_ENCRYPTION_KEY
  else process.env.VAULT_ENCRYPTION_KEY = ORIGINAL_OAUTH_STATE
  if (ORIGINAL_NEXT_PUBLIC_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_NEXT_PUBLIC_APP_URL
}

describe('LinkedIn authorize route', () => {
  it('redirects to LinkedIn OAuth with correct params when env is configured', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-id'
    process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/linkedin/authorize?business=synthex')
    const res = await authorize(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('linkedin.com/oauth/v2/authorization')
    expect(location).toContain('test-linkedin-id')
    expect(location).toContain('w_member_social')
  })

  it('returns 400 if business param missing', async () => {
    const req = new Request('https://app.test/api/auth/linkedin/authorize')
    const res = await authorize(req)
    expect(res.status).toBe(400)
  })

  it('returns 503 with structured error when LINKEDIN_CLIENT_ID is unset (fail-loud patch — PR #125)', async () => {
    delete process.env.LINKEDIN_CLIENT_ID
    delete process.env.LINKEDIN_CLIENT_SECRET
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/linkedin/authorize?business=synthex')
    const res = await authorize(req)
    // After the fix (PR #125), the route returns a structured 503 instead
    // of redirecting to LinkedIn with client_id=undefined in the URL.
    expect(res.status).toBe(503)
    const body = (await res.json()) as { check: string; missing_env_vars: string[] }
    expect(body.check).toBe('linkedin_authorize')
    expect(body.missing_env_vars).toContain('LINKEDIN_CLIENT_ID')
  })
})

describe('LinkedIn callback route', () => {
  it('redirects to /founder/social?error=missing_params if code is missing', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-id'
    process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/linkedin/callback?state=valid-state')
    const res = await callback(req)
    // NextResponse.redirect returns 307; the route should hit the missing-params branch
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=missing_params')
  })

  it('redirects to /founder/social?error=missing_params if state is missing', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-id'
    process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret'
    process.env.VAULT_ENCRYPTION_KEY = 'test-encryption-key-32-bytes-ok!'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'

    const req = new Request('https://app.test/api/auth/linkedin/callback?code=some-code')
    const res = await callback(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/founder/social?error=missing_params')
  })

  afterEach(() => {
    restoreEnv()
  })
})
