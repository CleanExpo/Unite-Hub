# How to See the Login Page with Google Sign-In

## Why You're Seeing the Dashboard

You're currently **logged in** to Unite-Hub! The system detected your active session and automatically redirected you to the dashboard (this is correct behavior).

The middleware at `src/middleware.ts:26-29` says:
```typescript
// Redirect to dashboard if accessing auth pages with active session
if (isAuthPath && token) {
  redirectUrl.pathname = "/dashboard";
  return NextResponse.redirect(redirectUrl);
}
```

## How to See the Login Page

### Method 1: Sign Out from Dashboard (Recommended)

1. You're already at: `http://localhost:3008/dashboard/overview`
2. Look at the **bottom-left corner** of the sidebar
3. Click on your **profile picture/avatar**
4. Click **"Sign Out"** button
5. You'll be redirected to the login page with the Google button

### Method 2: Clear Browser Cookies

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Under **Storage** → **Cookies** → `http://localhost:3008`
4. Delete these cookies:
   - `sb-access-token`
   - `sb-refresh-token`
   - `sb-localhost-auth-token`
5. Refresh the page

**Firefox:**
1. Press `F12` to open DevTools
2. Go to **Storage** tab
3. Click **Cookies** → `http://localhost:3008`
4. Right-click → **Delete All**
5. Refresh the page

### Method 3: Open Incognito/Private Window

1. Open an **Incognito/Private browsing** window
2. Visit: `http://localhost:3008/`
3. You'll see the login page with Google sign-in button

### Method 4: Direct Logout URL

Visit this URL to clear your session:
```
http://localhost:3008/api/auth/signout
```

Then go to: `http://localhost:3008/login`

---

## What You'll See After Logging Out

The login page now shows:

```
┌─────────────────────────────────┐
│                                  │
│      [Unite-Hub Logo 120x120]   │
│   AI-Powered Marketing CRM       │
│                                  │
│  ┌─────────────────────────────┐│
│  │  [Google Logo] Continue     ││
│  │      with Google            ││
│  └─────────────────────────────┘│
│                                  │
│  ─── Or continue with email ─── │
│                                  │
│  Email Address:                  │
│  [____________]                  │
│                                  │
│  Password:                       │
│  [____________]                  │
│                                  │
│  [ ] Remember me  Forgot?        │
│                                  │
│  [      Sign In      ]           │
│                                  │
│  Don't have an account? Sign up  │
└─────────────────────────────────┘
```

---

## The Login System is Working Correctly!

✅ **Logged in users** → Redirected to dashboard
✅ **Logged out users** → See login page with Google button
✅ **Google OAuth** → Ready to use (after Supabase config)
✅ **Email/Password** → Still works as fallback

You just need to sign out first to see the login page!
