# Debug OAuth Redirect Loop Issue

## Current Behavior:
1. ✅ Click "Continue with Google" - Opens Google login
2. ✅ Select Google account - Google authentication works
3. ❌ Redirects back to login page instead of dashboard

## Root Cause:
This happens when **Supabase Site URL doesn't match your production domain**.

## Fix: Update Supabase Site URL

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: `lksfwktwtmyznckodsau`
3. Go to: **Settings** → **Authentication** → **URL Configuration**

### Step 2: Update Site URL
Change the **Site URL** from:
```
http://localhost:3008
```

To your production domain:
```
https://unite-hub.vercel.app
```

### Step 3: Add All Redirect URLs
In the **Redirect URLs** section, add:
```
https://unite-hub.vercel.app/**
https://unite-hub-git-main-unite-group.vercel.app/**
http://localhost:3008/**
```

## Why This Fixes It:

When Google OAuth completes:
1. Google → Supabase callback (✅ working)
2. Supabase creates session (✅ working)
3. Supabase tries to redirect to **Site URL** + `/dashboard/overview`
4. **Problem:** If Site URL = `localhost:3008` but you're on `unite-hub.vercel.app`
5. **Result:** Redirect fails, sends you back to login

## After Fixing:

1. Click "Continue with Google"
2. Select account
3. Supabase redirects to: `https://unite-hub.vercel.app/dashboard/overview`
4. ✅ Dashboard loads with your user session!

## Test on Localhost:

If you want to test immediately without changing production settings:
1. Go to `http://localhost:3008/login`
2. Click "Continue with Google"
3. This should work because Site URL is set to localhost

## Verification:

After updating Supabase Site URL, check:
- ✅ Can sign in with Google on production
- ✅ Redirects to dashboard
- ✅ Session persists
- ✅ No more redirect loop
