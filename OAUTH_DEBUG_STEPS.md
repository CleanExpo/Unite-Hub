# OAuth Debug Steps

## Current Status

✅ Google Cloud Console configured correctly
✅ Supabase OAuth provider enabled
✅ OAuth flow reaches Google account selection
❌ User redirected back to login after authentication

## Problem

The session cookies aren't being recognized by the middleware, causing users to be redirected back to `/login` instead of staying authenticated.

## Debug Steps

### 1. Check Deployment Status

Wait for the latest deployment to complete (check https://vercel.com/unite-group/unite-hub)

### 2. Test OAuth Flow with Logging

1. Go to: https://unite-hub.vercel.app/login (fresh incognito window)
2. Click "Continue with Google"
3. Select your Google account
4. Note the URL you end up on

### 3. Check Vercel Logs

After testing, check the logs:

1. Go to: https://vercel.com/unite-group/unite-hub
2. Click on the latest deployment
3. Click "Functions" tab
4. Find `/auth/callback` function
5. Look for console.log output showing:
   - "OAuth callback received"
   - "Setting cookie" messages
   - "Session created successfully"

### 4. What to Look For in Logs

**Cookie names being set:**
The logs should show which cookies Supabase is setting. Look for patterns like:
- `sb-lksfwktwtmyznckodsau-auth-token`
- `sb-lksfwktwtmyznckodsau-auth-token-code-verifier`
- Other `sb-*` cookies

**Session data:**
- `hasSession: true` - indicates session was created
- `userId` - should have a valid UUID
- `expiresAt` - should be a future timestamp

### 5. Potential Issues

**Issue A: Cookie Name Mismatch**
- Middleware is looking for: `sb-lksfwktwtmyznckodsau-auth-token`
- But Supabase SSR might be setting: `sb-lksfwktwtmyznckodsau-auth-token.0` or different format

**Solution:** Update middleware to match the actual cookie name

**Issue B: Cookies Not Being Set in Response**
- The callback route sets cookies on both `cookieStore` and `response`
- But if there's an error, cookies might not be attached to the response

**Solution:** Check logs for cookie setting errors

**Issue C: Session Not Created**
- `exchangeCodeForSession` might be failing silently
- Check logs for "Error exchanging code for session"

**Solution:** Fix the error shown in logs

### 6. Next Steps

Once we see the logs, we'll know exactly which issue it is and can fix it accordingly.

## Alternative: Test Locally

You can also test OAuth locally to see the cookies being set:

1. Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are in `.env.local`
2. Add `http://localhost:3008/auth/callback` to Google Cloud Console redirect URIs
3. Run: `npm run dev`
4. Go to: http://localhost:3008/login
5. Try Google OAuth
6. Check browser DevTools → Application → Cookies to see what's being set

## Expected Behavior

When working correctly:
1. User clicks "Continue with Google"
2. Google OAuth completes
3. Redirects to `/auth/callback?code=xxx`
4. Callback route exchanges code for session
5. Sets session cookies in response
6. Redirects to `/dashboard/overview`
7. Middleware sees valid cookie
8. User stays on dashboard ✅
