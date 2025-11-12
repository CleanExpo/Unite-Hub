# 🚀 UNITE-HUB CRM - DEPLOYMENT CHECKLIST

**Project**: AI-Powered Autonomous Marketing CRM
**Branch**: AI-POWERED
**Target**: Production Deployment

---

## PRE-DEPLOYMENT CHECKLIST

### ☐ 1. Install Dependencies

```bash
cd D:\Unite-Hub
npm install
```

**Expected packages**:
- next@15+
- react@19+
- convex
- @anthropic-ai/sdk
- openai
- stripe
- googleapis
- react-flow-renderer (for mind maps)
- tailwindcss
- typescript
- And ~30 more dependencies

**Verify**:
```bash
npm list
```

---

### ☐ 2. Set Up Environment Variables

**Location**: `.env.local`

**Required Variables** (copy from `.env.example`):

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment-name
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxx

# OpenAI DALL-E
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gmail API
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REDIRECT_URI=http://localhost:3000/api/email/oauth/callback
GMAIL_AUTHORIZED_EMAIL=contact@unite-group.in

# Stripe (EXISTING - already configured)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_1SSi0JBY5KEPMwxd1TfAWQER
STRIPE_PRICE_ID_PROFESSIONAL=price_1SSi0YBY5KEPMwxdrnA0r5cP
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth
NEXTAUTH_SECRET=generate-random-32-char-string
NEXTAUTH_URL=http://localhost:3000

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=generate-random-32-char-string
```

**How to get each**:
- See `ENVIRONMENT_VARIABLES_GUIDE.md` for detailed instructions

**Generate secrets**:
```bash
# For NEXTAUTH_SECRET and JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### ☐ 3. Set Up Convex Database

**Initialize Convex**:
```bash
npx convex dev
```

**This will**:
1. Create a new Convex deployment (if needed)
2. Deploy the schema (15 tables)
3. Deploy all functions (120+ queries/mutations/actions)
4. Start local development server
5. Update `.env.local` with CONVEX_URL

**Verify Tables Created**:
Visit https://dashboard.convex.dev and check:
- ✓ organizations
- ✓ subscriptions
- ✓ clients
- ✓ clientEmails
- ✓ clientContactInfo
- ✓ clientAssets
- ✓ emailThreads
- ✓ autoReplies
- ✓ personas
- ✓ mindMaps
- ✓ marketingStrategies
- ✓ socialCampaigns
- ✓ hooksScripts
- ✓ imageConcepts
- ✓ usageTracking

---

### ☐ 4. Configure Gmail API

**Follow**: `GMAIL_SETUP_GUIDE.md`

**Steps**:
1. ☐ Go to Google Cloud Console
2. ☐ Create new project "Unite-Hub CRM"
3. ☐ Enable Gmail API
4. ☐ Create OAuth 2.0 credentials
5. ☐ Add authorized redirect URI
6. ☐ Configure consent screen
7. ☐ Set up push notifications (Pub/Sub)
8. ☐ Test OAuth flow locally

**Test**:
```bash
curl http://localhost:3000/api/email/oauth/authorize
```

---

### ☐ 5. Configure Stripe (Already Done ✓)

**Verify existing configuration**:
- ✓ Starter: $249 AUD/month
- ✓ Professional: $549 AUD/month
- ✓ Webhook configured
- ✓ Test mode working

**Test**:
```bash
# Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test checkout
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_1SSi0JBY5KEPMwxd1TfAWQER","orgId":"test"}'
```

---

### ☐ 6. Configure DALL-E API

**Follow**: `DALLE_SETUP_GUIDE.md`

**Steps**:
1. ☐ Create OpenAI account
2. ☐ Go to https://platform.openai.com/api-keys
3. ☐ Create new API key
4. ☐ Add to `.env.local` as OPENAI_API_KEY
5. ☐ Set up billing (add payment method)
6. ☐ Set spending limits ($50/month recommended)

**Test**:
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId":"test",
    "conceptType":"social_post",
    "platform":"instagram",
    "description":"Modern coffee shop interior"
  }'
