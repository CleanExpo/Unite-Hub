# Deployment Guide

Complete guide for deploying Unite-Hub CRM to production.

## Overview

This guide covers:
- Vercel deployment
- Convex production setup
- Environment variables configuration
- Domain setup and SSL
- Production checklist
- Post-deployment testing

---

## Deployment Architecture

**Frontend & API Routes:** Vercel (Next.js)
**Database & Backend:** Convex
**Payments:** Stripe
**Email:** Gmail API
**AI Services:** Claude (Anthropic), DALL-E (OpenAI)

---

## Prerequisites

Before deploying:
- [ ] All local testing completed successfully
- [ ] Duncan onboarding test passed
- [ ] All environment variables documented
- [ ] Production API keys obtained
- [ ] Domain name purchased (optional but recommended)
- [ ] Stripe live mode activated
- [ ] Gmail production OAuth configured
- [ ] Budget limits set for AI APIs

---

## Part 1: Prepare for Deployment

### 1.1: Create Production Checklist

Copy this checklist and verify each item:

**Code Quality:**
- [ ] All TypeScript errors resolved
- [ ] No console.errors in production code
- [ ] Removed all debug/test code
- [ ] Environment variables properly typed
- [ ] No hardcoded credentials or secrets

**Security:**
- [ ] All API routes protected with authentication
- [ ] Webhook endpoints verify signatures
- [ ] CORS properly configured
- [ ] Rate limiting implemented on public endpoints
- [ ] SQL injection protection (if using raw queries)

**Performance:**
- [ ] Images optimized (Next.js Image component)
- [ ] Lazy loading implemented where needed
- [ ] Database queries optimized
- [ ] API responses cached appropriately
- [ ] Large dependencies analyzed (bundle size)

**Documentation:**
- [ ] README.md up to date
- [ ] API documentation complete
- [ ] Setup guides finalized
- [ ] User documentation prepared

### 1.2: Update package.json

Ensure build scripts are correct:

```json
{
  "scripts": {
    "dev": "next dev -p 3008",
    "build": "next build",
    "start": "next start",
    "convex": "convex dev",
    "convex:deploy": "convex deploy"
  }
}
```

### 1.3: Configure vercel.json

Create or update `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

---

## Part 2: Deploy Convex Backend

### 2.1: Install Convex CLI (if not already)

```bash
npm install -g convex
```

### 2.2: Login to Convex

```bash
convex login
```

This opens a browser window for authentication.

### 2.3: Deploy Convex Functions

```bash
npx convex deploy --prod
```

Or if you have a specific deployment name:

```bash
npx convex deploy --prod --project your-project-name
```

### 2.4: Get Production Convex URL

After deployment completes, note the production URL:

```
✅ Deployment complete!

Production URL: https://happy-lemur-123.convex.cloud
```

Copy this URL for environment variables.

### 2.5: Verify Convex Deployment

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Click "Production" tab
4. Verify all tables exist:
   - organizations
   - subscriptions
   - clients
   - clientEmails
   - emailThreads
   - autoReplies
   - personas
   - mindMaps
   - marketingStrategies
   - socialCampaigns
   - hooksScripts
   - imageConcepts
   - usageTracking

### 2.6: Set Convex Environment Variables

If you need to store secrets in Convex:

```bash
npx convex env set ANTHROPIC_API_KEY "sk-ant-api03-your-key" --prod
npx convex env set OPENAI_API_KEY "sk-proj-your-key" --prod
```

---

## Part 3: Deploy to Vercel

### 3.1: Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2: Login to Vercel

```bash
vercel login
```

### 3.3: Link Project

From your project directory:

```bash
vercel link
```

Follow prompts:
- **Set up and deploy**: Yes
- **Which scope**: Your account/team
- **Link to existing project**: No (first time) or Yes (redeployment)
- **Project name**: unite-hub (or your choice)

### 3.4: Configure Environment Variables

Add all environment variables to Vercel:

```bash
vercel env add CONVEX_URL production
# Paste: https://your-deployment.convex.cloud

vercel env add NEXT_PUBLIC_CONVEX_URL production
# Paste: https://your-deployment.convex.cloud

vercel env add ANTHROPIC_API_KEY production
# Paste: sk-ant-api03-your-production-key

vercel env add GMAIL_CLIENT_ID production
# Paste: your-client-id.apps.googleusercontent.com

