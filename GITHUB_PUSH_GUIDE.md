# 🚀 Quick Guide: Push to GitHub & Deploy to Vercel

## ✅ Pre-Push Security Verification Complete

All sensitive data is secured and ready for GitHub push!

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `unite-hub` (or your preferred name)
   - **Description**: "AI-powered CRM with email automation and Stripe subscriptions"
   - **Visibility**: ⚠️ **Private** (recommended initially)
   - **DO NOT** check "Add a README file"
3. Click **"Create repository"**

---

## Step 2: Push Your Code

Copy and run these commands in your terminal:

```bash
# Navigate to project
cd D:\Unite-Hub

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Unite-Hub CRM with Stripe integration"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/unite-hub.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Your code is now on GitHub!**

---

## Step 3: Deploy to Vercel

### 3a. Connect Repository

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `unite-hub` repository
4. Click **"Import"**

### 3b. Configure Project

Vercel will auto-detect Next.js. Verify settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

Click **"Deploy"** (it will fail initially - this is expected)

### 3c. Add Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add each variable from the list below
3. Set environment to **Production** for all

#### Required Environment Variables:

Copy these from your `.env.local` but use **production values**:

```env
# Convex
CONVEX_DEPLOYMENT=
CONVEX_URL=
NEXT_PUBLIC_CONVEX_URL=

# Anthropic
ANTHROPIC_API_KEY=

# NextAuth (Generate new secrets!)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=https://your-app.vercel.app/api/integrations/gmail/callback
GOOGLE_CALLBACK_URL=https://your-app.vercel.app/api/integrations/gmail/callback

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Stripe (Use LIVE keys for production!)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PROFESSIONAL=
STRIPE_WEBHOOK_SECRET=
STRIPE_SECRET_TOKEN=
STRIPE_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
DIRECT_CONNECT=

# URLs
NEXT_PUBLIC_URL=https://your-app.vercel.app

# Workspace
ORG_ID=
WORKSPACE_ID=
```

#### Generate New Secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

### 3d. Redeploy

1. Click **"Deployments"**
2. Click **"Redeploy"** on the latest deployment
3. Wait for build to complete

**✅ Your app is now live on Vercel!**

---

## Step 4: Configure Stripe Production Webhook

1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Switch to **Live mode** (toggle in top right)
3. Go to **Developers** → **Webhooks**
4. Click **"Add endpoint"**
5. Enter URL: `https://your-app.vercel.app/api/stripe/webhook`
6. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
7. Click **"Add endpoint"**
8. Click **"Reveal"** next to **Signing secret**
9. Copy the webhook secret (starts with `whsec_`)
10. Go back to Vercel → Settings → Environment Variables
11. Update `STRIPE_WEBHOOK_SECRET` with the new production secret
12. Redeploy the app

---

## Step 5: Update OAuth Redirect URIs

### Google OAuth:

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   - `https://your-app.vercel.app/api/integrations/gmail/callback`
6. Click **"Save"**

---

## Step 6: Test Production Deployment

### Test Checklist:

- [ ] App loads at your Vercel URL
- [ ] Google OAuth login works
- [ ] Stripe checkout works
- [ ] Webhooks are receiving events (check Stripe dashboard)
- [ ] Gmail integration can sync
- [ ] No console errors

### Monitor Webhooks:

**Stripe Dashboard** → **Developers** → **Webhooks**
- Check delivery attempts
- Verify events return `200` status
- Review any failed deliveries

---

## 🎯 Current Setup Summary

### Pricing (AUD)
- **Starter**: $249/month + GST
- **Professional**: $549/month + GST

### Stripe Price IDs (TEST - update for production)
- Starter: `price_1SSi0JBY5KEPMwxd1TfAWQER`
- Professional: `price_1SSi0YBY5KEPMwxdrnA0r5cP`

---

## 📋 Post-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] App deployed to Vercel
- [ ] All environment variables configured
- [ ] Stripe production webhook configured
- [ ] Google OAuth redirect URIs updated
- [ ] Production tested and working
- [ ] Monitoring enabled
- [ ] Team access configured

---

## 🆘 Troubleshooting

### Build Failed
- Check Vercel build logs
- Verify all environment variables are set
- Ensure Node.js version compatibility

### Webhook Errors
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches production endpoint
- Review Vercel function logs

### OAuth Errors
- Verify redirect URIs match exactly
- Check credentials are from correct Google project
- Ensure HTTPS (not HTTP) in production

---

## 📚 Additional Resources

- **Deployment Guide**: See `DEPLOYMENT.md` for detailed instructions
- **Security Checklist**: See `SECURITY_CHECKLIST.md` for security best practices
- **Stripe Setup**: See `STRIPE_SETUP.md` for Stripe integration details

---

## ✨ You're All Set!

Your Unite-Hub CRM is now:
- ✅ Securely stored on GitHub
- ✅ Deployed to Vercel
- ✅ Ready for production use

**Next Steps:**
1. Configure custom domain (optional)
2. Set up monitoring and alerts
3. Invite team members
4. Start onboarding customers!

---

**Last Updated**: 2025-01-13
