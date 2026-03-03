# OAuth Flow

> OAuth 2.0 and OIDC integration patterns with PKCE, provider configuration, and session management for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `oauth-flow`                                             |
| **Category**   | Authentication & Security                                |
| **Complexity** | High                                                     |
| **Complements**| `api-client`, `rbac-patterns`, `secret-management`       |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies OAuth 2.0 and OpenID Connect patterns for NodeJS-Starter-V1: authorisation code flow with PKCE, provider configuration for Google and GitHub, Supabase Auth integration, session management, token refresh, account linking, and security best practices for redirect URI validation.

---

## When to Apply

### Positive Triggers

- Adding social login (Google, GitHub) to the application
- Implementing OAuth 2.0 authorisation code flow with PKCE
- Configuring Supabase Auth with external providers
- Managing OAuth tokens, refresh, and session lifecycle
- Linking multiple OAuth providers to a single user account

### Negative Triggers

- JWT creation and validation for internal auth (use existing `auth/jwt.py`)
- Role-based access control (use `rbac-patterns` skill)
- API key management and rotation (use `secret-management` skill)
- CSRF protection for form submissions (use `csrf-protection` skill)

---

## Core Principles

### The Three Laws of OAuth

1. **PKCE Always**: Every authorisation code flow must use PKCE (Proof Key for Code Exchange). The implicit flow is deprecated — never use it.
2. **Validate Redirect URIs**: Redirect URIs must be whitelisted and validated on every request. Open redirects are a critical vulnerability.
3. **Tokens Are Secrets**: Access and refresh tokens must never appear in URLs, logs, or client-side storage. Use httpOnly cookies or server-side session storage.

---

## Pattern 1: Supabase Auth Provider Configuration

### Google and GitHub Setup

```typescript
// apps/web/lib/supabase/auth-config.ts

export const oauthProviders = [
  {
    provider: "google" as const,
    label: "Google",
    scopes: "openid email profile",
    queryParams: {
      access_type: "offline",     // Request refresh token
      prompt: "consent",          // Force consent screen
    },
  },
  {
    provider: "github" as const,
    label: "GitHub",
    scopes: "read:user user:email",
  },
] as const;

export type OAuthProvider = (typeof oauthProviders)[number]["provider"];
```

**Project Reference**: `apps/web/components/auth/oauth-providers.tsx` — the existing component renders Google and GitHub buttons. `apps/web/app/auth/callback/route.ts` — the callback handler exchanges the authorisation code for a Supabase session.

---

## Pattern 2: Authorisation Code Flow with PKCE

### Initiating the Flow

```typescript
import { createClient } from "@/lib/supabase/client";

async function signInWithProvider(
  provider: OAuthProvider,
  redirectTo?: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback${
        redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
      }`,
      queryParams: provider === "google"
        ? { access_type: "offline", prompt: "consent" }
        : undefined,
    },
  });

  if (error) {
    throw new Error(`OAuth sign-in failed: ${error.message}`);
  }
}
```

### Callback Handler

```typescript
// apps/web/app/auth/callback/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  if (error) {
    const description = searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(description)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No authorisation code")}`,
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
```

**Rule**: The `code` parameter is single-use. If the exchange fails, redirect to login with the error — never retry code exchange.

---

## Pattern 3: Token Management

### Secure Token Storage and Refresh

```typescript
import { createClient } from "@/lib/supabase/client";

export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  // Check if token needs refresh (within 60 seconds of expiry)
  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt - now < 60) {
    const { data: { session: refreshed } } =
      await supabase.auth.refreshSession();
    return refreshed;
  }

  return session;
}

// Auth state listener
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );
  return subscription;
}
```

**Rule**: Never store tokens in localStorage. Supabase client handles storage via httpOnly cookies when configured with the server-side client.

---

## Pattern 4: Account Linking

### Multiple Providers per User

```typescript
async function linkProvider(provider: OAuthProvider): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    },
  });

  if (error) {
    throw new Error(`Account linking failed: ${error.message}`);
  }
}

async function unlinkProvider(identityId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.unlinkIdentity({
    id: identityId,
    // Prevent unlinking the last identity
  });

  if (error) {
    throw new Error(`Unlink failed: ${error.message}`);
  }
}

async function getLinkedProviders(): Promise<string[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.identities) return [];
  return user.identities.map((i) => i.provider);
}
```

---

## Pattern 5: Backend Token Validation (FastAPI)

### Verifying Supabase JWT on API Requests

```python
from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError


SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET


async def get_current_user_from_oauth(request: Request):
    """Validate Supabase JWT from the Authorization header."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = auth_header.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token claims")

    # Fetch or create user in local database
    user = await get_or_create_user(user_id, payload)
    return user
```

**Complements**: `rbac-patterns` skill — after extracting the user from the JWT, apply permission checks via `require_permission()`.

---

## Pattern 6: Redirect URI Security

### Whitelist Validation

```typescript
const ALLOWED_REDIRECT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : "",
].filter(Boolean));

function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return ALLOWED_REDIRECT_HOSTS.has(url.hostname);
  } catch {
    // Relative paths are allowed
    return uri.startsWith("/") && !uri.startsWith("//");
  }
}
```

**Rule**: Always validate the `next` or `redirectTo` parameter against the whitelist. Open redirect attacks use OAuth callbacks to phish users.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Implicit flow (no PKCE) | Token exposed in URL fragment | Authorisation code + PKCE |
| Tokens in localStorage | XSS can steal tokens | httpOnly cookies via Supabase |
| No redirect URI validation | Open redirect vulnerability | Whitelist allowed hosts |
| Retry failed code exchange | Code is single-use, replay attack risk | Redirect to login on failure |
| Hardcoded client secrets in frontend | Secret exposed in bundle | Server-side only, env variables |
| No account linking | Users create duplicate accounts | Support multiple providers per user |

---

## Checklist

Before merging oauth-flow changes:

- [ ] Authorisation code flow with PKCE (no implicit flow)
- [ ] Supabase Auth configured for Google and GitHub providers
- [ ] Callback handler with error handling and redirect validation
- [ ] Token refresh within 60 seconds of expiry
- [ ] Account linking for multiple providers per user
- [ ] Backend JWT validation with `jose` or equivalent
- [ ] Redirect URI whitelist validation
- [ ] No tokens in localStorage, URLs, or logs

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### OAuth Flow Implementation

**Flow**: [authorisation code + PKCE / device code]
**Providers**: [Google, GitHub / custom]
**Auth Library**: [Supabase Auth / NextAuth / custom]
**Token Storage**: [httpOnly cookies / server session]
**Account Linking**: [enabled / disabled]
**Redirect Validation**: [whitelist / regex / none]
```
