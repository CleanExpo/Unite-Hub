# 🔍 Environment Variables Audit Report

**Date:** 2025-11-13
**System:** Unite Hub
**Current Port:** 3008

---

## ✅ Correctly Configured (9 variables)

These variables have valid values and are ready to use:

| Variable | Status | Notes |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ Valid | Claude AI key present |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Valid | https://lksfwktwtmyznckodsau.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Valid | JWT token present |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Valid | Service role key present |
| `JWT_SECRET` | ✅ Valid | Generated secret |
| `DIRECT_CONNECT` | ✅ Valid | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ Valid | Generated secret |
| `GMAIL_CLIENT_ID` | ✅ Valid | Real Google client ID |
| `GMAIL_CLIENT_SECRET` | ✅ Valid | Real Google client secret |

---

## ⚠️ Port Mismatches (4 variables) - **CRITICAL**

Your app runs on port **3008** but these variables point to port **3000**:

| Variable | Current Value | Should Be |
|----------|---------------|-----------|
| `NEXTAUTH_URL` | http://localhost:3000 | http://localhost:3008 |
| `GMAIL_REDIRECT_URI` | http://localhost:3000 | http://localhost:3008/api/integrations/gmail/callback |
| `GOOGLE_CALLBACK_URL` | http://localhost:3000 | http://localhost:3008/api/integrations/gmail/callback |
| `NEXT_PUBLIC_URL` | http://localhost:3000 | http://localhost:3008 |

**Impact:** Gmail OAuth will fail, NextAuth won't work properly

---

## 🔴 Placeholder Values (9 variables) - Need Real Values

These have placeholder/dummy values that need to be replaced:

### Email Provider (SMTP) - **Optional**
Only needed if you want email-based authentication:

| Variable | Current Value | Action Required |
|----------|---------------|-----------------|
| `EMAIL_SERVER_USER` | your-email@gmail.com | Update with real Gmail address |
| `EMAIL_SERVER_PASSWORD` | your-app-password | Generate Gmail App Password |

**How to get Gmail App Password:**
```bash
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Search "App Passwords"
4. Generate password for "Mail"
5. Copy 16-character password to EMAIL_SERVER_PASSWORD
```

### Stripe (Payment Processing) - **Optional**
Only needed if you plan to charge users:

| Variable | Current Value | Action Required |
|----------|---------------|-----------------|
| `STRIPE_SECRET_KEY` | sk_test_your_stripe_secret_key | Get from Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pk_test_your_stripe_public_key | Get from Stripe Dashboard |
| `STRIPE_PRICE_ID_STARTER` | price_1234567890 | Create in Stripe → Products |
| `STRIPE_PRICE_ID_PROFESSIONAL` | price_0987654321 | Create in Stripe → Products |
| `STRIPE_WEBHOOK_SECRET` | whsec_your_webhook_secret_here | Get from Stripe → Webhooks |

**Stripe Setup:**
```bash
1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Create products: Dashboard → Products → Create product
4. Set up webhook: Dashboard → Developers → Webhooks
   - Endpoint: https://your-domain.com/api/webhooks/stripe
   - Events: checkout.session.completed, customer.subscription.updated
```

### Google OAuth (NextAuth) - **Duplicate Issue**

You have duplicate Google OAuth variables with different values:

**Lines 26-27 (Placeholders):**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Lines 52-53 (Real Values):**
```env
GOOGLE_CLIENT_ID=537153033593-ivf845sbehan86fjklf8p617rslnqov4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**Action:** Remove the placeholder duplicates (lines 26-27)

---

## 🗑️ Legacy/Unused Variables (5 variables)

These were from the old Convex backend and can be removed:

| Variable | Status | Notes |
|----------|--------|-------|
| `CONVEX_DEPLOYMENT` | ❌ Unused | System now uses Supabase |
| `CONVEX_URL` | ❌ Unused | System now uses Supabase |
| `NEXT_PUBLIC_CONVEX_URL` | ❌ Unused | System now uses Supabase |
| `ORG_ID` | ❌ Unused | Legacy Convex ID |
| `WORKSPACE_ID` | ❌ Unused | Legacy Convex ID |

---

## 🔄 Duplicate Variables (3 sets)

These variables appear twice with different names but serve the same purpose:

| Set 1 | Set 2 | Recommendation |
|-------|-------|----------------|
| `GMAIL_CLIENT_ID` (line 19) | `GOOGLE_CLIENT_ID` (line 52) | Keep both - used by different integrations |
| `GMAIL_CLIENT_SECRET` (line 20) | `GOOGLE_CLIENT_SECRET` (line 53) | Keep both - used by different integrations |
| `GMAIL_REDIRECT_URI` (line 21) | `GOOGLE_CALLBACK_URL` (line 54) | Keep both - used by different integrations |

**Note:** While these look duplicate, they're used by:
- `GMAIL_*` → Gmail integration (`src/lib/integrations/gmail.ts`)
- `GOOGLE_*` → NextAuth OAuth (`src/lib/auth.ts`)

---

## 📋 Complete Updated .env.local Template

Here's your corrected `.env.local` file with port fixes and cleanup:

```env
# ==============================================
# UNITE HUB - Environment Configuration
# ==============================================

# ---------------------------------------------
# NextAuth (Authentication)
# ---------------------------------------------
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=ejtMMfOz/R/wniUWiSR+9JNh4dyNT+13SlNHuZRMUxM=

# Google OAuth (for NextAuth sign-in)
GOOGLE_CLIENT_ID=537153033593-ivf845sbehan86fjklf8p617rslnqov4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback

# ---------------------------------------------
# Supabase (Database)
# ---------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://lksfwktwtmyznckodsau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrc2Z3a3R3dG15em5ja29kc2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTE1MDksImV4cCI6MjA3ODQ4NzUwOX0.l2KIokOpdMAUFXR9rnFqyIt9zH2hdFX8eHc-oi-UtTw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrc2Z3a3R3dG15em5ja29kc2F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkxMTUwOSwiZXhwIjoyMDc4NDg3NTA5fQ.o7UTPiEHBK7h2gRvJHifVxp_k990zavnpqG-7RdiN7Q
JWT_SECRET=R+5LeuaLB9osVxccj2YHJGtEXoAzYmGGVPoNjK8aDVAPWVtQKCQAbWc0FMThpmdagqUaAKlzqZhg0GpGoKNbXA==
DIRECT_CONNECT=postgresql://postgres:wOgLede9R4GJzGo8@db.lksfwktwtmyznckodsau.supabase.co:5432/postgres

# ---------------------------------------------
# Claude AI (Content Generation)
# ---------------------------------------------
ANTHROPIC_API_KEY=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

# ---------------------------------------------
# Gmail Integration (Email Sync & Send)
# ---------------------------------------------
GMAIL_CLIENT_ID=537153033593-ivf845sbehan86fjklf8p617rslnqov4.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback

# ---------------------------------------------
# Email Provider (Optional - for email auth)
# ---------------------------------------------
# Only needed if using email-based authentication
# EMAIL_SERVER_HOST=smtp.gmail.com
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER=your-email@gmail.com
# EMAIL_SERVER_PASSWORD=your-gmail-app-password
# EMAIL_FROM=contact@unite-group.in

# ---------------------------------------------
# Stripe (Optional - for payments)
# ---------------------------------------------
# Only needed if monetizing the platform
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public_key
# STRIPE_PRICE_ID_STARTER=price_1234567890
# STRIPE_PRICE_ID_PROFESSIONAL=price_0987654321
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ---------------------------------------------
# Application URLs
# ---------------------------------------------
NEXT_PUBLIC_URL=http://localhost:3008
```

---

## 🎯 Priority Action Items

### **CRITICAL - Do Now:**
1. **Fix Port Mismatches** (5 minutes)
   ```bash
   # Update these 4 variables from 3000 → 3008
   - NEXTAUTH_URL
   - GMAIL_REDIRECT_URI
   - GOOGLE_CALLBACK_URL
   - NEXT_PUBLIC_URL
   ```

2. **Update Google OAuth Redirect URLs** (2 minutes)
   ```bash
   # Go to Google Cloud Console
   # Update authorized redirect URIs to:
   http://localhost:3008/api/integrations/gmail/callback
   ```

3. **Remove Legacy Variables** (1 minute)
   ```bash
   # Delete these lines from .env.local:
   - CONVEX_DEPLOYMENT
   - CONVEX_URL
   - NEXT_PUBLIC_CONVEX_URL
   - ORG_ID
   - WORKSPACE_ID
   ```

4. **Remove Duplicate Placeholders** (1 minute)
   ```bash
   # Delete lines 26-27 (placeholder GOOGLE_CLIENT_ID/SECRET)
   # Keep lines 52-53 (real values)
   ```

### **OPTIONAL - If Needed:**

5. **Email Authentication** (10 minutes)
   - Only if you want users to sign in with email/password
   - Requires Gmail App Password setup
   - Currently commented out

6. **Stripe Payments** (30 minutes)
   - Only if you're charging users
   - Requires Stripe account setup
   - Currently commented out

---

## 🧪 Testing Your Configuration

After making updates, test the configuration:

```bash
# 1. Restart dev server
npm run dev

