# Social Content Calendar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full social content calendar — OAuth for Facebook, Instagram, LinkedIn, TikTok, and YouTube; post creation, scheduling, cross-posting, and analytics per business.

**Architecture:** 4 OAuth flows (Meta covers FB+IG, plus LinkedIn, TikTok, YouTube via separate Google OAuth) following the existing authorize→callback→encrypt→upsert pattern. Tokens stored in `social_channels` table. `social_posts` table for drafts/scheduled/published content. UI extends the existing stub at `/founder/social`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, `src/lib/vault.ts` for AES-256-GCM encryption. Test with `pnpm vitest run`. Lint with `pnpm run lint`. Type-check with `pnpm run type-check`.

**Reference files (read before starting):**
- `src/app/api/auth/google/authorize/route.ts` — OAuth authorize pattern
- `src/app/api/auth/google/callback/route.ts` — OAuth callback pattern (encrypt + upsert)
- `src/lib/vault.ts` — `encrypt()` / `decrypt()` signatures
- `src/lib/supabase/server.ts` — `getUser()` helper
- `src/lib/supabase/service.ts` — `createServiceClient()` for DB writes
- `src/lib/integrations/social.ts` — existing stub to replace

**DB migration already applied:** `supabase/migrations/20260312000000_social_content_calendar.sql`
- `social_channels` extended with: `business_key`, `handle`, `name`, `follower_count`, `profile_image_url`, `last_synced_at`
- `social_posts` table created (see migration for full schema)

---

### Task 1: Social types + DB helpers

Replace the stub `src/lib/integrations/social.ts` with a proper module. Create the barrel and shared DB helper.

**Files:**
- Delete content of: `src/lib/integrations/social.ts` (replace entirely)
- Create: `src/lib/integrations/social/types.ts`
- Create: `src/lib/integrations/social/channels.ts`
- Create: `src/lib/integrations/social/index.ts`

**Step 1: Write the failing test**

Create `src/lib/integrations/social/__tests__/channels.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/vault', () => ({
  encrypt: vi.fn((v: string) => ({ encryptedValue: `enc:${v}`, iv: 'iv', salt: 'salt' })),
  decrypt: vi.fn(({ encryptedValue }: { encryptedValue: string }) => encryptedValue.replace('enc:', '')),
}))

describe('social channels', () => {
  it('encodeToken serialises VaultPayload to JSON string', async () => {
    const { encodeToken, decodeToken } = await import('../channels')
    const encoded = encodeToken('my-token')
    expect(typeof encoded).toBe('string')
    const decoded = decodeToken(encoded)
    expect(decoded).toBe('my-token')
  })

  it('PLATFORMS contains all 5 platforms', async () => {
    const { PLATFORMS } = await import('../types')
    expect(PLATFORMS).toEqual(['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'])
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd C:/Unite-Group && pnpm vitest run src/lib/integrations/social/__tests__/channels.test.ts
```
Expected: FAIL — modules not found.

**Step 3: Create `src/lib/integrations/social/types.ts`**

```typescript
export const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'] as const
export type SocialPlatform = typeof PLATFORMS[number]

export interface SocialChannel {
  id: string
  founderId: string
  platform: SocialPlatform
  businessKey: string
  channelId: string
  channelName: string | null
  handle: string | null
  name: string | null
  followerCount: number
  profileImageUrl: string | null
  isConnected: boolean
  tokenExpiresAt: string | null
  lastSyncedAt: string | null
}

export interface SocialPost {
  id: string
  founderId: string
  businessKey: string
  title: string | null
  content: string
  mediaUrls: string[]
  platforms: SocialPlatform[]
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  scheduledAt: string | null
  publishedAt: string | null
  platformPostIds: Record<string, string>
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePostInput {
  businessKey: string
  title?: string
  content: string
  mediaUrls?: string[]
  platforms: SocialPlatform[]
  scheduledAt?: string | null
}
```

**Step 4: Create `src/lib/integrations/social/channels.ts`**

