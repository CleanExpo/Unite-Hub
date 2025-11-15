# Supabase PKCE Flow Configuration Required

## Current Issue

After testing with Playwright, I discovered that **Supabase is still using implicit flow** even after changing the redirect URL to `/auth/callback`.

**Evidence from test:**
```
URL: /login?error=no_code#access_token=eyJ...&refresh_token=...
```

- The `/auth/callback` route is looking for `?code=` parameter (PKCE flow)
- Supabase is sending `#access_token=...` (implicit flow)
- The callback returns `error=no_code` because no code parameter exists

## Root Cause

Supabase projects have a setting that controls which OAuth flow is used:
- **Implicit flow** (default): Returns tokens in URL hash `#access_token=...`
- **PKCE flow** (recommended): Returns authorization code in query `?code=...`

## Required Configuration

### Option 1: Enable PKCE Flow in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/lksfwktwtmyznckodsau
2. Navigate to **Authentication** → **Settings**
3. Look for **"Enable PKCE flow"** or **"Flow Type"** setting
4. Enable PKCE / Disable Implicit Grant

### Option 2: Force PKCE Flow in Code

If Supabase doesn't have a dashboard toggle, we can force PKCE flow programmatically:

```typescript
// In AuthContext.tsx
const signInWithGoogle = async () => {
  const { data, error} = await supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: false,
      scopes: 'email profile',
      // Force PKCE flow
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    },
  });
  //...
};
```

### Option 3: Hybrid Approach (Handle Both Flows)

Update the `/auth/callback` route to handle both implicit flow (hash) and PKCE flow (code):

```typescript
export async function GET(request: NextRequest) {
  const { searchParams, origin, hash } = new URL(request.url)
  const code = searchParams.get('code')

  // Check if we have a code parameter (PKCE flow)
  if (code) {
    // Handle PKCE flow
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard/overview`)
    }
  }

  // If no code, check for hash params (implicit flow)
  // Redirect to a client-side page that can read hash params
  return NextResponse.redirect(`${origin}/auth/implicit-callback`)
}
```

## Recommended Solution

**Use Option 1** if available in Supabase Dashboard - this is the official way.

If not available, **use Option 3** (hybrid approach) to handle both flows gracefully.

## Why PKCE is Better

- **More secure**: Authorization code can only be exchanged once, server-side
- **Server-side session**: Cookies are HTTP-only and secure
- **Middleware compatible**: Server can verify sessions with `getClaims()`
- **No localStorage**: Eliminates client-side token storage vulnerabilities

## Current Workaround

Until PKCE is enabled, we need to either:
1. Revert to implicit flow handling (client-side redirects)
2. Implement hybrid callback handler
3. Contact Supabase support to enable PKCE for the project

## Testing After Fix

Once PKCE is enabled, the OAuth flow should be:
1. User clicks "Continue with Google"
2. Google authenticates user
3. Redirects to `/auth/callback?code=xxx` (query param, not hash)
4. Callback exchanges code for session server-side
5. Sets HTTP-only cookies
6. Redirects to `/dashboard/overview`
7. Middleware detects session via `getClaims()`
8. User stays on dashboard ✅
