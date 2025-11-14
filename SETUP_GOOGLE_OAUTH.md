# Setup Google OAuth for Unite-Hub

## Error You're Seeing

```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

This means Google OAuth is not enabled in your Supabase project yet.

---

## Step-by-Step: Enable Google OAuth in Supabase

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Sign in to your account
3. Select your **Unite-Hub project**

### Step 2: Navigate to Authentication Settings

1. Click **Authentication** in the left sidebar
2. Click **Providers** tab
3. Scroll down to find **Google** provider

### Step 3: Enable Google Provider

1. Find the **Google** provider in the list
2. Toggle it **ON** (enable it)
3. You'll see fields for:
   - **Client ID**
   - **Client Secret**

### Step 4: Get Google OAuth Credentials

You need to create OAuth credentials in Google Cloud Console:

#### 4a. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Create a new project or select existing one

#### 4b. Enable Google+ API (if not enabled)
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

#### 4c. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Configure consent screen (if first time):
   - User Type: **External**
   - App name: **Unite-Hub**
   - User support email: Your email
   - Developer email: Your email
   - Click **Save and Continue** through all steps

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Unite-Hub Production**
   - Authorized JavaScript origins:
     ```
     http://localhost:3008
     https://your-vercel-domain.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3008/auth/callback
     https://your-vercel-domain.vercel.app/auth/callback
     ```
   - Click **CREATE**

5. Copy the **Client ID** and **Client Secret**

### Step 5: Add Credentials to Supabase

Go back to Supabase dashboard:

1. Paste **Client ID** from Google into Supabase
2. Paste **Client Secret** from Google into Supabase
3. Copy the **Callback URL** shown by Supabase (looks like):
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
4. Click **Save**

### Step 6: Update Google OAuth Redirect URIs

Go back to Google Cloud Console:

1. Edit your OAuth Client ID
2. Add the Supabase callback URL to **Authorized redirect URIs**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
3. Click **Save**

---

## Quick Setup (For Testing Only)

If you just want to test locally without Google OAuth, you have two options:

### Option A: Hide Google Button (Quick Fix)

Edit `src/app/(auth)/login/page.tsx` and comment out the Google button:

```typescript
{/* Temporarily disabled until Google OAuth configured
<Button
  type="button"
  onClick={handleGoogleSignIn}
  ...
>
  Continue with Google
</Button>
*/}
```

### Option B: Use Email/Password Login

The email/password login still works! Just use:
- **Email:** Your registered email
- **Password:** Your password

---

## After Enabling Google OAuth

Once configured, the Google sign-in flow will:

1. User clicks "Continue with Google"
2. Redirects to Google sign-in page
3. User signs in with Google account
4. Google redirects back to Supabase
5. Supabase creates/updates user account
6. Redirects to: `http://localhost:3008/dashboard/overview`

---

## Verification

After setup, test by:

1. Sign out from Unite-Hub
2. Visit: `http://localhost:3008/login`
3. Click **"Continue with Google"**
4. You should see Google sign-in page (not an error)

---

## Environment Variables (Already Set)

Your `.env.local` already has Supabase configured:
```
NEXT_PUBLIC_SUPABASE_URL=https://eaaqdkuosmggvklhiqoj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

No additional environment variables needed for Google OAuth - it's all configured through the Supabase dashboard!

---

## Current Status

✅ **Google button added** to login page
✅ **Code implemented** - signInWithGoogle() works
✅ **Logo integrated** - Login page looks professional
⚠️ **Google OAuth not enabled** in Supabase (needs manual setup)
✅ **Email/password works** as fallback

You need to enable Google OAuth in Supabase dashboard to make the Google button functional!
