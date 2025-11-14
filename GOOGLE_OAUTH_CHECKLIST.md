# Google OAuth Configuration Checklist

## Step 1: Google Cloud Console Settings

### ✅ Authorized JavaScript origins:
```
http://localhost:3008
https://unite-hub-git-main-unite-group.vercel.app
https://unite-hub.vercel.app
```

### ✅ Authorized redirect URIs (ONLY THESE TWO):
```
https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback
http://localhost:3008/auth/v1/callback
```

**IMPORTANT:** The redirect URIs MUST have `/auth/v1/callback` at the end!

---

## Step 2: Supabase Dashboard Settings

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication** → **Providers**
4. Find **Google** provider
5. **Enable** the toggle (turn it ON)
6. Fill in:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Click **Save**

### Where to find Client ID and Secret:
- Google Cloud Console → APIs & Services → Credentials
- Click on your OAuth 2.0 Client ID
- Copy the **Client ID** and **Client secret**

---

## Step 3: Verify Configuration

### In Supabase Dashboard:

Check that the **Redirect URL** shown in Supabase is:
```
https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback
```

This MUST match exactly what you put in Google Cloud Console!

---

## Step 4: Test the Flow

1. **Sign out** from Unite-Hub (if logged in)
2. Go to: `http://localhost:3008/`
3. Click **"Continue with Google"**
4. You should see:
   - ✅ Redirect to Google sign-in page
   - ✅ Google account selection
   - ✅ Redirect back to dashboard

### Common Errors:

#### Error: "Unsupported provider"
- **Cause:** Google provider not enabled in Supabase
- **Fix:** Enable Google in Supabase → Authentication → Providers

#### Error: "redirect_uri_mismatch"
- **Cause:** Redirect URI in Google doesn't match Supabase
- **Fix:** Use EXACT URL: `https://lksfwktwtmyznckodsau.supabase.co/auth/v1/callback`

#### Error: "invalid_client"
- **Cause:** Wrong Client ID or Secret in Supabase
- **Fix:** Copy/paste again from Google Cloud Console

#### Error: "access_denied"
- **Cause:** User canceled or app not verified
- **Fix:** Normal behavior, user can try again

---

## Quick Debug

### Test if Supabase Google is enabled:

Run this in browser console on your login page:
```javascript
console.log(window.supabase.auth.getProviders())
```

Should show `google` in the list.

### Check Supabase env variables:

Your `.env.local` should have:
```
NEXT_PUBLIC_SUPABASE_URL="https://lksfwktwtmyznckodsau.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
```

---

## The Correct Flow:

```
User clicks button
    ↓
localhost:3008/login (your app)
    ↓
accounts.google.com (Google sign-in)
    ↓
lksfwktwtmyznckodsau.supabase.co/auth/v1/callback (Supabase processes)
    ↓
localhost:3008/dashboard/overview (redirect back to your app)
```

The key is that Google redirects to **Supabase** first, not directly to your app!

---

## Still Not Working?

If you're still getting errors, please provide:
1. Screenshot of Google Cloud Console redirect URIs
2. Screenshot of Supabase Google provider settings
3. The exact error message you see
4. What happens when you click the Google button

I'll help troubleshoot from there!
