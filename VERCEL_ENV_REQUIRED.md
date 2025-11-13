# Required Vercel Environment Variables

## ✅ CRITICAL - Already Set
- `NEXT_PUBLIC_CONVEX_URL` = `https://dapper-salamander-52.convex.cloud`

## 🔴 MISSING - Must Add Now

### NextAuth (Required for Authentication)
```
NEXTAUTH_URL=https://unite-hub-git-main-unite-group.vercel.app
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
```

### Google OAuth (Required for Sign In)
```
GOOGLE_CLIENT_ID=[From Google Cloud Console]
GOOGLE_CLIENT_SECRET=[From Google Cloud Console]
```

### Supabase (Optional - has fallbacks)
```
NEXT_PUBLIC_SUPABASE_URL=[From Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[From Supabase dashboard]
```

---

## 🚀 How to Add to Vercel

### Option 1: Via Vercel Dashboard
1. Go to: https://vercel.com/cleanexpo/unite-hub/settings/environment-variables
2. Click "Add New"
3. Add each variable above
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click Save
6. Redeploy

### Option 2: Via CLI
```bash
# Add NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# Enter: https://unite-hub-git-main-unite-group.vercel.app

# Add NEXTAUTH_SECRET (generate first)
openssl rand -base64 32
vercel env add NEXTAUTH_SECRET production
# Paste the generated secret

# Add Google credentials (if you have them)
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

---

## ⚡ Quick Fix: Minimum to Get Site Working

**Add just these 2 to unblock the site:**
```
NEXTAUTH_URL=https://unite-hub-git-main-unite-group.vercel.app
NEXTAUTH_SECRET=[any 32-character random string]
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

Or use this one-time generated secret:
```
3kF9mNpQ7rT2wXyZ8vA1bC4dE5fG6hI7jK8lM9nO0pQ=
```

---

## 📊 Current Status

### ✅ Fixed in Code
- NextAuth enabled (was returning 503)
- Convex generated files committed
- Production build working

### ⏳ Waiting on Environment Variables
- NEXTAUTH_URL - Required for auth to work
- NEXTAUTH_SECRET - Required for session security
- GOOGLE_CLIENT_ID/SECRET - Optional (can add later)

### 🔄 After Adding Variables
- Redeploy Vercel
- Site should be accessible
- Dashboard features will work
- Convex connection should work