```typescript
import { encrypt, decrypt } from '@/lib/vault'
import { createServiceClient } from '@/lib/supabase/service'
import type { SocialChannel } from './types'

/** Store a token string as an encrypted JSON blob in social_channels column */
export function encodeToken(plaintext: string): string {
  return JSON.stringify(encrypt(plaintext))
}

/** Decode an encrypted JSON blob back to plaintext */
export function decodeToken(encoded: string): string {
  return decrypt(JSON.parse(encoded))
}

/** Load all connected social channels for a founder */
export async function getChannels(founderId: string, businessKey?: string): Promise<SocialChannel[]> {
  const supabase = createServiceClient()
  let query = supabase
    .from('social_channels')
    .select('*')
    .eq('founder_id', founderId)

  if (businessKey) {
    query = query.eq('business_key', businessKey)
  }

  const { data, error } = await query.order('platform')
  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id,
    founderId: row.founder_id,
    platform: row.platform,
    businessKey: row.business_key ?? '',
    channelId: row.channel_id,
    channelName: row.channel_name,
    handle: row.handle,
    name: row.name,
    followerCount: row.follower_count ?? 0,
    profileImageUrl: row.profile_image_url,
    isConnected: row.is_connected ?? false,
    tokenExpiresAt: row.token_expires_at,
    lastSyncedAt: row.last_synced_at,
  }))
}

/** Upsert a social channel after OAuth callback */
export async function upsertChannel(params: {
  founderId: string
  platform: string
  businessKey: string
  channelId: string
  channelName: string
  handle?: string
  accessToken: string
  refreshToken?: string | null
  expiresAt: number
  metadata?: Record<string, unknown>
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('social_channels').upsert(
    {
      founder_id: params.founderId,
      platform: params.platform,
      business_key: params.businessKey,
      channel_id: params.channelId,
      channel_name: params.channelName,
      handle: params.handle ?? null,
      access_token_encrypted: encodeToken(params.accessToken),
      refresh_token_encrypted: params.refreshToken ? encodeToken(params.refreshToken) : null,
      token_expires_at: new Date(params.expiresAt).toISOString(),
      is_connected: true,
      metadata: params.metadata ?? {},
    },
    { onConflict: 'founder_id,platform,channel_id' }
  )
}
```

**Step 5: Create `src/lib/integrations/social/index.ts`**

```typescript
export * from './types'
export * from './channels'
```

**Step 6: Update `src/lib/integrations/social.ts`** (replace content with re-export for backwards compat)

```typescript
// Backwards-compat re-export — new code imports from @/lib/integrations/social/
export * from './social/index'
```

**Step 7: Run tests to verify they pass**

```bash
cd C:/Unite-Group && pnpm vitest run src/lib/integrations/social/__tests__/channels.test.ts
```
Expected: 2 tests PASS.

**Step 8: Commit**

```bash
git add src/lib/integrations/social/ src/lib/integrations/social.ts
git commit -m "feat(social): add social types, channel DB helpers, and encryption utils"
```

---

### Task 2: Meta OAuth — Facebook + Instagram

**Files:**
- Create: `src/app/api/auth/meta/authorize/route.ts`
- Create: `src/app/api/auth/meta/callback/route.ts`
- Test: `src/app/api/auth/meta/__tests__/oauth.test.ts`

**Step 1: Write the failing test**

Create `src/app/api/auth/meta/__tests__/oauth.test.ts`:

```typescript
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
```

**Step 2: Run to verify it fails**

```bash
cd C:/Unite-Group && pnpm vitest run src/app/api/auth/meta/__tests__/oauth.test.ts
```
Expected: FAIL — module not found.

**Step 3: Create `src/app/api/auth/meta/authorize/route.ts`**

```typescript
// GET /api/auth/meta/authorize?business={key}
// Initiates Facebook Login OAuth — covers both Facebook Pages and Instagram Business
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
].join(',')

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const state = Buffer.from(JSON.stringify({ businessKey })).toString('base64url')

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: `${APP_URL}/api/auth/meta/callback`,
    response_type: 'code',
    scope: SCOPES,
    state,
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params}`
  )
}
```

**Step 4: Create `src/app/api/auth/meta/callback/route.ts`**

```typescript
// GET /api/auth/meta/callback?code=...&state=...
// Exchanges code for token, fetches FB pages + IG accounts, stores in social_channels
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${APP_URL}/founder/social?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${APP_URL}/founder/social?error=missing_params`)

  let businessKey = ''
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    businessKey = decoded.businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for short-lived user token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/meta/callback`,
      code,
    })
  )

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const { access_token: shortToken } = await tokenRes.json() as { access_token: string }

  // Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      fb_exchange_token: shortToken,
    })
  )

  if (!longRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const { access_token: longToken, expires_in } = await longRes.json() as {
    access_token: string
    expires_in: number
  }

  const expiresAt = Date.now() + (expires_in ?? 5_184_000) * 1000 // default 60 days

  // Fetch connected Facebook Pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}&fields=id,name,username,fan_count`
  )
  const { data: pages = [] } = pagesRes.ok ? await pagesRes.json() as { data: Array<{ id: string; name: string; username?: string; fan_count?: number }> } : { data: [] }

  // Store each Facebook Page
  for (const page of pages) {
    await upsertChannel({
      founderId: user.id,
      platform: 'facebook',
      businessKey,
      channelId: page.id,
      channelName: page.name,
      handle: page.username ?? null,
      accessToken: longToken,
      expiresAt,
      metadata: { followerCount: page.fan_count ?? 0 },
    })

    // Check for linked Instagram Business Account
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`
    )
    if (igRes.ok) {
      const igData = await igRes.json() as { instagram_business_account?: { id: string } }
      if (igData.instagram_business_account) {
        const igId = igData.instagram_business_account.id
        const igInfoRes = await fetch(
          `https://graph.facebook.com/v19.0/${igId}?fields=username,name,followers_count&access_token=${longToken}`
        )
        const igInfo = igInfoRes.ok ? await igInfoRes.json() as { username?: string; name?: string; followers_count?: number } : {}
        await upsertChannel({
          founderId: user.id,
          platform: 'instagram',
          businessKey,
          channelId: igId,
          channelName: igInfo.name ?? page.name,
          handle: igInfo.username ? `@${igInfo.username}` : null,
          accessToken: longToken,
          expiresAt,
          metadata: { pageId: page.id, followerCount: igInfo.followers_count ?? 0 },
        })
      }
    }
  }

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=meta&business=${businessKey}`)
}
```

