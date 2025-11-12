# Unite-Hub Deployment Guide

## 🔒 Security Checklist (CRITICAL)

Before deploying to GitHub or Vercel, ensure:

- ✅ `.env.local` is in `.gitignore` (verified)
- ✅ `.env.production` is in `.gitignore` (verified)
- ✅ No hardcoded API keys in source code (verified)
- ✅ `.env.example` created with placeholder values
- ✅ All sensitive tokens stored in environment variables only

## 📋 Prerequisites

1. **GitHub Account** - https://github.com
2. **Vercel Account** - https://vercel.com
3. **Stripe Account** - https://stripe.com
4. **Supabase Account** - https://supabase.com
5. **Anthropic API Key** - https://console.anthropic.com
6. **Google Cloud Console** - For Gmail integration

---

## 🚀 Step 1: Push to GitHub

### Initialize Repository (if not already done)

```bash
cd D:\Unite-Hub
git init
git add .
git commit -m "Initial commit: Unite-Hub CRM"
```

### Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `unite-hub`
3. Description: "AI-powered CRM with email automation and subscription management"
4. **Important**: Choose **Private** repository initially
5. **Do NOT** initialize with README (you already have one)
6. Click "Create repository"

### Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/unite-hub.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Deploy to Vercel

### Connect Repository

1. Go to https://vercel.com/new
2. Import your `unite-hub` repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### **Production Environment Variables**

```env
# Convex
CONVEX_DEPLOYMENT=your-production-deployment
CONVEX_URL=your-production-convex-url
NEXT_PUBLIC_CONVEX_URL=your-production-convex-url

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate-new-secret-for-production
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-production-secret

# Email Server
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Stripe (PRODUCTION - use live keys)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PROFESSIONAL=price_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=generate-new-secret-for-production
DIRECT_CONNECT=postgresql://user:password@host:port/database

# Public URL
NEXT_PUBLIC_URL=https://your-domain.vercel.app

# Gmail Integration
GMAIL_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-production-secret
GMAIL_REDIRECT_URI=https://your-domain.vercel.app/api/integrations/gmail/callback
GOOGLE_CALLBACK_URL=https://your-domain.vercel.app/api/integrations/gmail/callback

# Workspace IDs
ORG_ID=your-org-id
WORKSPACE_ID=your-workspace-id
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

---

## 🔧 Step 3: Configure Third-Party Services

### Stripe Production Setup

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create Products**:
   - Starter: $249 AUD/month
   - Professional: $549 AUD/month
3. **Copy Live API Keys**:
   - Secret Key: `sk_live_...`
   - Publishable Key: `pk_live_...`
   - Price IDs for each product
4. **Setup Webhook Endpoint**:
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events to listen:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
5. **Copy Webhook Signing Secret**: `whsec_...`
6. Add to Vercel environment variables

### Google OAuth (Gmail Integration)

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 Credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://your-domain.vercel.app/api/integrations/gmail/callback`
5. Copy Client ID and Client Secret
6. Add to Vercel environment variables

### Supabase Production

1. Create production project at https://supabase.com
2. Copy:
   - Project URL: `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Database connection string: `DIRECT_CONNECT`
3. Run database migrations if applicable
4. Add to Vercel environment variables

### Anthropic API

1. Go to https://console.anthropic.com
2. Create production API key
3. Add to Vercel environment variables

---

## 🧪 Step 4: Testing Production Deployment

### Test Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works (Google OAuth)
- [ ] Database connections successful
- [ ] Stripe checkout flow works
- [ ] Stripe webhooks receiving events
- [ ] Gmail integration can sync emails
- [ ] Email sending works
- [ ] All API routes respond correctly
- [ ] No console errors in browser

### Monitor Webhooks

1. **Stripe Dashboard** → Developers → Webhooks
   - Check delivery status
   - View event logs
   - Verify all events return 200 OK

2. **Vercel Dashboard** → Functions
   - Monitor function logs
   - Check for errors
   - Review execution times

---

## 🔐 Security Best Practices

### Never Commit These Files

- `.env.local`
- `.env.production`
- `.env.development`
- `.env.test`
- Any file with actual API keys

### Rotate Keys Regularly

- Change Stripe webhook secrets every 90 days
- Rotate database passwords quarterly
- Update OAuth credentials annually

### Use Separate Keys for Environments

- **Development**: Test mode Stripe keys, development Supabase
- **Production**: Live mode Stripe keys, production Supabase
- Never mix test and live credentials

### Enable 2FA Everywhere

- GitHub
- Vercel
- Stripe
- Supabase
- Google Cloud Console
- Anthropic Console

---

## 📊 Monitoring & Maintenance

### Set Up Alerts

**Vercel**:
- Function errors
- Build failures
- Performance degradation

**Stripe**:
- Failed payments
- Webhook delivery failures
- Unusual activity

**Supabase**:
- Database connection issues
- High query times
- Storage limits

### Regular Backups

1. **Database**: Daily automated backups via Supabase
2. **Code**: Version controlled in GitHub
3. **Environment Variables**: Document separately (encrypted)

---

## 🆘 Troubleshooting

### Common Issues

**Webhook Signature Verification Failed**
- Ensure `STRIPE_WEBHOOK_SECRET` matches production endpoint
- Check endpoint URL is correct
- Verify Vercel deployment is live

**OAuth Redirect Mismatch**
- Update redirect URIs in Google Cloud Console
- Match exactly with `GOOGLE_CALLBACK_URL`
- Include `https://` protocol

**Database Connection Errors**
- Verify `DIRECT_CONNECT` string is correct
- Check Supabase project is not paused
- Ensure IP allowlist includes Vercel (if applicable)

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies in `package.json`
- Review Vercel build logs

---

## 📝 Post-Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Stripe live mode webhooks working
- [ ] Google OAuth redirect URIs updated
- [ ] Production database migrated and seeded
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring and alerts set up
- [ ] Team members have access to necessary platforms
- [ ] Documentation updated with production URLs
- [ ] Backup strategy implemented

---

## 🎯 Current Configuration

### Pricing (AUD)

- **Starter Plan**: $249/month + GST
- **Professional Plan**: $549/month + GST

### Technology Stack

- **Frontend**: Next.js 14+ with App Router
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js with Google OAuth
- **Payments**: Stripe Subscriptions
- **AI**: Anthropic Claude
- **Email**: Gmail API integration
- **Hosting**: Vercel

---

## 📞 Support

For issues or questions:
1. Check Vercel deployment logs
2. Review Stripe webhook logs
3. Check Supabase database logs
4. Contact support for respective services

---

**Last Updated**: 2025-01-13
**Version**: 1.0.0
