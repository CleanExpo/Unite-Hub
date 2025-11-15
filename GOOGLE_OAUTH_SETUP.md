# Google OAuth Setup Guide

## Error You're Seeing

```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

This happens because the redirect URI in Google Cloud Console doesn't match what Supabase is sending.

## Understanding the OAuth Flow

When using Supabase with Google OAuth, the flow is:

1. **Your App** → User clicks "Continue with Google"
2. **Google** → User authenticates
3. **Google** → Redirects to **Supabase** (NOT your app)
4. **Supabase** → Processes OAuth callback
5. **Supabase** → Redirects to **Your App** callback route
6. **Your App** → Exchanges code for session

**Key Point:** Google redirects to Supabase first, then Supabase redirects to your app.

## Fix: Update Google Cloud Console

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Find your OAuth 2.0 Client ID
4. Click the **Edit** button (pencil icon)

### Step 2: Set Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, **REMOVE** all existing URIs and add only:

```
https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback
```

**This is the Supabase callback URL** - it's the only one Google needs.

### Step 3: Remove Invalid URIs

**DELETE** these if they exist (they're incorrect):
- ❌ `https://unite-hub.vercel.app/**`
- ❌ `https://unite-hub-git-main-unite-group.vercel.app/**`
- ❌ `https://unite-hub.vercel.app/auth/callback`
- ❌ `http://localhost:3008/auth/callback`

### Step 4: Save Changes

Click **Save** at the bottom of the page.

## Complete Configuration

Your Google OAuth Client should look like this:

### Application type
- Web application

### Name
- Unite-Hub (or whatever you named it)

### Authorized JavaScript origins
```
https://unite-hub.vercel.app
http://localhost:3008
```

### Authorized redirect URIs
```
https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback
```

That's it! Just the one Supabase URL.

## Why This Works

The Supabase OAuth callback URL has this format:
```
https://{project-ref}.supabase.co/auth/v1/callback
```

Where `{project-ref}` is your Supabase project reference ID: `lksfwktwtmyznckodsau`

Google will:
1. Authenticate the user
2. Redirect to: `https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback?code=xxx`
3. Supabase processes the OAuth response
4. Supabase redirects to your app: `https://unite-hub.vercel.app/auth/callback?code=xxx`
5. Your app exchanges the code for a session ✅

## Supabase Configuration (Already Done)

For reference, your Supabase settings should have:

**Site URL:**
```
https://unite-hub.vercel.app
```

**Redirect URLs:**
```
https://unite-hub.vercel.app/**
https://unite-hub-git-main-unite-group.vercel.app/**
http://localhost:3008/**
```

These tell Supabase where to redirect users AFTER it processes the OAuth callback from Google.

## Testing After Fix

1. Go to: https://unite-hub.vercel.app/login
2. Click "Continue with Google"
3. Select your Google account
4. Authorize the app
5. You should be redirected to: `/dashboard/overview` ✅

## Common Mistakes

### ❌ Wrong: Adding your app URLs to Google
```
Google OAuth Redirect URIs:
- https://unite-hub.vercel.app/auth/callback (WRONG!)
- http://localhost:3008/auth/callback (WRONG!)
```

### ✅ Correct: Only Supabase URL in Google
```
Google OAuth Redirect URIs:
- https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback (CORRECT!)
```

### ❌ Wrong: Using wildcards or paths
```
Google OAuth Redirect URIs:
- https://unite-hub.vercel.app/** (INVALID!)
- https://lksfwktwtmyznckodsau.supabase.co/* (INVALID!)
```

Google doesn't allow wildcards or trailing paths.

### ✅ Correct: Exact callback URL only
```
Google OAuth Redirect URIs:
- https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback (CORRECT!)
```

## Finding Your Supabase Project Reference

If you ever need to find your project reference:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Look for **Project URL**: `https://lksfwktwtmyznckodsau.supabase.co`
5. The project reference is: `lksfwktwtmyznckodsau`

Your OAuth callback URL will always be:
```
https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback
```

## After You Fix This

Once you update Google Cloud Console with the correct Supabase callback URL:

1. Wait 1-2 minutes for Google's changes to propagate
2. Test OAuth login at: https://unite-hub.vercel.app/login
3. You should successfully sign in with Google! ✅

## Support

If you still get `redirect_uri_mismatch` after following these steps:

1. Double-check you saved changes in Google Cloud Console
2. Make sure you edited the correct OAuth Client ID
3. Wait a few minutes for Google's changes to propagate
4. Clear your browser cache and cookies
5. Try again

The error message from Google will show you exactly what redirect URI it received vs what it expected - this can help debug the issue.
