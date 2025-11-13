# Unite-Hub CRM - Documentation Index

Complete documentation for setting up, testing, and deploying Unite-Hub CRM.

## Quick Start

1. **Environment Setup**: Read `ENVIRONMENT_VARIABLES_GUIDE.md` first
2. **Service Setup**: Follow individual setup guides (Gmail, Stripe, DALL-E)
3. **Local Testing**: Follow `LOCAL_TESTING_GUIDE.md`
4. **Test with Duncan**: Follow `DUNCAN_ONBOARDING_GUIDE.md`
5. **Deploy**: Follow `DEPLOYMENT_GUIDE.md`

---

## Complete Documentation

### 1. Environment Configuration

**[ENVIRONMENT_VARIABLES_GUIDE.md](./ENVIRONMENT_VARIABLES_GUIDE.md)**
- Complete list of all required environment variables
- Where to get each value (with links)
- Example values (safe)
- Security considerations
- Vercel environment setup
- Local development setup

**When to use:** Start here first to understand all required configuration

---

### 2. Service Setup Guides

**[GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)**
- Step-by-step Gmail API setup
- OAuth 2.0 configuration
- Enable Gmail API in Google Cloud Console
- Create OAuth credentials
- Configure webhook for contact@unite-group.in
- Set up push notifications
- Test email ingestion
- Troubleshooting section

**When to use:** Before integrating email functionality

---

**[STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)**
- Stripe account setup
- Create products (Starter: $249, Professional: $549 AUD/month)
- Create prices and price IDs
- Configure webhooks
- Test mode vs live mode
- Test payment flow
- Handle subscription lifecycle
- Customer portal setup

**When to use:** Before accepting payments and subscriptions

---

**[DALLE_SETUP_GUIDE.md](./DALLE_SETUP_GUIDE.md)**
- OpenAI account setup
- Get OpenAI API key
- Configure DALL-E 3 access
- Set up billing and budget limits
- Test image generation
- Cost management tips
- Rate limiting considerations
- Content policy guidelines

**When to use:** Before implementing AI image generation features

---

### 3. Testing & Validation

**[LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md)**
- How to test email ingestion locally
- How to test auto-reply generation
- How to test Claude integration
- How to test DALL-E generation
- How to test Stripe billing
- How to test webhooks with Stripe CLI
- Mock data setup
- Complete testing checklist

**When to use:** Before deploying to production, to ensure everything works

---

**[DUNCAN_ONBOARDING_GUIDE.md](./DUNCAN_ONBOARDING_GUIDE.md)**
- Step-by-step to create Duncan's test account
- How to give Duncan email instructions
- Test the full end-to-end flow:
  - Duncan emails idea to contact@unite-group.in
  - Auto-reply received
  - Email appears in portal
  - Mind map updates
  - Persona generates
  - Strategy creates
- Complete verification checklist

**When to use:** Final validation test with a real user before going live

---

### 4. Deployment

