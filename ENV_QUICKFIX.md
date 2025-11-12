# 🚨 Environment Configuration Quick Fix

## Critical Issues Found in .env.local

### 🔴 Port Mismatches (4 variables)
Your app runs on **port 3008** but config uses **port 3000**

```diff
- NEXTAUTH_URL=http://localhost:3000
+ NEXTAUTH_URL=http://localhost:3008

- GMAIL_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
+ GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback

- GOOGLE_CALLBACK_URL=http://localhost:3000/api/integrations/gmail/callback  
+ GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback

- NEXT_PUBLIC_URL=http://localhost:3000
+ NEXT_PUBLIC_URL=http://localhost:3008
```

## ⚡ Auto-Fix (Recommended)

```bash
# This will automatically fix all port issues
bash scripts/fix-env-ports.sh
```

## 🛠️ Manual Fix

If you prefer to fix manually:

1. Open `.env.local`
2. Find & Replace: `http://localhost:3000` → `http://localhost:3008`
3. Save the file

## 📋 After Fixing Ports

### 1. Update Google OAuth Settings
```
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", update to:
   http://localhost:3008/api/integrations/gmail/callback
4. Click Save
```

### 2. Clean Up Unused Variables (Optional)

Remove these legacy Convex variables:
```bash
# Delete these lines from .env.local:
CONVEX_DEPLOYMENT=...
CONVEX_URL=...
NEXT_PUBLIC_CONVEX_URL=...
ORG_ID=...
WORKSPACE_ID=...
```

### 3. Remove Duplicate Placeholders (Optional)

You have duplicate Google OAuth variables. Remove the placeholders:
```bash
# DELETE these lines (26-27):
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# KEEP these lines (52-53) - they have real values:
GOOGLE_CLIENT_ID=537153033593-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

## ✅ Test Your Configuration

```bash
# 1. Restart dev server
npm run dev

# 2. Test database
curl http://localhost:3008/api/test/db

# 3. Test Gmail OAuth
# Visit: http://localhost:3008/dashboard/settings
# Click "Connect Gmail"

# 4. Test automation
npm run analyze-contacts
npm run process-campaigns
```

## 📊 Configuration Status

| Component | Status | Action |
|-----------|--------|--------|
| **Supabase** | ✅ Ready | None needed |
| **Claude AI** | ✅ Ready | None needed |
| **Gmail OAuth** | ⚠️ Port fix needed | Fix ports + update Google Console |
| **NextAuth** | ⚠️ Port fix needed | Fix ports |
| **Email Auth** | ❌ Not configured | Optional - add if needed |
| **Stripe** | ❌ Not configured | Optional - add if needed |

## 🎯 What's Working Now

- ✅ Supabase database connection
- ✅ Claude AI content generation  
- ✅ Basic authentication setup
- ✅ Gmail integration credentials

## 🔴 What Needs Fixing

- ⚠️ Port mismatches (blocks Gmail OAuth)
- ⚠️ Google Console redirect URI update
- 🗑️ Legacy Convex variables (optional cleanup)

## ⏱️ Estimated Fix Time

- Port fixes: **2 minutes**
- Google Console update: **3 minutes**
- Optional cleanup: **2 minutes**

**Total: ~7 minutes**

---

**See full report:** `ENV_AUDIT_REPORT.md`
