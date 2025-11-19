# Phase 2 – Client Authentication Implementation Guide

**Created**: 2025-11-19
**Status**: 📋 Implementation Required
**Priority**: P1 (Required for Client Portal Launch)
**Estimated Time**: 4-6 hours

---

## Overview

This document defines the complete client authentication implementation for Unite-Hub's client portal. Client authentication enables secure access to `/client/*` routes with session management, row-level security (RLS), and proper authorization checks.

---

## Current Status

### ✅ What's Already Implemented

- ✅ `client_users` table exists (from migration 048)
- ✅ Client portal pages created (`/client/*`)
- ✅ Client layout with header navigation
- ✅ `withClientAuth` middleware scaffolded
- ✅ Client API routes protected (placeholder)

### ⚠️ What's Missing (TO BE IMPLEMENTED)

- ❌ `getClientSession()` function (placeholder returns null)
- ❌ Client login page (`/client/login`)
- ❌ Client registration page (`/client/register`)
- ❌ Session verification with `client_users` table
- ❌ Client-specific RLS policies enabled
- ❌ Client session management (login/logout)

---

## Architecture

### Authentication Flow

```
1. Client visits /client/* route
   ↓
2. Client layout calls getClientSession()
   ↓
3. If no session → Redirect to /client/login
   ↓
4. Client enters email/password
   ↓
5. POST /api/auth/client-login
   ↓
6. Verify credentials with Supabase Auth
   ↓
7. Verify user exists in client_users table
   ↓
8. Check active = true and subscription_tier != null
   ↓
9. Create session with Supabase Auth
   ↓
10. Redirect to /client (authenticated)
```

---

## Implementation Steps

### Step 1: Implement `getClientSession()` Function

**File**: `src/lib/auth/supabase.ts`

**Add after `getStaffSession()`**:

```typescript
/**
 * Get client session (for client portal)
 * Verifies session and client_users table
 */
export async function getClientSession() {
  const supabase = createClient();

  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return null;
  }

  // Verify user exists in client_users table
  const { data: client, error: clientError } = await supabase
    .from('client_users')
    .select('id, name, email, subscription_tier, active')
    .eq('id', session.user.id)
    .single();

  if (clientError || !client) {
    console.error('Client not found in client_users table:', clientError);
    return null;
  }

  // Check if client is active
  if (!client.active) {
    console.warn('Inactive client attempted access:', client.email);
    return null;
  }

  return {
    ...session,
    client,
  };
}

/**
 * Require client authentication (for API routes)
 */
export async function requireClientAuth() {
  const session = await getClientSession();

  if (!session) {
    throw new Error('Unauthorized: Client session required');
  }

  return session;
}
```

---

### Step 2: Update Client Layout

**File**: `src/app/(client)/client/layout.tsx`

**Replace placeholder `getClientSession()` with**:

```typescript
import { redirect } from 'next/navigation';
import { getClientSession } from '@/lib/auth/supabase';

export default async function ClientLayout({ children }: ClientLayoutProps) {
  // Real client session check (ENABLED)
  const session = await getClientSession();

  if (!session) {
    redirect('/client/login'); // Redirect unauthenticated users
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* ... existing layout code ... */}

      {/* Update user info display */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-100">
            {session.client.name || session.user.email}
          </p>
          <p className="text-xs text-gray-400">
            {session.client.subscription_tier || 'Free'}
          </p>
        </div>
        <button
          className="text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

---

### Step 3: Create Client Login Page

**File**: `src/app/(auth)/client/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/client-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.success('Login successful!');
      router.push('/client');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Client Portal
          </h1>
          <p className="text-gray-400 mb-8">
            Sign in to access your projects and ideas
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <a
                href="/client/register"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

### Step 4: Create Client Login API Route

