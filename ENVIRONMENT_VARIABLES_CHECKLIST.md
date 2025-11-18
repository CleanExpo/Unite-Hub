# Environment Variables Configuration Checklist

**Date:** 2025-01-18
**Purpose:** Ensure all required environment variables are configured in both local development and Vercel production

---

## ✅ Current Configuration Status

Based on your `.env.local` file, here are all the environment variables currently configured:

### Core Application (10 variables)

- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- [x] `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- [x] `DIRECT_CONNECT` - Direct PostgreSQL connection string
- [x] `NEXT_PUBLIC_URL` - Application base URL
- [x] `JWT_SECRET` - JWT signing secret
- [x] `NEXTAUTH_URL` - NextAuth callback URL
- [x] `NEXTAUTH_SECRET` - NextAuth encryption secret
- [x] `ORG_ID` - Default organization ID (Convex legacy)
- [x] `WORKSPACE_ID` - Default workspace ID (Convex legacy)

### Authentication & OAuth (6 variables)

- [x] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [x] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [x] `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- [x] `GMAIL_CLIENT_ID` - Gmail API client ID (same as Google)
- [x] `GMAIL_CLIENT_SECRET` - Gmail API client secret (same as Google)
- [x] `GMAIL_REDIRECT_URI` - Gmail OAuth redirect URI

### Email Services (5 variables)

- [x] `SENDGRID_API_KEY` - SendGrid API key for transactional emails ✨ NEW!
- [x] `EMAIL_SERVER_HOST` - SMTP server host (smtp.gmail.com)
- [x] `EMAIL_SERVER_PORT` - SMTP server port (587)
- [x] `EMAIL_SERVER_USER` - SMTP username (contact@unite-group.in)
- [x] `EMAIL_SERVER_PASSWORD` - SMTP password
- [x] `EMAIL_FROM` - Default "from" email address

### AI Services (3 variables)

- [x] `ANTHROPIC_API_KEY` - Claude API key (Opus 4, Sonnet 4.5, Haiku 4.5)
- [x] `OPENAI_API_KEY` - OpenAI API key (Whisper transcription)
- [x] `OPENROUTER_API_KEY_2` - OpenRouter API key (backup/alternative)

### Payment Processing (7 variables)

- [x] `STRIPE_SECRET_KEY` - Stripe secret key (TEST mode)
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (TEST mode)
- [x] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [x] `STRIPE_API_KEY` - Stripe API key (alternative?)
- [x] `STRIPE_SECRET_TOKEN` - Stripe organization token
- [x] `STRIPE_PRICE_ID_STARTER` - Stripe price ID for Starter plan
- [x] `STRIPE_PRICE_ID_PROFESSIONAL` - Stripe price ID for Professional plan

### Legacy/Migration (3 variables)

- [x] `CONVEX_URL` - Convex deployment URL (legacy, can be removed)
- [x] `NEXT_PUBLIC_CONVEX_URL` - Convex public URL (legacy, can be removed)
- [x] `CONVEX_DEPLOYMENT` - Convex deployment name (legacy, can be removed)

### Vercel Integration (1 variable)

- [x] `VERCEL_OIDC_TOKEN` - Vercel OIDC token (auto-generated)

---

## 📋 Production Deployment Checklist

### Step 1: Verify Vercel Environment Variables

Go to Vercel Dashboard → Project → Settings → Environment Variables

Ensure these are configured for **Production** environment:

#### Required for Production (Critical)

```env
# Supabase (PRODUCTION VALUES - different from dev!)
NEXT_PUBLIC_SUPABASE_URL=https://[production-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]

# NextAuth (PRODUCTION VALUES)
NEXTAUTH_URL=https://unite-hub.com  # Your production domain
NEXTAUTH_SECRET=[NEW-PRODUCTION-SECRET]  # Generate new for production!

# Google OAuth (PRODUCTION CALLBACK)
GOOGLE_CLIENT_ID=[same-as-dev-or-new-for-production]
GOOGLE_CLIENT_SECRET=[same-as-dev-or-new-for-production]
GOOGLE_CALLBACK_URL=https://unite-hub.com/api/integrations/gmail/callback
GMAIL_REDIRECT_URI=https://unite-hub.com/api/integrations/gmail/callback

# SendGrid (PRODUCTION)
SENDGRID_API_KEY=[your-sendgrid-api-key]  # ✅ Already configured!

# Anthropic Claude AI (PRODUCTION)
ANTHROPIC_API_KEY=sk-ant-[production-key]

# OpenAI Whisper (PRODUCTION)
OPENAI_API_KEY=sk-[production-key]

# Stripe (LIVE MODE!)
STRIPE_SECRET_KEY=sk_live_[live-key]  # Change from TEST to LIVE!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[live-key]  # Change from TEST to LIVE!
STRIPE_WEBHOOK_SECRET=whsec_[production-webhook-secret]
STRIPE_PRICE_ID_STARTER=price_[live-price-id]
STRIPE_PRICE_ID_PROFESSIONAL=price_[live-price-id]

# Application URL
NEXT_PUBLIC_URL=https://unite-hub.com
```

#### Optional (Can use same as dev)

```env
# Email SMTP (if using Gmail SMTP instead of SendGrid)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=[password]
EMAIL_FROM=contact@unite-group.in

# JWT Secret (generate new for production)
JWT_SECRET=[new-production-secret]
```

#### Not Needed in Production

