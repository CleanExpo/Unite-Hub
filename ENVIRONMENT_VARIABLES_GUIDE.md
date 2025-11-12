# Environment Variables Guide

Complete reference for all environment variables required to run Unite-Hub CRM.

## Overview

Unite-Hub requires configuration for:
- Convex database
- Anthropic Claude AI
- Gmail API integration
- Stripe payment processing
- OpenAI DALL-E 3
- NextAuth authentication
- Supabase (optional)
- Email server (SMTP)

---

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in required values (see sections below)

3. Never commit `.env.local` to version control (already in `.gitignore`)

---

## Required Variables

### 1. Convex Configuration

**Description**: Backend database and real-time data sync

```bash
# Convex deployment name (get from Convex dashboard)
CONVEX_DEPLOYMENT=your-convex-deployment-name

# Convex URL - Development
CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# Convex URL - Production (after deployment)
# CONVEX_URL=https://your-deployment.convex.cloud
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Where to get:**
1. Sign up at [Convex](https://convex.dev)
2. Create a new project
3. Run `npx convex dev` to get local URL
4. For production: Deploy with `npx convex deploy`

**Example values:**
```bash
CONVEX_DEPLOYMENT=unite-hub-production
CONVEX_URL=https://happy-lemur-123.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://happy-lemur-123.convex.cloud
```

---

### 2. Organization & Workspace IDs

**Description**: Your organization and workspace identifiers in Convex

```bash
# Get these from Convex after creating your organization
ORG_ID=your-organization-id
WORKSPACE_ID=your-workspace-id
```

**Where to get:**
1. Run the app with Convex connected
2. Create an organization through the UI
3. Check Convex dashboard > Data > `organizations` table
4. Copy the `_id` field (e.g., `k57akqzf14r07d9q3pbf9kebvn7v7929`)
5. Create a workspace and get its `_id` similarly

**Example values:**
```bash
ORG_ID=k57akqzf14r07d9q3pbf9kebvn7v7929
WORKSPACE_ID=kh72b1cng9h88691sx4x7krt2h7v7deh
```

---

### 3. Anthropic API (Claude AI)

**Description**: Required for AI-powered content generation, email analysis, and persona creation

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to get:**
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-api03-`)

