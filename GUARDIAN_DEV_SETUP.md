# Guardian Development Setup Guide

**Problem**: Guardian features returning 401 Unauthorized since December 6th

**Root Cause**: Guardian requires authenticated Supabase users with `guardian_role` metadata, but no test users were created during initial setup.

---

## Quick Fix (5 minutes)

### Step 1: Create Test User via Google OAuth

1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3008/auth/signin
3. Click "Continue with Google"
4. Sign in with your Google account
5. You'll be redirected to the dashboard

### Step 2: Add Guardian Role to Your User

1. Open **Supabase Dashboard** → Authentication → Users
2. Find your user (the email you just signed in with)
3. Copy the user ID (UUID)
4. Go to **SQL Editor** and run:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_admin"'
)
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT
  id,
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 3: Refresh and Access Guardian

1. Go back to http://localhost:3008
2. Refresh the page
3. Navigate to: http://localhost:3008/guardian/alerts/dashboard
4. You should now see the Guardian dashboard (may show "No alerts" - that's normal)

---

## Create Multiple Test Users (Optional)

If you need users with different Guardian roles for testing:

### Option A: Using the Existing Script

```bash
# 1. First create users through Supabase Auth UI or Google OAuth:
#    - viewer@test.com (if using email auth)
#    - analyst@test.com
#    - admin@test.com

# 2. Then run the setup script in Supabase SQL Editor:
cat scripts/setup-guardian-test-users.sql
# Copy and paste into Supabase SQL Editor and run
```

### Option B: Manual Setup for Each User

```sql
-- Guardian Viewer (read-only)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_viewer"'
)
WHERE email = 'viewer@example.com';

-- Guardian Analyst (read + warehouse access)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_analyst"'
)
WHERE email = 'analyst@example.com';

-- Guardian Admin (full access)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_admin"'
)
WHERE email = 'admin@example.com';
```

---

## Guardian Role Permissions

| Role | Permissions |
|------|-------------|
| **guardian_viewer** | View alerts, incidents, notifications (read-only) |
| **guardian_analyst** | Viewer + warehouse access, replay scenarios, deeper analytics |
| **guardian_admin** | Full access: scenarios, simulations, rules, configurations |

**Default**: Users without a `guardian_role` automatically get `guardian_viewer` access.

---

## Troubleshooting

### Still Getting 401 Unauthorized?

1. **Check if logged in**: Open browser DevTools → Application → Cookies → Look for `sb-*-auth-token`
2. **Check Guardian role**: Run in Supabase SQL Editor:
   ```sql
   SELECT email, raw_user_meta_data->>'guardian_role' as role
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```
3. **Clear cookies and re-login**: Sometimes auth state gets stale

### Getting "No workspace" errors?

Guardian uses simplified tenant model:
- `tenant_id` = authenticated user's ID
- `workspaceId` = optional, not required for Guardian features
- RLS policies filter by `tenant_id = auth.uid()`

### Can't access /guardian routes?

Verify the route exists:
```bash
# List all Guardian pages
find src/app/guardian -name "page.tsx"
```

Common Guardian routes:
- `/guardian/alerts/dashboard` - Main alerts view
- `/guardian/admin/simulation` - I01/I02 simulation admin
- `/guardian/admin/qa` - I05 QA scheduler
- `/guardian/admin/gatekeeper` - I06 change impact (if implemented)

---

## What Changed Since December 6th?

**December 3, 2025**: Security hardening commit (`ff6eb73c`) added authentication to 65+ API routes, including all Guardian endpoints. This was correct for production security, but broke local development because:

1. No test users were created
2. Guardian role setup script existed but wasn't documented
3. No "Getting Started" guide for developers

**This document fixes that gap.**

---

## Production Deployment Notes

For production deployments:

1. **Don't use test emails** (`viewer@test.com`, etc.)
2. **Add roles via admin panel** after users sign up
3. **Use service role key** for automated role assignment
4. **Monitor auth errors** in Supabase logs

Example production role assignment API:

```typescript
// POST /api/admin/guardian/assign-role
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
);

await supabase.auth.admin.updateUserById(userId, {
  user_metadata: {
    guardian_role: 'guardian_admin'
  }
});
```

---

## Summary

**Before**: Guardian features broken since Dec 6 - no way to authenticate or test

**After**:
1. Sign in with Google OAuth
2. Run one SQL command to add Guardian role
3. Access Guardian features immediately

**Time to fix**: 5 minutes