**[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
- Vercel deployment steps
- Environment variable setup in Vercel
- Convex production deployment
- Domain configuration and DNS setup
- SSL certificate setup
- Production checklist
- Post-deployment testing
- Monitoring and alerts setup
- Rollback plan

**When to use:** When ready to deploy to production

---

## Additional Documentation

**[ARCHITECTURE.md](./ARCHITECTURE.md)** (if exists)
- System architecture overview
- Technology stack
- Database schema
- API structure

**[.env.example](./.env.example)**
- Template for environment variables
- Includes comments and example values
- Reference for all required variables

---

## Setup Workflow

### For First-Time Setup:

```
1. Clone repository
   ↓
2. Read ENVIRONMENT_VARIABLES_GUIDE.md
   ↓
3. Create .env.local from .env.example
   ↓
4. Follow GMAIL_SETUP_GUIDE.md
   ↓
5. Follow STRIPE_SETUP_GUIDE.md
   ↓
6. Follow DALLE_SETUP_GUIDE.md
   ↓
7. Install dependencies: npm install
   ↓
8. Start Convex: npx convex dev
   ↓
9. Start Next.js: npm run dev
   ↓
10. Follow LOCAL_TESTING_GUIDE.md
   ↓
11. Follow DUNCAN_ONBOARDING_GUIDE.md
   ↓
12. Follow DEPLOYMENT_GUIDE.md
   ↓
13. Production Launch! 🚀
```

### For Development:

```
1. git pull latest changes
   ↓
2. npm install (if dependencies changed)
   ↓
3. Update .env.local (if new variables)
   ↓
4. npx convex dev (Terminal 1)
   ↓
5. npm run dev (Terminal 2)
   ↓
6. Start developing!
```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev                    # Start Next.js dev server
npx convex dev                 # Start Convex in dev mode
npm run email-agent            # Run email processing agent
npm run content-agent          # Run content generation agent
npm run orchestrator           # Run orchestrator agent

# Testing
stripe listen --forward-to localhost:3008/api/webhooks/stripe
curl -X POST http://localhost:3008/api/integrations/gmail/sync

# Deployment
npx convex deploy --prod       # Deploy Convex to production
vercel --prod                  # Deploy Next.js to Vercel
```

### Important URLs

**Development:**
- App: http://localhost:3008
- Convex Dashboard: https://dashboard.convex.dev
- Stripe Dashboard: https://dashboard.stripe.com/test
- Gmail Setup: https://console.cloud.google.com
- OpenAI Platform: https://platform.openai.com

**Production:**
- Your Domain: https://your-domain.com
- Vercel Dashboard: https://vercel.com/dashboard
- Convex Production: https://dashboard.convex.dev (switch to Production)
- Stripe Live Mode: https://dashboard.stripe.com/live

---

## Documentation Features

Each guide includes:
- ✅ Step-by-step instructions
- ✅ Screenshots and examples where helpful
- ✅ Code snippets with explanations
- ✅ Troubleshooting sections
- ✅ Security best practices
- ✅ Verification checklists
- ✅ Common errors and solutions
- ✅ Links to external resources

---

## Getting Help

### For Setup Issues:
1. Check the relevant setup guide (Gmail, Stripe, DALL-E)
2. Review the troubleshooting section
3. Check environment variables are correct
4. Review application logs

### For Testing Issues:
1. Follow LOCAL_TESTING_GUIDE.md step by step
2. Check each test passes individually
3. Review Convex dashboard for data
4. Check Stripe CLI for webhook logs

### For Deployment Issues:
1. Review DEPLOYMENT_GUIDE.md troubleshooting section
2. Check Vercel deployment logs
3. Verify all environment variables in production
4. Test each service independently

### Contact Support:
- Email: contact@unite-group.in
- Include: Error messages, logs, steps to reproduce

---

## Contributing

When adding new features:
1. Update relevant guide(s) with new setup steps
2. Add new environment variables to ENVIRONMENT_VARIABLES_GUIDE.md
3. Update .env.example with new variables
4. Add testing steps to LOCAL_TESTING_GUIDE.md
5. Update DEPLOYMENT_GUIDE.md if deployment changes

---

## Document Updates

**Last Updated:** 2025-11-13

**Documentation Version:** 1.0

**Application Version:** 1.0.0

---

## License

All documentation is part of Unite-Hub CRM and follows the same license as the main application.

---

## Next Steps

Ready to get started?

1. **First time?** → Start with `ENVIRONMENT_VARIABLES_GUIDE.md`
2. **Setting up services?** → Choose the relevant setup guide (Gmail, Stripe, or DALL-E)
3. **Ready to test?** → Follow `LOCAL_TESTING_GUIDE.md`
4. **Need end-to-end test?** → Follow `DUNCAN_ONBOARDING_GUIDE.md`
5. **Ready for production?** → Follow `DEPLOYMENT_GUIDE.md`

**Happy building!** 🚀