**File**: `src/app/api/auth/client-login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify user exists in client_users table
    const { data: client, error: clientError } = await supabase
      .from('client_users')
      .select('id, name, email, subscription_tier, active')
      .eq('id', authData.user.id)
      .single();

    if (clientError || !client) {
      console.error('Client lookup error:', clientError);

      // User authenticated but not in client_users table
      await supabase.auth.signOut();

      return NextResponse.json(
        { error: 'You do not have client portal access' },
        { status: 403 }
      );
    }

    // Check if client is active
    if (!client.active) {
      await supabase.auth.signOut();

      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact support.' },
        { status: 403 }
      );
    }

    // Log successful login
    await supabase
      .from('staff_activity_logs')
      .insert({
        staff_id: client.id,
        action: 'client_login',
        metadata: { email: client.email },
      });

    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
      client,
    });
  } catch (error) {
    console.error('Client login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Step 5: Update `withClientAuth` Middleware

**File**: `src/lib/middleware/auth.ts`

**Update the `withClientAuth` function**:

```typescript
export function withClientAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      const session = await requireClientAuth();

      // Attach session to request
      (req as AuthenticatedRequest).user = session.user;
      (req as AuthenticatedRequest).client = session.client;

      return await handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Client auth error:', error);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  };
}
```

---

### Step 6: Add Client-Specific RLS Policies

**File**: Create new migration `supabase/migrations/050_client_rls_policies.sql`

```sql
-- Enable RLS on client_users table
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own record
CREATE POLICY "Clients can view own record"
ON client_users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Clients can update their own record
CREATE POLICY "Clients can update own record"
ON client_users
FOR UPDATE
USING (auth.uid() = id);

-- Enable RLS on ideas table
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own ideas
CREATE POLICY "Clients can view own ideas"
ON ideas
FOR SELECT
USING (auth.uid() = client_id);

-- Policy: Clients can create their own ideas
CREATE POLICY "Clients can create ideas"
ON ideas
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Enable RLS on digital_vault table
ALTER TABLE digital_vault ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own vault entries
CREATE POLICY "Clients can view own vault entries"
ON digital_vault
FOR SELECT
USING (auth.uid() = client_id);

-- Policy: Clients can create vault entries
CREATE POLICY "Clients can create vault entries"
ON digital_vault
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can update their own vault entries
CREATE POLICY "Clients can update own vault entries"
ON digital_vault
FOR UPDATE
USING (auth.uid() = client_id);

-- Policy: Clients can delete their own vault entries
CREATE POLICY "Clients can delete own vault entries"
ON digital_vault
FOR DELETE
USING (auth.uid() = client_id);
```

---

### Step 7: Implement Logout Functionality

**File**: `src/app/api/auth/logout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Update client layout logout button**:

```typescript
const handleLogout = async () => {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (response.ok) {
    window.location.href = '/client/login';
  }
};

<button
  onClick={handleLogout}
  className="text-gray-400 hover:text-gray-100 transition-colors"
>
  <LogOut className="h-5 w-5" />
</button>
```

---

## Testing Checklist

### Manual Testing

- [ ] Visit `/client` → redirects to `/client/login`
- [ ] Login with valid client credentials → redirects to `/client`
- [ ] Login with invalid credentials → shows error
- [ ] Login with staff credentials → shows "no client access" error
- [ ] Login with inactive client → shows "deactivated" error
- [ ] Logout → redirects to `/client/login`
- [ ] Session persists across page refreshes
- [ ] Client name/tier displayed in header
- [ ] API routes return 401 without session

### RLS Testing

```sql
-- Test as client user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<client_user_id>';

-- Should return only client's ideas
SELECT * FROM ideas;

-- Should return only client's vault entries
SELECT * FROM digital_vault;
```

---

## Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Security Considerations

1. **Password Requirements**: Enforce strong passwords (min 8 chars, 1 uppercase, 1 number)
2. **Rate Limiting**: Add rate limiting to login endpoint (max 5 attempts per minute)
3. **Session Expiry**: Configure Supabase session timeout (default 1 hour)
4. **CSRF Protection**: Use Supabase's built-in CSRF protection
5. **Audit Logging**: Log all login attempts (success and failure)

---

## Next Steps

After implementing client authentication:

1. Wire client pages to APIs (`/client/ideas`, `/client/vault`)
2. Add client registration flow
3. Implement password reset
4. Add email verification
5. Add 2FA (optional)

---

## Related Documentation

- **PHASE2_MIGRATION_SRC_APP.md** - Migration overview
- **PHASE2_API_WIRING_COMPLETE.md** - API integration guide
- **src/lib/auth/supabase.ts** - Auth functions

---

**Status**: 📋 Ready for Implementation
**Estimated Time**: 4-6 hours
**Priority**: P1 (Required for client portal launch)