# 2. Test database connection
curl http://localhost:3008/api/test/db

# Expected response:
# {"success":true,"message":"Database connection successful"}

# 3. Test Gmail OAuth
# Visit: http://localhost:3008/dashboard/settings
# Click "Connect" under Gmail
# Should redirect to Google OAuth

# 4. Test Claude AI
npm run analyze-contacts

# Expected: Should analyze contacts without errors

# 5. Test campaign automation
npm run process-campaigns

# Expected: Should process campaigns successfully
```

---

## 📊 Configuration Status Summary

| Category | Status | Ready for Production? |
|----------|--------|----------------------|
| **Database (Supabase)** | ✅ Configured | Yes |
| **AI (Claude)** | ✅ Configured | Yes |
| **Gmail Integration** | ⚠️ Port mismatch | After port fix |
| **NextAuth** | ⚠️ Port mismatch | After port fix |
| **Email Auth (SMTP)** | ❌ Not configured | Optional |
| **Stripe Payments** | ❌ Not configured | Optional |

**Overall Status:** 80% Ready
- **Critical Issues:** 4 (port mismatches)
- **Optional Features:** 2 (SMTP, Stripe)

---

## 🔒 Security Notes

### ⚠️ IMPORTANT - Security Concerns

1. **Never commit `.env.local` to Git**
   ```bash
   # Verify it's in .gitignore
   grep ".env.local" .gitignore
   ```

2. **Rotate secrets before production**
   ```bash
   # Generate new NEXTAUTH_SECRET
   openssl rand -base64 32

   # Regenerate JWT_SECRET
   openssl rand -base64 64
   ```

3. **Use different keys for production**
   - Create separate Supabase project
   - Use production Stripe keys (sk_live_...)
   - Get production Google OAuth credentials

4. **Database credentials exposed**
   - Your `DIRECT_CONNECT` string contains password
   - Ensure `.env.local` is never shared/committed
   - Consider using connection pooling in production

---

## 📝 Next Steps

1. **Immediate** (Next 10 minutes):
   - [ ] Update 4 port variables (3000 → 3008)
   - [ ] Remove 5 legacy Convex variables
   - [ ] Remove 2 placeholder Google OAuth variables
   - [ ] Update Google Cloud Console redirect URI

2. **Short-term** (Next hour):
   - [ ] Test Gmail OAuth flow
   - [ ] Test contact analysis
   - [ ] Test campaign automation
   - [ ] Verify all features work

3. **Before Production** (Next week):
   - [ ] Create production Supabase project
   - [ ] Get production Google OAuth credentials
   - [ ] Generate new production secrets
   - [ ] Set up monitoring (Sentry)
   - [ ] Optional: Configure Stripe
   - [ ] Optional: Configure SMTP

---

## 🆘 Troubleshooting

### Gmail OAuth Fails
```
Error: redirect_uri_mismatch
```
**Fix:** Ensure Google Cloud Console has exactly:
```
http://localhost:3008/api/integrations/gmail/callback
```

### NextAuth Error
```
Error: NEXTAUTH_URL must match the deployed URL
```
**Fix:** Update `NEXTAUTH_URL=http://localhost:3008`

### Database Connection Error
```
Error: Failed to connect to database
```
**Fix:** Verify Supabase project is active and keys are correct

---

**Report Generated:** 2025-11-13
**Next Audit:** After port fixes applied