**Step 5: Run tests**

```bash
cd C:/Unite-Group && pnpm vitest run src/app/api/auth/meta/__tests__/oauth.test.ts
```
Expected: 2 tests PASS.

**Step 6: Commit**

```bash
git add src/app/api/auth/meta/
git commit -m "feat(social): add Meta OAuth authorize + callback (Facebook + Instagram)"
```

---

### Task 3: LinkedIn OAuth

**Files:**
- Create: `src/app/api/auth/linkedin/authorize/route.ts`
- Create: `src/app/api/auth/linkedin/callback/route.ts`

**Step 1: Create `src/app/api/auth/linkedin/authorize/route.ts`**

```typescript
// GET /api/auth/linkedin/authorize?business={key}
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SCOPES = ['w_member_social', 'r_organization_social', 'rw_organization_admin'].join(' ')

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const state = Buffer.from(JSON.stringify({ businessKey })).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${APP_URL}/api/auth/linkedin/callback`,
    state,
    scope: SCOPES,
  })

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
}
```

**Step 2: Create `src/app/api/auth/linkedin/callback/route.ts`**

```typescript
// GET /api/auth/linkedin/callback?code=...&state=...
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${APP_URL}/founder/social?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${APP_URL}/founder/social?error=missing_params`)

  let businessKey = ''
  try {
    businessKey = JSON.parse(Buffer.from(state, 'base64url').toString()).businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${APP_URL}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    refresh_token_expires_in?: number
  }

  const expiresAt = Date.now() + tokens.expires_in * 1000

  // Fetch LinkedIn profile (member info)
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = profileRes.ok ? await profileRes.json() as { sub: string; name?: string; picture?: string } : { sub: 'unknown' }

  // Fetch organisation pages the user admins
  const orgsRes = await fetch(
    'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )

  const orgsData = orgsRes.ok
    ? await orgsRes.json() as { elements?: Array<{ 'organization~': { id: number; localizedName: string } }> }
    : { elements: [] }

  const orgs = orgsData.elements ?? []

  if (orgs.length > 0) {
    for (const org of orgs) {
      const orgInfo = org['organization~']
      await upsertChannel({
        founderId: user.id,
        platform: 'linkedin',
        businessKey,
        channelId: String(orgInfo.id),
        channelName: orgInfo.localizedName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
      })
    }
  } else {
    // No org pages — store personal profile as the channel
    await upsertChannel({
      founderId: user.id,
      platform: 'linkedin',
      businessKey,
      channelId: profile.sub,
      channelName: profile.name ?? 'LinkedIn Profile',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
    })
  }

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=linkedin&business=${businessKey}`)
}
```

**Step 3: Commit**

```bash
git add src/app/api/auth/linkedin/
git commit -m "feat(social): add LinkedIn OAuth authorize + callback"
```

---

### Task 4: TikTok OAuth

**Files:**
- Create: `src/app/api/auth/tiktok/authorize/route.ts`
- Create: `src/app/api/auth/tiktok/callback/route.ts`

**Step 1: Create `src/app/api/auth/tiktok/authorize/route.ts`**

```typescript
// GET /api/auth/tiktok/authorize?business={key}
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const csrfState = createHash('sha256').update(`${user.id}:${businessKey}:${Date.now()}`).digest('hex').slice(0, 16)
  const state = Buffer.from(JSON.stringify({ businessKey, csrfState })).toString('base64url')

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: 'user.info.basic,video.list,video.publish',
    response_type: 'code',
    redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    state,
  })

  return NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`)
}
```

**Step 2: Create `src/app/api/auth/tiktok/callback/route.ts`**