```

---

### ☐ 7. Local Testing

**Follow**: `LOCAL_TESTING_GUIDE.md`

**Test Email Flow**:
```bash
# 1. Start dev server
npm run dev

# 2. Send test email to contact@unite-group.in

# 3. Check auto-reply received

# 4. Verify email in portal
```

**Test AI Features**:
```bash
# Test auto-reply generation
curl -X POST http://localhost:3000/api/ai/auto-reply \
  -H "Content-Type: application/json" \
  -d '{"emailContent":"I want to start a coffee shop"}'

# Test persona generation
curl -X POST http://localhost:3000/api/ai/persona \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","emails":["email1","email2"]}'
```

**Test DALL-E**:
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","conceptType":"social_post"}'
```

**Test Stripe**:
```bash
# Use test card: 4242 4242 4242 4242
# Visit: http://localhost:3000/onboarding/step-2-payment
```

---

### ☐ 8. Create Duncan Test Account

**Follow**: `DUNCAN_ONBOARDING_GUIDE.md`

**Steps**:
1. ☐ Visit http://localhost:3000/signup
2. ☐ Create account for Duncan
   - Name: Duncan [Last Name]
   - Email: duncan@teahouse.com (or similar)
   - Business: [Duncan's Business Name]
3. ☐ Complete onboarding:
   - Select package (Professional for full features)
   - Use Stripe test card: 4242 4242 4242 4242
   - Upload test assets (logo, photos)
   - Add contact info
4. ☐ Test email flow:
   - Email idea to contact@unite-group.in
   - Verify auto-reply received
   - Check portal updates
5. ☐ Verify all features:
   - ✓ Email appears in portal
   - ✓ Mind map updates
   - ✓ Persona generates
   - ✓ Strategy creates
   - ✓ Campaigns populate
   - ✓ Hooks generate
   - ✓ Images create

---

## PRODUCTION DEPLOYMENT CHECKLIST

### ☐ 9. Prepare for Production

**Update Environment Variables for Production**:
```env
# Convex Production
CONVEX_DEPLOYMENT=prod-unite-hub
CONVEX_URL=https://prod-unite-hub.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://prod-unite-hub.convex.cloud

# Gmail Production
GMAIL_REDIRECT_URI=https://yourdomain.com/api/email/oauth/callback

# Stripe LIVE Mode (when ready)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxxxxx

# NextAuth Production
NEXTAUTH_URL=https://yourdomain.com

# Application Production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Generate New Production Secrets**:
```bash
# New NEXTAUTH_SECRET for production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# New JWT_SECRET for production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### ☐ 10. Deploy Convex to Production

```bash
# Deploy production Convex
npx convex deploy --prod

# Verify deployment
npx convex dashboard --prod
```

**Check**:
- ✓ All 15 tables created
- ✓ All functions deployed
- ✓ No errors in logs

---

### ☐ 11. Deploy to Vercel

**Follow**: `DEPLOYMENT_GUIDE.md`

**Steps**:
1. ☐ Push to GitHub (already done on AI-POWERED branch)
   ```bash
   git status
   git add .
   git commit -m "Production deployment"
   git push origin AI-POWERED
   ```

2. ☐ Go to https://vercel.com/dashboard
3. ☐ Click "Add New Project"
4. ☐ Import from GitHub: CleanExpo/Unite-Hub
5. ☐ Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

6. ☐ Add Environment Variables (copy all from `.env.local`)
7. ☐ Deploy

**Expected deployment time**: 2-5 minutes

---

### ☐ 12. Configure Custom Domain (Optional)

**In Vercel**:
1. ☐ Go to Project Settings → Domains
2. ☐ Add custom domain (e.g., app.unite-group.in)
3. ☐ Update DNS records at domain registrar
4. ☐ Wait for SSL certificate (automatic)

**Update Environment Variables**:
```env
NEXT_PUBLIC_APP_URL=https://app.unite-group.in
NEXTAUTH_URL=https://app.unite-group.in
GMAIL_REDIRECT_URI=https://app.unite-group.in/api/email/oauth/callback
```

**Redeploy** after updating env vars.

---

### ☐ 13. Configure Production Webhooks

**Stripe Live Mode**:
1. ☐ Go to Stripe Dashboard → Developers → Webhooks
2. ☐ Add endpoint: https://yourdomain.com/api/stripe/webhook
3. ☐ Select events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
   - checkout.session.completed
4. ☐ Copy webhook signing secret
5. ☐ Add to Vercel env: STRIPE_WEBHOOK_SECRET

**Gmail Push Notifications**:
1. ☐ Update Pub/Sub topic to production endpoint
2. ☐ Verify webhook URL: https://yourdomain.com/api/email/webhook

---

### ☐ 14. Production Testing

**Test All Critical Flows**:

1. ☐ **User Signup & Onboarding**
   - Create new account
   - Complete payment (use real card in test mode first)
   - Upload assets
   - Complete setup

2. ☐ **Email Ingestion**
   - Send email to contact@unite-group.in
   - Verify auto-reply received within 5 seconds
   - Check email appears in portal
   - Verify attachments stored correctly

3. ☐ **AI Generation**
   - Check persona generates
   - Verify mind map updates
   - Confirm strategy creates
   - Test campaign generation
   - Generate hooks
   - Create DALL-E images

4. ☐ **Subscription Management**
   - Test upgrade flow
   - Test downgrade flow
   - Verify billing portal access
   - Check invoice generation

5. ☐ **Portal Features**
   - Test all 16 pages load
   - Verify data displays correctly
   - Check real-time updates
   - Test export functions
   - Verify tier-based feature access

---

### ☐ 15. Security Verification

**Check**:
- ✓ All API routes have authentication
- ✓ Webhook signatures verified (Stripe, Gmail)
- ✓ Environment variables not exposed in client
- ✓ HTTPS enforced in production
- ✓ Rate limiting configured
- ✓ CORS properly configured
- ✓ Input validation on all endpoints
- ✓ SQL injection prevention (using Convex ORM)
- ✓ XSS prevention (React escaping)

**Security Audit**:
```bash
# Check for exposed secrets
git log --all --full-history -- "*env*"

# Scan for hardcoded secrets
grep -r "sk_live_\|sk-ant-\|GOCSPX-" src/
```

---

### ☐ 16. Performance Optimization

**Verify**:
- ✓ Database indexes created
- ✓ Image optimization enabled
- ✓ Pagination implemented
- ✓ Caching configured
- ✓ Bundle size optimized

**Test Performance**:
```bash
# Build production
npm run build

# Check bundle size
npm run build -- --profile

# Test lighthouse score
npx lighthouse https://yourdomain.com
```

**Targets**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

---

### ☐ 17. Monitoring & Analytics

**Set Up Error Tracking**:
1. ☐ Create Sentry account
2. ☐ Add Sentry to project
3. ☐ Configure error boundaries
4. ☐ Test error reporting

**Set Up Analytics** (Optional):
1. ☐ Google Analytics
2. ☐ PostHog (product analytics)
3. ☐ LogRocket (session replay)

**Convex Logs**:
- Monitor: https://dashboard.convex.dev/logs

**Vercel Analytics**:
- Monitor: https://vercel.com/[project]/analytics

---

### ☐ 18. Backup Strategy

**Convex Backups**:
- ✓ Automatic backups by Convex
- ☐ Set up export schedule (optional)

**Environment Variables**:
- ☐ Save securely in password manager
- ☐ Document in secure location (not Git)

**Stripe Data**:
- ☐ Export customer data monthly
- ☐ Save invoices

---

### ☐ 19. Documentation for Team

**Create**:
1. ☐ User onboarding guide for clients
2. ☐ Admin manual for operations
3. ☐ API documentation (if exposing APIs)
4. ☐ Troubleshooting runbook
5. ☐ Incident response plan

**Update**:
- ☐ README.md with production URLs
- ☐ Architecture diagram with production services
- ☐ Deployment instructions

---

### ☐ 20. Go Live Checklist

**Final Checks Before Launch**:
- ☐ All tests passing
- ☐ No console errors in production
- ☐ All environment variables set
- ☐ SSL certificate active
- ☐ Custom domain configured (if applicable)
- ☐ Webhooks configured and tested
- ☐ Email sending working
- ☐ Payment processing working
- ☐ AI features functioning
- ☐ Image generation working
- ☐ All documentation complete
- ☐ Team trained (if applicable)
- ☐ Support channels ready
- ☐ Monitoring active

**Launch**:
1. ☐ Announce to team
2. ☐ Create first production client (Duncan)
3. ☐ Monitor logs for 24 hours
4. ☐ Verify all workflows
5. ☐ Collect initial feedback
6. ☐ Fix any issues immediately

---

## POST-DEPLOYMENT MONITORING

### First 24 Hours
- ☐ Monitor error logs every 2 hours
- ☐ Check Stripe webhooks processing
- ☐ Verify emails being received
- ☐ Monitor AI API usage
- ☐ Check DALL-E generation success rate
- ☐ Track user signups

### First Week
- ☐ Daily log review
- ☐ Performance monitoring
- ☐ User feedback collection
- ☐ API cost tracking
- ☐ Database performance review

### Ongoing
- ☐ Weekly analytics review
- ☐ Monthly cost analysis
- ☐ Quarterly security audit
- ☐ Regular dependency updates

---

## TROUBLESHOOTING COMMON ISSUES

### Email Not Arriving
**Check**:
1. Gmail webhook configured correctly
2. Pub/Sub topic active
3. API endpoint responding (200 OK)
4. Email address linked to client account

### Auto-Reply Not Sending
**Check**:
1. Claude API key valid
2. Gmail send permissions granted
3. Auto-reply function executing
4. Error logs in Convex

### Stripe Webhook Failing
**Check**:
1. Webhook signature secret correct
2. Endpoint returning 200
3. Stripe test mode vs live mode
4. Event types subscribed

### DALL-E Not Generating
**Check**:
1. OpenAI API key valid
2. Billing enabled
3. Usage limits not exceeded
4. Content policy compliance

### Build Failures
**Check**:
1. All dependencies installed
2. TypeScript compilation passing
3. Environment variables set
4. Convex deployed

---

## SUPPORT RESOURCES

**Convex**:
- Dashboard: https://dashboard.convex.dev
- Docs: https://docs.convex.dev
- Discord: https://convex.dev/community

**Stripe**:
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

**Vercel**:
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Gmail API**:
- Console: https://console.cloud.google.com
- Docs: https://developers.google.com/gmail/api
- Support: https://support.google.com

**OpenAI**:
- Dashboard: https://platform.openai.com
- Docs: https://platform.openai.com/docs
- Support: https://help.openai.com

---

## COST ESTIMATION (Monthly)

**Services**:
- Convex: ~$25/month (Starter plan)
- Vercel: Free (Hobby) or $20/month (Pro)
- Stripe: 2.9% + $0.30 per transaction
- Claude AI: ~$15-30/month (varies by usage)
- DALL-E: ~$20-40/month (varies by usage)
- Gmail API: Free
- Cloud Storage: ~$5-10/month

**Total Estimated**: $65-125/month

**Per Client Revenue**:
- Starter: $249/month
- Professional: $549/month

**Break-even**: 1 client

---

## SUCCESS METRICS

**Track**:
- Client signups per week
- Email response rate
- AI generation success rate
- User engagement (logins per week)
- Feature usage by tier
- Customer satisfaction (NPS)
- Churn rate
- Monthly recurring revenue (MRR)

**Targets** (First Month):
- 5+ client signups
- < 5% error rate
- 95%+ email delivery
- 90%+ AI success rate
- < 5% churn

---

## CONGRATULATIONS! 🎉

You're ready to deploy **Unite-Hub CRM** to production!

Follow this checklist step-by-step and you'll have a fully functional, production-ready AI-powered marketing CRM system.

**Good luck!** 🚀

---

**Last Updated**: 2025-01-13
**Version**: 1.0
**Branch**: AI-POWERED