vercel env add GMAIL_CLIENT_SECRET production
# Paste: GOCSPX-your-secret

vercel env add NEXTAUTH_SECRET production
# Paste: your-generated-secret

vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_your-live-key

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste: pk_live_your-live-key

vercel env add STRIPE_PRICE_ID_STARTER production
# Paste: price_live_your-starter-price-id

vercel env add STRIPE_PRICE_ID_PROFESSIONAL production
# Paste: price_live_your-professional-price-id

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_your-production-webhook-secret

vercel env add OPENAI_API_KEY production
# Paste: sk-proj-your-production-key

vercel env add EMAIL_SERVER_HOST production
# Paste: smtp.gmail.com

vercel env add EMAIL_SERVER_PORT production
# Paste: 587

vercel env add EMAIL_SERVER_USER production
# Paste: contact@unite-group.in

vercel env add EMAIL_SERVER_PASSWORD production
# Paste: your-app-password

vercel env add EMAIL_FROM production
# Paste: noreply@unite-group.in

vercel env add ORG_ID production
# Paste: your-production-org-id

vercel env add WORKSPACE_ID production
# Paste: your-production-workspace-id
```

**Or use Vercel Dashboard:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable manually

### 3.5: Deploy to Production

```bash
vercel --prod
```

This will:
1. Build your Next.js application
2. Upload to Vercel
3. Deploy to production
4. Provide production URL

### 3.6: Get Production URL

After deployment:

```
✅ Production: https://unite-hub.vercel.app [copied to clipboard]
```

Note this URL for later configuration.

---

## Part 4: Configure Production Services

### 4.1: Update Gmail OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Click on your OAuth 2.0 Client ID
4. Add production redirect URI:
   ```
   https://unite-hub.vercel.app/api/integrations/gmail/callback
   ```
   Or if using custom domain:
   ```
   https://your-domain.com/api/integrations/gmail/callback
   ```
5. Click "Save"

### 4.2: Update Vercel Environment Variables

Update URLs to production values:

```bash
vercel env add NEXTAUTH_URL production
# Paste: https://unite-hub.vercel.app

vercel env add NEXT_PUBLIC_URL production
# Paste: https://unite-hub.vercel.app

vercel env add GMAIL_REDIRECT_URI production
# Paste: https://unite-hub.vercel.app/api/integrations/gmail/callback

vercel env add GOOGLE_CALLBACK_URL production
# Paste: https://unite-hub.vercel.app/api/integrations/gmail/callback
```

Redeploy:
```bash
vercel --prod
```

### 4.3: Configure Stripe Production Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle to "Live mode"
3. Navigate to Developers > Webhooks
4. Click "Add endpoint"
5. Configure:
   - **Endpoint URL**: `https://unite-hub.vercel.app/api/webhooks/stripe`
   - **Description**: Unite-Hub Production Webhook
   - **Events to send**: Select same events as test mode:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.paid
     - invoice.payment_failed
     - checkout.session.completed
6. Click "Add endpoint"
7. Copy webhook signing secret
8. Update Vercel environment variable:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste: whsec_your-new-production-secret
   ```
9. Redeploy:
   ```bash
   vercel --prod
   ```

---

## Part 5: Custom Domain Setup (Optional)

### 5.1: Purchase Domain

Purchase domain from:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

Recommended domain examples:
- unitehub.com
- unite-hub.com
- youragency.com

### 5.2: Add Domain to Vercel

1. Go to Vercel Dashboard > Your Project
2. Go to Settings > Domains
3. Click "Add"
4. Enter your domain: `yourdomain.com`
5. Click "Add"

### 5.3: Configure DNS

Vercel will provide DNS records to add:

**For root domain (yourdomain.com):**
- Type: A
- Name: @
- Value: 76.76.21.21

**For www subdomain:**
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

**Add records to your DNS provider:**
1. Log in to your domain registrar
2. Find DNS settings
3. Add the A record and CNAME record
4. Save changes

### 5.4: Wait for DNS Propagation

- Usually takes 5 minutes to 48 hours
- Check status in Vercel dashboard
- Vercel automatically provisions SSL certificate

### 5.5: Update Environment Variables

Update all URLs to use custom domain:

```bash
vercel env add NEXTAUTH_URL production
# Paste: https://yourdomain.com

vercel env add NEXT_PUBLIC_URL production
# Paste: https://yourdomain.com

vercel env add GMAIL_REDIRECT_URI production
# Paste: https://yourdomain.com/api/integrations/gmail/callback