```typescript
// GET /api/auth/tiktok/callback?code=...&state=...
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${APP_URL}/founder/social?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${APP_URL}/founder/social?error=missing_params`)

  let businessKey = ''
  try {
    businessKey = JSON.parse(Buffer.from(state, 'base64url').toString()).businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for token
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const tokenData = await tokenRes.json() as {
    data?: {
      access_token: string
      refresh_token: string
      expires_in: number
      open_id: string
    }
    error?: { code: string; message: string }
  }

  if (!tokenData.data) return NextResponse.redirect(`${APP_URL}/founder/social?error=tiktok_token_error`)

  const { access_token, refresh_token, expires_in, open_id } = tokenData.data
  const expiresAt = Date.now() + expires_in * 1000

  // Fetch user info
  const infoRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count',
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  const infoData = infoRes.ok
    ? await infoRes.json() as { data?: { user?: { display_name?: string; username?: string; follower_count?: number } } }
    : { data: undefined }
  const userInfo = infoData.data?.user ?? {}

  await upsertChannel({
    founderId: user.id,
    platform: 'tiktok',
    businessKey,
    channelId: open_id,
    channelName: userInfo.display_name ?? 'TikTok Account',
    handle: userInfo.username ? `@${userInfo.username}` : null,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt,
    metadata: { followerCount: userInfo.follower_count ?? 0 },
  })

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=tiktok&business=${businessKey}`)
}
```

**Step 3: Commit**

```bash
git add src/app/api/auth/tiktok/
git commit -m "feat(social): add TikTok OAuth authorize + callback"
```

---

### Task 5: YouTube OAuth

YouTube uses Google's OAuth but separate routes so tokens go to `social_channels` (not `credentials_vault`).

**Files:**
- Create: `src/app/api/auth/youtube/authorize/route.ts`
- Create: `src/app/api/auth/youtube/callback/route.ts`

**Step 1: Create `src/app/api/auth/youtube/authorize/route.ts`**

```typescript
// GET /api/auth/youtube/authorize?business={key}
// Uses GOOGLE_CLIENT_ID/SECRET — stores in social_channels (not credentials_vault)
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtubepartner-channel-audit',
].join(' ')

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const state = Buffer.from(JSON.stringify({ businessKey })).toString('base64url')

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${APP_URL}/api/auth/youtube/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
```

**Step 2: Create `src/app/api/auth/youtube/callback/route.ts`**

```typescript
// GET /api/auth/youtube/callback?code=...&state=...
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${APP_URL}/founder/social?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${APP_URL}/founder/social?error=missing_params`)

  let businessKey = ''
  try {
    businessKey = JSON.parse(Buffer.from(state, 'base64url').toString()).businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/youtube/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const expiresAt = Date.now() + tokens.expires_in * 1000

  // Fetch YouTube channel info
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const channelData = channelRes.ok
    ? await channelRes.json() as { items?: Array<{ id: string; snippet: { title: string; customUrl?: string }; statistics?: { subscriberCount?: string } }> }
    : { items: [] }

  const channel = channelData.items?.[0]
  if (!channel) return NextResponse.redirect(`${APP_URL}/founder/social?error=no_youtube_channel`)

  await upsertChannel({
    founderId: user.id,
    platform: 'youtube',
    businessKey,
    channelId: channel.id,
    channelName: channel.snippet.title,
    handle: channel.snippet.customUrl ?? null,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt,
    metadata: { subscriberCount: parseInt(channel.statistics?.subscriberCount ?? '0', 10) },
  })

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=youtube&business=${businessKey}`)
}
```

**Step 3: Commit**

```bash
git add src/app/api/auth/youtube/
git commit -m "feat(social): add YouTube OAuth authorize + callback"
```

---

### Task 6: Social Channels API route

**Files:**
- Create: `src/app/api/social/channels/route.ts`
- Delete: `src/app/api/social/[platform]/connect/route.ts` (replaced by per-platform OAuth routes above)

**Step 1: Create `src/app/api/social/channels/route.ts`**

```typescript
// GET /api/social/channels?business={key}
// Returns connected social channels for the authenticated founder
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getChannels } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? undefined

  try {
    const channels = await getChannels(user.id, businessKey)
    return NextResponse.json({ channels })
  } catch (err) {
    console.error('[social/channels] GET error:', err)
    return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 })
  }
}
```

**Step 2: Write test**

Create `src/app/api/social/channels/__tests__/route.test.ts`:

```typescript
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
```

**Step 3: Run tests**

```bash
cd C:/Unite-Group && pnpm vitest run src/app/api/social/channels/__tests__/route.test.ts
```
Expected: PASS.

**Step 4: Commit**

```bash
git add src/app/api/social/channels/ && git rm src/app/api/social/\[platform\]/connect/route.ts
git commit -m "feat(social): add channels API route; remove platform connect stub"
```

---

### Task 7: Social Posts API

**Files:**
- Create: `src/app/api/social/posts/route.ts`
- Create: `src/app/api/social/posts/[id]/route.ts`

**Step 1: Create `src/app/api/social/posts/route.ts`**

```typescript
// GET  /api/social/posts?business={key}&status={status}
// POST /api/social/posts — create draft or scheduled post
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { CreatePostInput } from '@/lib/integrations/social/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  const status = searchParams.get('status')

  const supabase = createServiceClient()
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (businessKey) query = query.eq('business_key', businessKey)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })

  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: CreatePostInput
  try {
    body = await request.json() as CreatePostInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 })
  if (!body.businessKey) return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  if (!body.platforms?.length) return NextResponse.json({ error: 'at least one platform required' }, { status: 400 })

  const status = body.scheduledAt ? 'scheduled' : 'draft'

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      founder_id: user.id,
      business_key: body.businessKey,
      title: body.title ?? null,
      content: body.content,
      media_urls: body.mediaUrls ?? [],
      platforms: body.platforms,
      status,
      scheduled_at: body.scheduledAt ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })

  return NextResponse.json({ post: data }, { status: 201 })
}
```

**Step 2: Create `src/app/api/social/posts/[id]/route.ts`**

```typescript
// PATCH /api/social/posts/[id] — update post
// DELETE /api/social/posts/[id] — delete draft
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Whitelist updatable fields
  const allowed = ['title', 'content', 'media_urls', 'platforms', 'scheduled_at', 'status']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('social_posts')
    .update(update)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  return NextResponse.json({ post: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // Only allow deleting drafts (not scheduled/published)
  const { data: post } = await supabase
    .from('social_posts')
    .select('status')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft posts can be deleted' }, { status: 400 })
  }

  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

**Step 3: Write and run test**

Create `src/app/api/social/posts/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) })
const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: '1', status: 'draft' }, error: null }) }) })

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: mockSelect, insert: mockInsert, upsert: mockUpsert })),
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
```

```bash
cd C:/Unite-Group && pnpm vitest run src/app/api/social/posts/__tests__/route.test.ts
```
Expected: PASS.

**Step 4: Commit**

```bash
git add src/app/api/social/posts/
git commit -m "feat(social): add social posts CRUD API routes"
```

---

### Task 8: Publish API

**Files:**
- Create: `src/app/api/social/publish/[id]/route.ts`

```typescript
// POST /api/social/publish/[id]
// Publishes a scheduled or draft post to all target platforms
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { decodeToken } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // Load post
  const { data: post, error: postErr } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (postErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (!['draft', 'scheduled'].includes(post.status)) {
    return NextResponse.json({ error: 'Post is not in a publishable state' }, { status: 400 })
  }

  // Mark as publishing
  await supabase.from('social_posts').update({ status: 'publishing' }).eq('id', id)

  const platformPostIds: Record<string, string> = {}
  const errors: string[] = []

  for (const platform of post.platforms as string[]) {
    // Load token for this platform + business
    const { data: channel } = await supabase
      .from('social_channels')
      .select('access_token_encrypted, channel_id, metadata')
      .eq('founder_id', user.id)
      .eq('platform', platform)
      .eq('business_key', post.business_key)
      .eq('is_connected', true)
      .maybeSingle()

    if (!channel) {
      errors.push(`${platform}: no connected account`)
      continue
    }

    let accessToken: string
    try {
      accessToken = decodeToken(channel.access_token_encrypted)
    } catch {
      errors.push(`${platform}: token decrypt failed`)
      continue
    }

    try {
      const postId = await publishToplatform(platform, accessToken, channel, post)
      platformPostIds[platform] = postId
    } catch (err) {
      errors.push(`${platform}: ${err instanceof Error ? err.message : 'publish failed'}`)
    }
  }

  const allFailed = errors.length === post.platforms.length
  const status = allFailed ? 'failed' : 'published'

  await supabase.from('social_posts').update({
    status,
    published_at: allFailed ? null : new Date().toISOString(),
    platform_post_ids: { ...(post.platform_post_ids ?? {}), ...platformPostIds },
    error_message: errors.length ? errors.join('; ') : null,
  }).eq('id', id)

  return NextResponse.json({
    status,
    platformPostIds,
    errors: errors.length ? errors : undefined,
  })
}