```env
# These are development-only, DO NOT add to Vercel:
DIRECT_CONNECT=[database-connection-string]  # Security risk!
SUPABASE_ACCESS_TOKEN=[cli-token]  # Not needed in production
CONVEX_URL=[legacy]  # Remove completely
NEXT_PUBLIC_CONVEX_URL=[legacy]  # Remove completely
CONVEX_DEPLOYMENT=[legacy]  # Remove completely
ORG_ID=[legacy]  # Remove completely
WORKSPACE_ID=[legacy]  # Remove completely
VERCEL_OIDC_TOKEN=[auto-generated]  # Vercel manages this
```

---

## 🔒 Security Best Practices

### Generating Production Secrets

**NEXTAUTH_SECRET** (Generate new for production):
```bash
openssl rand -base64 32
```

**JWT_SECRET** (Generate new for production):
```bash
openssl rand -hex 32
```

### Critical Security Rules

1. ❌ **NEVER commit secrets to Git**
   - `.env.local` is in `.gitignore` ✅
   - Never push API keys, tokens, or passwords

2. ❌ **NEVER use development keys in production**
   - Use separate Supabase project for production
   - Use separate Stripe account (LIVE mode, not TEST)
   - Generate new NEXTAUTH_SECRET and JWT_SECRET

3. ✅ **DO use Vercel's environment variable encryption**
   - Vercel encrypts all environment variables
   - Only accessible to your deployment

4. ✅ **DO rotate secrets regularly**
   - Rotate API keys every 90 days
   - Rotate passwords every 60 days
   - Update immediately if compromised

---

## ✨ SendGrid Integration (NEW!)

### What SendGrid is Used For

SendGrid is configured for transactional emails:
- Welcome emails after signup
- Password reset emails
- Notification emails
- Campaign emails (if not using Gmail API)

### SendGrid Setup Checklist

- [x] **API Key Created** - `SENDGRID_API_KEY` configured
- [ ] **Sender Identity Verified** - Verify email address or domain
- [ ] **Templates Created** (optional) - For branded emails
- [ ] **Webhooks Configured** (optional) - For tracking opens/clicks
- [ ] **IP Warmup** (if high volume) - Gradual sending increase

### SendGrid Sender Authentication

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Choose one:
   - **Single Sender Verification** (quick, good for low volume)
     - Verify `contact@unite-group.in`
   - **Domain Authentication** (recommended for production)
     - Authenticate entire `unite-group.in` domain
     - Add DNS records provided by SendGrid

### Testing SendGrid Integration

```typescript
// Test script: scripts/test-sendgrid.mjs
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'test@example.com',
  from: 'contact@unite-group.in',
  subject: 'Test Email',
  text: 'This is a test email from Unite-Hub',
  html: '<strong>This is a test email from Unite-Hub</strong>',
};

try {
  await sgMail.send(msg);
  console.log('✅ Email sent successfully');
} catch (error) {
  console.error('❌ Error sending email:', error);
}
```

---

## 🔍 Verification Steps

### Before Deployment

1. **Check all required variables are set in Vercel**
   ```bash
   vercel env ls
   ```

2. **Verify no secrets in code**
   ```bash
   # Search for potential secrets in code
   grep -r "sk-ant-" src/
   grep -r "sk_test_" src/
   grep -r "pk_test_" src/
   # Should return 0 results
   ```

3. **Verify .env.local is gitignored**
   ```bash
   git status .env.local
   # Should show "ignored"
   ```

### After Deployment

1. **Test SendGrid email sending**
   - Trigger welcome email (register new user)
   - Trigger password reset email
   - Check SendGrid dashboard for delivery status

2. **Test Google OAuth**
   - Login with Google
   - Verify callback URL works
   - Check user profile created

3. **Test Stripe webhooks**
   - Create test subscription
   - Verify webhook received
   - Check Stripe dashboard logs

4. **Test Anthropic API**
   - Trigger contact intelligence
   - Verify API call succeeds
   - Check usage in Anthropic dashboard

---

## 📊 Environment Variable Summary

**Total Variables:** 35
**Required for Production:** 20
**Optional:** 5
**Legacy (Remove):** 5
**Auto-Generated:** 5

**Configuration Status:**
- ✅ Local Development: 100% configured (35/35)
- ⏳ Vercel Production: Pending deployment
- ✅ SendGrid: API key configured ✨

---

## 🚀 Next Steps

1. **Add missing variables to Vercel**
   - Go to Vercel → Settings → Environment Variables
   - Add all "Required for Production" variables above
   - Use PRODUCTION values (not development values!)

2. **Update Google OAuth callback**
   - Go to Google Cloud Console
   - Add production callback URL: `https://unite-hub.com/api/integrations/gmail/callback`

3. **Switch Stripe to LIVE mode**
   - Get LIVE API keys from Stripe dashboard
   - Update STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - Create new webhook for production URL
   - Update STRIPE_WEBHOOK_SECRET

4. **Verify SendGrid sender**
   - Verify `contact@unite-group.in` as sender
   - OR authenticate `unite-group.in` domain (recommended)

5. **Test everything**
   - Deploy to Vercel
   - Test all integrations
   - Monitor for errors

---

**Status:** ✅ SendGrid API Key Configured
**Next:** Add production environment variables to Vercel

---

*Last Updated: 2025-01-18*
*Phase 6: Production Deployment & Testing*