vercel env add GOOGLE_CALLBACK_URL production
# Paste: https://yourdomain.com/api/integrations/gmail/callback
```

Update Google OAuth and Stripe webhook with new domain.

Redeploy:
```bash
vercel --prod
```

---

## Part 6: SSL Configuration

### 6.1: Verify SSL Certificate

Vercel automatically provisions SSL certificates. Verify:

1. Visit your domain: https://yourdomain.com
2. Check for padlock icon in browser
3. Certificate should be valid and issued by Let's Encrypt or Vercel

### 6.2: Force HTTPS

Vercel automatically redirects HTTP to HTTPS.

To verify:
```bash
curl -I http://yourdomain.com
```

Should return:
```
HTTP/1.1 308 Permanent Redirect
Location: https://yourdomain.com
```

### 6.3: Configure HSTS (Optional)

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

---

## Part 7: Post-Deployment Testing

### 7.1: Test Application Access

1. Visit production URL: https://yourdomain.com
2. Verify homepage loads
3. Check that all assets load (images, CSS, JS)
4. No console errors in browser

### 7.2: Test Authentication

1. Go to: https://yourdomain.com/auth/signup
2. Create a test account
3. Verify email verification works (if configured)
4. Sign in successfully
5. Access protected routes (dashboard)

### 7.3: Test Gmail Integration

1. Navigate to Settings > Integrations
2. Click "Connect Gmail"
3. Complete OAuth flow
4. Verify integration connects successfully
5. Send test email to contact@unite-group.in
6. Verify email processes correctly

### 7.4: Test Stripe Checkout

**IMPORTANT: Test with real small amounts first!**

1. Navigate to: https://yourdomain.com/pricing
2. Click "Get Started" on Starter plan
3. Use real payment method with small amount:
   - Use your own card
   - Complete checkout
   - Verify charge appears in Stripe dashboard
4. Immediately cancel subscription to avoid charges
5. Verify webhook events processed

### 7.5: Test API Endpoints

Test key endpoints:

**Health check:**
```bash
curl https://yourdomain.com/api/health
```

**Stripe webhook:**
```bash
# Trigger test event from Stripe dashboard
stripe trigger customer.subscription.created --api-key sk_live_your-key
```

**Gmail sync:**
```bash
curl -X POST https://yourdomain.com/api/integrations/gmail/sync \
  -H "Authorization: Bearer your-auth-token"
```

### 7.6: Monitor Error Logs

1. Check Vercel logs:
   - Dashboard > Your Project > Deployments > View Logs
2. Check Convex logs:
   - Dashboard > Production > Logs
3. Monitor for errors or warnings

---

## Part 8: Set Up Monitoring & Alerts

### 8.1: Vercel Monitoring

1. Enable Vercel Analytics:
   - Dashboard > Your Project > Analytics
2. Set up deployment notifications:
   - Settings > Notifications
   - Add Slack/Email notifications for deployments

### 8.2: Error Tracking (Sentry - Optional)

Install Sentry:

```bash
npm install @sentry/nextjs
```

Configure `sentry.config.js`:

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

Add to `.env.production`:
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 8.3: Uptime Monitoring

Use services like:
- **Uptime Robot** (free): https://uptimerobot.com/
- **Better Uptime**: https://betteruptime.com/
- **Pingdom**: https://www.pingdom.com/

Configure to:
- Ping your homepage every 5 minutes
- Alert if down for more than 2 minutes
- Send alerts to email/Slack

### 8.4: Cost Monitoring

Set up budget alerts:

**Vercel:**
- Settings > Billing > Set usage alerts

**Stripe:**
- Settings > Billing > Usage alerts

**Anthropic (Claude):**
- Console > Billing > Set budget limits

**OpenAI (DALL-E):**
- Platform > Billing > Set monthly budget limit

---

## Part 9: Database Backups

### 9.1: Convex Automatic Backups

Convex automatically backs up data. To export:

1. Convex Dashboard > Production > Export
2. Click "Export Data"
3. Download JSON export
4. Store securely

### 9.2: Schedule Regular Exports

Create a cron job or use Convex scheduled functions:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly(
  "weekly-backup",
  { hourUTC: 2, minuteUTC: 0 },
  internal.backup.exportData
);

export default crons;
```

---

## Part 10: Production Checklist

Before announcing launch:

### Security
- [ ] All environment variables set correctly
- [ ] No secrets in code or logs
- [ ] HTTPS enabled and working
- [ ] Webhook signatures verified
- [ ] API routes protected with auth
- [ ] Rate limiting implemented
- [ ] CORS configured properly

### Functionality
- [ ] User signup/login works
- [ ] Stripe checkout completes
- [ ] Subscriptions create correctly
- [ ] Webhooks process successfully
- [ ] Gmail integration connects
- [ ] Email ingestion works
- [ ] Auto-replies send successfully
- [ ] Claude AI integrations work
- [ ] DALL-E image generation works
- [ ] All dashboard pages load

### Performance
- [ ] Page load times < 3 seconds
- [ ] Images optimized
- [ ] API responses < 1 second
- [ ] No unnecessary re-renders
- [ ] Lighthouse score > 80

### Monitoring
- [ ] Error tracking enabled (Sentry)
- [ ] Uptime monitoring configured
- [ ] Deployment notifications set up
- [ ] Cost alerts configured
- [ ] Backup system in place

### Documentation
- [ ] User onboarding docs prepared
- [ ] API documentation complete
- [ ] Internal runbooks created
- [ ] Support email set up

### Legal/Business
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance reviewed (if EU customers)
- [ ] Stripe live mode activated
- [ ] Business information verified

---

## Part 11: Rollback Plan

If deployment fails or critical issues arise:

### 11.1: Revert Vercel Deployment

```bash
# List recent deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>
```

Or via dashboard:
1. Vercel Dashboard > Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"

### 11.2: Revert Convex Deployment

Convex doesn't support instant rollback, but you can:
1. Revert code changes locally
2. Run `npx convex deploy --prod`
3. Or restore from backup if data corrupted

### 11.3: Disable Features

If specific feature is broken:
1. Use feature flags in environment variables
2. Set `FEATURE_XYZ_ENABLED=false`
3. Redeploy

---

## Part 12: Scaling Considerations

As your application grows:

### 12.1: Vercel Plan

- **Hobby**: Free, suitable for low traffic
- **Pro**: $20/month, 1M page views
- **Enterprise**: Custom, unlimited

Monitor usage in dashboard.

### 12.2: Convex Plan

- **Starter**: Free, 1M function calls/month
- **Professional**: $25/month, 10M calls
- **Scale**: Custom pricing

### 12.3: API Rate Limits

Monitor and potentially increase:
- **Claude API**: Request tier increase
- **OpenAI API**: Automatic tiers with usage
- **Gmail API**: Request quota increase
- **Stripe API**: Generally sufficient

### 12.4: CDN for Assets

Consider moving images to:
- AWS S3 + CloudFront
- Cloudinary
- Vercel Blob Storage

---

## Troubleshooting

### Deployment Fails

**Error: Build failed**
- Check build logs in Vercel
- Ensure all dependencies installed
- Run `npm run build` locally first

**Error: Environment variables missing**
- Verify all required variables set in Vercel
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Webhooks Not Working

**Stripe webhooks fail:**
- Verify endpoint URL is correct and accessible
- Check webhook signing secret matches
- Review webhook logs in Stripe dashboard
- Test with `stripe trigger` command

**Gmail webhooks fail:**
- Verify Pub/Sub topic configured
- Check watch request is active
- Renew watch request if expired

### Database Connection Issues

**Convex connection fails:**
- Verify CONVEX_URL is correct production URL
- Check Convex deployment is active
- Review Convex function logs for errors

### Performance Issues

**Slow page loads:**
- Check Vercel Analytics for bottlenecks
- Optimize images (use Next.js Image component)
- Enable caching on API routes
- Review database queries

---

## Support

For deployment issues:
- Vercel Support: https://vercel.com/support
- Convex Discord: https://discord.gg/convex
- Unite-Hub Support: contact@unite-group.in

---

## Success Criteria

Deployment is successful when:
1. ✅ Application accessible at production URL
2. ✅ SSL certificate active and valid
3. ✅ All pages load without errors
4. ✅ Authentication works
5. ✅ Stripe checkout completes
6. ✅ Webhooks process correctly
7. ✅ Gmail integration connects
8. ✅ Email ingestion works
9. ✅ AI features function properly
10. ✅ Monitoring and alerts configured
11. ✅ Backups scheduled
12. ✅ No critical errors in logs

**Congratulations! Your Unite-Hub CRM is now live in production!**