async function publishToplatform(
  platform: string,
  accessToken: string,
  channel: { channel_id: string; metadata?: Record<string, unknown> },
  post: { content: string; media_urls: string[] }
): Promise<string> {
  switch (platform) {
    case 'facebook': {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${channel.channel_id}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: post.content, access_token: accessToken }),
        }
      )
      const data = await res.json() as { id?: string; error?: { message: string } }
      if (!res.ok || !data.id) throw new Error(data.error?.message ?? 'Facebook post failed')
      return data.id
    }

    case 'instagram': {
      const pageId = (channel.metadata as Record<string, string> | undefined)?.pageId
      if (!pageId) throw new Error('No linked Facebook Page ID for Instagram')
      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${channel.channel_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caption: post.content,
            image_url: post.media_urls[0] ?? undefined,
            media_type: 'IMAGE',
            access_token: accessToken,
          }),
        }
      )
      const container = await containerRes.json() as { id?: string; error?: { message: string } }
      if (!containerRes.ok || !container.id) throw new Error(container.error?.message ?? 'IG container failed')
      // Step 2: Publish container
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${channel.channel_id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
        }
      )
      const published = await publishRes.json() as { id?: string; error?: { message: string } }
      if (!publishRes.ok || !published.id) throw new Error(published.error?.message ?? 'IG publish failed')
      return published.id
    }

    case 'linkedin': {
      const body = {
        author: `urn:li:person:${channel.channel_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { id?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? 'LinkedIn post failed')
      return data.id ?? 'ok'
    }

    case 'youtube':
      // YouTube video uploads require multipart upload — not supported for text-only posts
      throw new Error('YouTube requires video content — text-only posts not supported')

    case 'tiktok':
      // TikTok requires video content
      throw new Error('TikTok requires video content')

    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}
```

**Commit:**

```bash
git add src/app/api/social/publish/
git commit -m "feat(social): add publish API — cross-posts to FB, IG, LinkedIn"
```

---

### Task 9: Social page UI rewrite

Replace the stub page with a full server component + tabbed client layout.

**Files:**
- Modify: `src/app/(founder)/founder/social/page.tsx`
- Create: `src/components/founder/social/SocialPageClient.tsx`
- Create: `src/components/founder/social/ConnectionStrip.tsx`
- Create: `src/components/founder/social/PostsList.tsx`
- Create: `src/components/founder/social/CalendarView.tsx`
- Create: `src/components/founder/social/PostComposer.tsx`

**Step 1: Rewrite `src/app/(founder)/founder/social/page.tsx`**

```typescript
// src/app/(founder)/founder/social/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChannels } from '@/lib/integrations/social/channels'
import { createServiceClient } from '@/lib/supabase/service'
import { SocialPageClient } from '@/components/founder/social/SocialPageClient'
import type { SocialPost } from '@/lib/integrations/social/types'

export default async function SocialPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = createServiceClient()
  const [channels, { data: posts }] = await Promise.all([
    getChannels(user.id),
    supabase
      .from('social_posts')
      .select('*')
      .eq('founder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <SocialPageClient
      channels={channels}
      posts={(posts ?? []) as SocialPost[]}
    />
  )
}
```

**Step 2: Create `src/components/founder/social/SocialPageClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { ConnectionStrip } from './ConnectionStrip'
import { PostsList } from './PostsList'
import { CalendarView } from './CalendarView'
import { PostComposer } from './PostComposer'
import type { SocialChannel, SocialPost } from '@/lib/integrations/social/types'

const TABS = ['Calendar', 'Posts', 'Analytics'] as const
type Tab = typeof TABS[number]

interface Props {
  channels: SocialChannel[]
  posts: SocialPost[]
}

export function SocialPageClient({ channels, posts }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Posts')
  const [composerOpen, setComposerOpen] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-light text-white/90">Social</h1>
          <p className="text-sm text-white/40 mt-1">Content calendar across all platforms</p>
        </div>
        <button
          onClick={() => setComposerOpen(true)}
          className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
        >
          + New Post
        </button>
      </div>

      <ConnectionStrip channels={channels} />

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-white/[0.08]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              activeTab === tab
                ? 'text-[#00F5FF] border-b border-[#00F5FF] -mb-px'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Calendar' && <CalendarView posts={posts} />}
      {activeTab === 'Posts' && <PostsList posts={posts} />}
      {activeTab === 'Analytics' && (
        <div className="text-sm text-white/40 py-8 text-center">
          Analytics coming soon — connect accounts to see engagement data
        </div>
      )}

      {composerOpen && (
        <PostComposer
          channels={channels}
          onClose={() => setComposerOpen(false)}
          onCreated={() => { setComposerOpen(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
```

**Step 3: Create `src/components/founder/social/ConnectionStrip.tsx`**

```typescript
'use client'

import type { SocialChannel, SocialPlatform } from '@/lib/integrations/social/types'

const PLATFORM_META: Record<SocialPlatform, { label: string; colour: string; icon: string }> = {
  facebook:  { label: 'Facebook',  colour: '#1877F2', icon: 'f' },
  instagram: { label: 'Instagram', colour: '#E1306C', icon: '◈' },
  linkedin:  { label: 'LinkedIn',  colour: '#0A66C2', icon: 'in' },
  tiktok:    { label: 'TikTok',    colour: '#FE2C55', icon: '♪' },
  youtube:   { label: 'YouTube',   colour: '#FF0000', icon: '▶' },
}

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube']

interface Props {
  channels: SocialChannel[]
}

export function ConnectionStrip({ channels }: Props) {
  const connectedPlatforms = new Set(
    channels.filter(c => c.isConnected).map(c => c.platform)
  )

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_PLATFORMS.map(platform => {
        const meta = PLATFORM_META[platform]
        const connected = connectedPlatforms.has(platform)

        return connected ? (
          <div
            key={platform}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px]"
            style={{ backgroundColor: `${meta.colour}15`, border: `1px solid ${meta.colour}40` }}
          >
            <span style={{ color: meta.colour }}>{meta.icon}</span>
            <span style={{ color: meta.colour }}>{meta.label}</span>
          </div>
        ) : (
          <a
            key={platform}
            href={`/api/auth/${platform === 'facebook' || platform === 'instagram' ? 'meta' : platform}/authorize?business=dr`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] border border-white/10 text-white/30 hover:border-white/20 hover:text-white/50 transition-colors"
          >
            <span>{meta.icon}</span>
            <span>Connect {meta.label}</span>
          </a>
        )
      })}
    </div>
  )
}
```

**Step 4: Create `src/components/founder/social/PostsList.tsx`**

```typescript
'use client'

import type { SocialPost, SocialPlatform } from '@/lib/integrations/social/types'

const STATUS_COLOURS: Record<string, string> = {
  draft: 'text-white/40 border-white/20',
  scheduled: 'text-[#00F5FF] border-[#00F5FF]/30',
  publishing: 'text-yellow-400 border-yellow-400/30',
  published: 'text-green-400 border-green-400/30',
  failed: 'text-red-400 border-red-400/30',
}

const PLATFORM_COLOURS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  tiktok: '#FE2C55',
  youtube: '#FF0000',
}

interface Props {
  posts: SocialPost[]
}

export function PostsList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="text-sm text-white/40 py-12 text-center">
        No posts yet — click <span className="text-[#00F5FF]">+ New Post</span> to get started
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div
          key={post.id}
          className="border border-white/[0.08] p-4 rounded-sm hover:border-white/[0.14] transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 line-clamp-2">{post.content}</p>
              {post.scheduledAt && (
                <p className="text-[11px] text-white/40 mt-1">
                  Scheduled: {new Date(post.scheduledAt).toLocaleString('en-AU')}
                </p>
              )}
              {post.errorMessage && (
                <p className="text-[11px] text-red-400/70 mt-1">{post.errorMessage}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1">
                {(post.platforms as SocialPlatform[]).map(p => (
                  <span
                    key={p}
                    className="w-4 h-4 rounded-sm text-[8px] flex items-center justify-center"
                    style={{ backgroundColor: `${PLATFORM_COLOURS[p]}20`, color: PLATFORM_COLOURS[p] }}
                  >
                    {p[0].toUpperCase()}
                  </span>
                ))}
              </div>
              <span className={`text-[9px] uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ${STATUS_COLOURS[post.status] ?? ''}`}>
                {post.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 5: Create `src/components/founder/social/CalendarView.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { SocialPost, SocialPlatform } from '@/lib/integrations/social/types'

const PLATFORM_COLOURS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  tiktok: '#FE2C55',
  youtube: '#FF0000',
}

interface Props {
  posts: SocialPost[]
}

export function CalendarView({ posts }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const monthLabel = new Date(year, month).toLocaleString('en-AU', { month: 'long', year: 'numeric' })

  const postsByDay: Record<number, SocialPost[]> = {}
  for (const post of posts) {
    const date = post.scheduledAt ? new Date(post.scheduledAt) : post.publishedAt ? new Date(post.publishedAt) : null
    if (!date) continue
    if (date.getFullYear() === year && date.getMonth() === month) {
      const d = date.getDate()
      postsByDay[d] = postsByDay[d] ?? []
      postsByDay[d].push(post)
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">{monthLabel}</span>
        <div className="flex gap-2">
          <button
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="px-2 py-1 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-sm"
          >←</button>
          <button
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="px-2 py-1 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-sm"
          >→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-[9px] uppercase tracking-wider text-white/30 text-center py-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`min-h-[64px] p-1 border border-white/[0.06] rounded-sm ${
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                ? 'border-[#00F5FF]/30'
                : ''
            }`}
          >
            {day && (
              <>
                <span className="text-[10px] text-white/30">{day}</span>
                <div className="mt-1 space-y-0.5">
                  {(postsByDay[day] ?? []).slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className="text-[8px] px-1 py-0.5 rounded-sm truncate"
                      style={{
                        backgroundColor: `${PLATFORM_COLOURS[(post.platforms as SocialPlatform[])[0]]}20`,
                        color: PLATFORM_COLOURS[(post.platforms as SocialPlatform[])[0]],
                      }}
                      title={post.content}
                    >
                      {post.content.slice(0, 20)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 6: Create `src/components/founder/social/PostComposer.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { SocialChannel, SocialPlatform, CreatePostInput } from '@/lib/integrations/social/types'
import { BUSINESSES } from '@/lib/businesses'

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

interface Props {
  channels: SocialChannel[]
  onClose: () => void
  onCreated: () => void
}

export function PostComposer({ channels, onClose, onCreated }: Props) {
  const connectedPlatforms = [...new Set(channels.filter(c => c.isConnected).map(c => c.platform))] as SocialPlatform[]

  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(connectedPlatforms)
  const [businessKey, setBusinessKey] = useState(BUSINESSES[0].key)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleSubmit(action: 'draft' | 'schedule' | 'publish') {
    if (!content.trim()) { setError('Content is required'); return }
    if (!selectedPlatforms.length) { setError('Select at least one platform'); return }
    if (action === 'schedule' && !scheduledAt) { setError('Schedule date/time required'); return }

    setSaving(true)
    setError('')

    const body: CreatePostInput = {
      businessKey,
      content: content.trim(),
      platforms: selectedPlatforms,
      scheduledAt: action === 'schedule' ? new Date(scheduledAt).toISOString() : null,
    }

    const res = await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const j = await res.json() as { error?: string }
      setError(j.error ?? 'Failed to save post')
      setSaving(false)
      return
    }

    if (action === 'publish') {
      const { post } = await res.json() as { post: { id: string } }
      await fetch(`/api/social/publish/${post.id}`, { method: 'POST' })
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0A0A0A] border border-white/[0.12] rounded-sm w-full max-w-lg p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-light text-white/80">New Post</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">×</button>
        </div>

        {/* Business selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Business</label>
          <select
            value={businessKey}
            onChange={e => setBusinessKey(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#00F5FF]/30"
          >
            {BUSINESSES.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="What do you want to share?"
            className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#00F5FF]/30 resize-none"
          />
          <p className="text-[10px] text-white/20 mt-1">{content.length} chars</p>
        </div>

        {/* Platform selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.length === 0 ? (
              <p className="text-[11px] text-white/30">No platforms connected yet</p>
            ) : connectedPlatforms.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 text-[10px] rounded-sm border transition-colors ${
                  selectedPlatforms.includes(p)
                    ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-[#00F5FF]/5'
                    : 'border-white/10 text-white/40'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#00F5FF]/30"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/50 border border-white/10 rounded-sm hover:border-white/20 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          {scheduledAt ? (
            <button
              onClick={() => handleSubmit('schedule')}
              disabled={saving}
              className="px-4 py-2 text-[10px] uppercase tracking-wider text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-50"
            >
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          ) : (
            <button
              onClick={() => handleSubmit('publish')}
              disabled={saving || connectedPlatforms.length === 0}
              className="px-4 py-2 text-[10px] uppercase tracking-wider text-[#050505] bg-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Post Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 7: Run type-check and lint**

```bash
cd C:/Unite-Group && pnpm run type-check && pnpm run lint
```
Expected: No errors.

**Step 8: Commit**

```bash
git add src/app/(founder)/founder/social/ src/components/founder/social/
git commit -m "feat(social): rewrite social page — connection strip, calendar, posts list, composer"
```

---

### Task 10: Update sidebar nav + env.example

Add Social to the sidebar navigation. Update `.env.example` with new vars.

**Files:**
- Modify: `src/components/layout/SidebarNav.tsx` — add Social item
- Modify: `.env.example`

**Step 1: Add Social to sidebar**

Read `src/components/layout/SidebarNav.tsx` first to find the NAV_ITEMS array. Add after Kanban:

```typescript
{ href: '/founder/social', label: 'Social', icon: Share2 },
```

Import `Share2` from `lucide-react` at the top of the file.

**Step 2: Update `.env.example`**

Add these lines to `.env.example` under a `# Social Platforms` comment:

```bash
# Social Platforms
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
# YouTube uses existing GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
```

**Step 3: Run full checks**

```bash
cd C:/Unite-Group && pnpm run type-check && pnpm run lint && pnpm vitest run
```
Expected: type-check + lint pass. Pre-existing test failures (businesses.test.ts, bookkeeper/orchestrator.test.ts — 7 tests) are unrelated to this feature.

**Step 4: Commit**

```bash
git add src/components/layout/SidebarNav.tsx .env.example
git commit -m "feat(social): add Social to sidebar nav; update env.example with platform vars"
```

---

### Task 11: E2E smoke test

**Files:**
- Create: `e2e/social.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Social page', () => {
  test('loads without error and shows platform connect buttons', async ({ page }) => {
    // Skip auth — page should redirect to login if not authenticated
    await page.goto('/founder/social')
    // Either shows the page or redirects to login
    const url = page.url()
    expect(url).toMatch(/founder\/social|auth\/login/)
  })
})
```

**Run:**
```bash
cd C:/Unite-Group && pnpm playwright test e2e/social.spec.ts --headed
```

**Commit:**
```bash
git add e2e/social.spec.ts
git commit -m "test(e2e): add social page smoke test"
```

---

## Summary

| Task | Files | Status |
|------|-------|--------|
| 1 | Social types + DB helpers | — |
| 2 | Meta OAuth (FB + IG) | — |
| 3 | LinkedIn OAuth | — |
| 4 | TikTok OAuth | — |
| 5 | YouTube OAuth | — |
| 6 | Channels API route | — |
| 7 | Posts CRUD API | — |
| 8 | Publish API | — |
| 9 | Social page UI rewrite | — |
| 10 | Sidebar + env.example | — |
| 11 | E2E smoke test | — |

**Developer App Setup Required (before testing OAuth flows):**
- Meta: [developers.facebook.com](https://developers.facebook.com) — create app, add Facebook Login + Instagram Graph API products, add `{APP_URL}/api/auth/meta/callback` as redirect URI
- LinkedIn: [linkedin.com/developers](https://www.linkedin.com/developers) — create app, request `w_member_social` scope, add `{APP_URL}/api/auth/linkedin/callback`
- TikTok: [developers.tiktok.com](https://developers.tiktok.com) — create app, add `{APP_URL}/api/auth/tiktok/callback`
- YouTube: Uses existing Google Cloud project — add YouTube Data API v3, add `{APP_URL}/api/auth/youtube/callback` as authorised redirect URI