**Cost**: Pay-as-you-go (see [Anthropic Pricing](https://www.anthropic.com/pricing))
- Claude Sonnet 4.5: ~$3 per million input tokens

**Example value:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ
```

---

### 4. Gmail Integration

**Description**: OAuth credentials for Gmail API email ingestion

```bash
# Gmail API OAuth Credentials
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback

# Google OAuth (duplicate for NextAuth compatibility)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback
```

**Where to get:**
1. Follow **GMAIL_SETUP_GUIDE.md** for detailed steps
2. Create project in [Google Cloud Console](https://console.cloud.google.com/)
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3008/api/integrations/gmail/callback`

**Production values:**
```bash
GMAIL_REDIRECT_URI=https://your-domain.com/api/integrations/gmail/callback
GOOGLE_CALLBACK_URL=https://your-domain.com/api/integrations/gmail/callback
```

**Example values:**
```bash
GMAIL_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrSt
GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback
```

---

### 5. NextAuth Configuration

**Description**: Authentication for user login

```bash
# NextAuth Base URL
NEXTAUTH_URL=http://localhost:3008

# NextAuth Secret (generate a random secret)
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

**Where to get:**

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Or use online generator: https://generate-secret.vercel.app/32

**Production values:**
```bash
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=Yx7dR2pQ8vM9tN4sW6fJ3kL5gH1aB0cD
```

**Example values:**
```bash
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=Yx7dR2pQ8vM9tN4sW6fJ3kL5gH1aB0cDeFgHiJkLmNoPqRsTuVwXyZ
```

---

### 6. Email Server Configuration

**Description**: SMTP server for sending emails (auto-replies, notifications)

```bash
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Where to get:**

**For Gmail:**
1. Enable 2-factor authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Create new app password for "Mail"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
5. Use without spaces: `abcdefghijklmnop`

**For other providers:**
- **SendGrid**: smtp.sendgrid.net, port 587, API key as password
- **Mailgun**: smtp.mailgun.org, port 587, API credentials
- **AWS SES**: email-smtp.region.amazonaws.com, port 587, SMTP credentials

**Example values:**
```bash
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@unite-group.in
```

---

### 7. Stripe Configuration

**Description**: Payment processing and subscription management

```bash
# Stripe API Keys (TEST MODE for development)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Product Price IDs
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PROFESSIONAL=price_xxxxxxxxxxxxx

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URL
NEXT_PUBLIC_URL=http://localhost:3008
```

**Where to get:**
1. Follow **STRIPE_SETUP_GUIDE.md** for detailed steps
2. Sign up at [Stripe](https://stripe.com)
3. Get API keys from Dashboard > Developers > API keys
4. Create products for Starter ($249 AUD) and Professional ($549 AUD)
5. Copy Price IDs from each product
6. Create webhook endpoint and get signing secret

**Production values:**
```bash
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_live_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PROFESSIONAL=price_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_URL=https://your-production-domain.com
```

**Example values:**
```bash
STRIPE_SECRET_KEY=sk_test_51Hy7xKLB4vq2Q9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Hy7xKLB4vq2Q9...
STRIPE_PRICE_ID_STARTER=price_1OxYzABCDEFGHIJ
STRIPE_PRICE_ID_PROFESSIONAL=price_1OxYzKLMNOPQRST
STRIPE_WEBHOOK_SECRET=whsec_abcdefghijklmnopqrstuvwxyz123456
NEXT_PUBLIC_URL=http://localhost:3008
```

---

### 8. OpenAI Configuration (DALL-E 3)

**Description**: AI image generation for marketing visuals

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Organization ID (for organization accounts)
OPENAI_ORG_ID=org-xxxxxxxxxxxxxxx
```

**Where to get:**
1. Follow **DALLE_SETUP_GUIDE.md** for detailed steps
2. Sign up at [OpenAI Platform](https://platform.openai.com/)
3. Add payment method (required for DALL-E)
4. Navigate to API Keys
5. Create new secret key
6. Copy key (starts with `sk-proj-` or `sk-`)

**Cost**: Pay-as-you-go
- DALL-E 3 (1024x1024, standard): $0.040 per image
- DALL-E 3 (1024x1024, HD): $0.080 per image

**Example values:**
```bash
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ
OPENAI_ORG_ID=org-AbCdEfGhIjKlMnOpQrStUv
```

---

## Optional Variables

### 9. Supabase (Alternative Database)

**Description**: If using Supabase instead of or alongside Convex

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=generate-with-openssl-rand-base64-32
DIRECT_CONNECT=postgresql://user:password@host:port/database
```

**Where to get:**
1. Sign up at [Supabase](https://supabase.com)
2. Create new project
3. Get credentials from Settings > API
4. Get connection string from Settings > Database

**Note**: Unite-Hub primarily uses Convex. Supabase is optional.

---

## Environment-Specific Configurations

### Development (.env.local)

```bash
# Use local/test services
CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXTAUTH_URL=http://localhost:3008
NEXT_PUBLIC_URL=http://localhost:3008
GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback

# Use Stripe test mode
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Production (Vercel/Railway/etc.)

```bash
# Use production services
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_URL=https://your-domain.com
GMAIL_REDIRECT_URI=https://your-domain.com/api/integrations/gmail/callback

# Use Stripe live mode
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Setting Environment Variables

### Local Development

1. Create `.env.local` file in project root
2. Add variables (one per line)
3. Restart development server after changes:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add each variable:
   - **Key**: Variable name (e.g., `STRIPE_SECRET_KEY`)
   - **Value**: Variable value
   - **Environment**: Production, Preview, Development
3. Click "Save"
4. Redeploy project for changes to take effect

### Railway Deployment

1. Go to Railway Dashboard > Your Project > Variables
2. Click "New Variable"
3. Add key-value pairs
4. Deploy automatically updates

### Docker / Other Platforms

Use platform-specific environment variable management or mount `.env` file:
```bash
docker run -e CONVEX_URL=... -e ANTHROPIC_API_KEY=... your-image
```

---

## Security Considerations

### DO NOT:
- ❌ Commit `.env.local` or `.env` files to Git
- ❌ Share API keys publicly (GitHub, Slack, etc.)
- ❌ Use production keys in development
- ❌ Log environment variables
- ❌ Expose secret keys in client-side code

### DO:
- ✅ Use `.env.example` as a template (with fake values)
- ✅ Store secrets in password manager
- ✅ Rotate API keys regularly
- ✅ Use different keys for dev/staging/production
- ✅ Restrict API key permissions when possible
- ✅ Monitor API usage for anomalies
- ✅ Use `NEXT_PUBLIC_` prefix only for client-safe values

---

## Verifying Environment Variables

Create a test endpoint to verify (REMOVE IN PRODUCTION):

```javascript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    convex: !!process.env.CONVEX_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gmail: !!process.env.GMAIL_CLIENT_ID,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    // Shows true/false without exposing actual values
  });
}
```

Visit: `http://localhost:3008/api/test-env`

Expected response:
```json
{
  "convex": true,
  "anthropic": true,
  "gmail": true,
  "stripe": true,
  "openai": true
}
```

---

## Common Issues

### "Environment variable not found"

**Cause**: Variable not loaded or misspelled

**Solution**:
1. Check variable name spelling
2. Restart dev server: `npm run dev`
3. Verify file is named `.env.local` (not `.env.local.txt`)
4. Check file is in project root (same directory as `package.json`)

### "Invalid API key"

**Cause**: Wrong key or wrong mode (test vs live)

**Solution**:
1. Verify key is correctly copied (no extra spaces)
2. Check you're using correct mode (test/live)
3. Regenerate key if needed
4. For Stripe: ensure test keys in dev, live keys in production

### Variables work locally but not in production

**Cause**: Not set in deployment platform

**Solution**:
1. Add variables to Vercel/Railway dashboard
2. Redeploy application
3. Check deployment logs for "undefined" errors
4. Verify variable names match exactly (case-sensitive)

---

## Complete .env.local Template

```bash
# ==================================
# UNITE-HUB CRM ENVIRONMENT VARIABLES
# ==================================

# ----------------------------------
# Convex Configuration (Required)
# ----------------------------------
CONVEX_DEPLOYMENT=your-convex-deployment-name
CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# ----------------------------------
# Organization & Workspace (Required)
# ----------------------------------
ORG_ID=your-organization-id
WORKSPACE_ID=your-workspace-id

# ----------------------------------
# Anthropic API - Claude AI (Required)
# ----------------------------------
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ----------------------------------
# Gmail Integration (Required)
# ----------------------------------
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback

# ----------------------------------
# NextAuth Configuration (Required)
# ----------------------------------
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback

# ----------------------------------
# Email Server SMTP (Required)
# ----------------------------------
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# ----------------------------------
# Stripe Payment Processing (Required)
# ----------------------------------
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PROFESSIONAL=price_xxxxxxxxxxxxx
NEXT_PUBLIC_URL=http://localhost:3008
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ----------------------------------
# OpenAI DALL-E 3 (Required)
# ----------------------------------
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORG_ID=org-xxxxxxxxxxxxxxx

# ----------------------------------
# Supabase (Optional)
# ----------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=generate-with-openssl-rand-base64-32
DIRECT_CONNECT=postgresql://user:password@host:port/database
```

---

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Gmail API Setup](./GMAIL_SETUP_GUIDE.md)
- [Stripe Setup](./STRIPE_SETUP_GUIDE.md)
- [DALL-E Setup](./DALLE_SETUP_GUIDE.md)

---

## Support

For environment configuration issues:
- Contact: contact@unite-group.in
- Check troubleshooting sections in individual setup guides
