# Unite-Hub Setup Checklist

Follow this checklist to complete the setup of your Unite-Hub application with Supabase and Stripe integration.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed (optional)

## 1. Database Setup (Supabase)

### Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Create a new account or sign in
- [ ] Create a new project
- [ ] Wait for project initialization (usually 2-3 minutes)

### Get Credentials
- [ ] Navigate to Project Settings > API
- [ ] Copy the following values:
  - [ ] Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
  - [ ] anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - [ ] service_role key (`SUPABASE_SERVICE_ROLE_KEY`)

### Apply Database Schema
- [ ] Go to Supabase Dashboard > SQL Editor
- [ ] Create a new query
- [ ] Copy contents from `supabase/migrations/001_initial_schema.sql`
- [ ] Paste and run the migration
- [ ] Verify all tables were created (check Table Editor)

### Configure Environment
- [ ] Update `.env.local` with your Supabase credentials
- [ ] Ensure all three Supabase variables are set

## 2. Authentication Setup (NextAuth)

### Google OAuth (Optional)
- [ ] Go to https://console.cloud.google.com
- [ ] Create a new project or select existing
- [ ] Enable Google+ API
- [ ] Go to Credentials > Create Credentials > OAuth 2.0 Client ID
- [ ] Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
- [ ] Copy Client ID and Secret to `.env.local`

### Email Provider (Optional)
- [ ] Set up SMTP server or use Gmail
- [ ] For Gmail:
  - [ ] Enable 2-factor authentication
  - [ ] Generate app-specific password
  - [ ] Add credentials to `.env.local`

### NextAuth Secret
- [ ] Generate secret: `openssl rand -base64 32`
- [ ] Add to `.env.local` as `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL=http://localhost:3001`

## 3. Payment Setup (Stripe)

### Create Stripe Account
- [ ] Go to https://stripe.com
- [ ] Create account or sign in
- [ ] Switch to Test Mode (toggle in top right)

### Get API Keys
- [ ] Navigate to Developers > API keys
- [ ] Copy Publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Copy Secret key (`STRIPE_SECRET_KEY`)
- [ ] Add both to `.env.local`

### Create Products
#### Starter Plan
- [ ] Go to Products > Add product
- [ ] Name: "Starter"
- [ ] Add price: $99.00 monthly
- [ ] Add metadata: `plan = starter`
- [ ] Copy Price ID to `.env.local` as `STRIPE_PRICE_ID_STARTER`

#### Professional Plan
- [ ] Go to Products > Add product
- [ ] Name: "Professional"
- [ ] Add price: $299.00 monthly
- [ ] Add metadata: `plan = professional`
- [ ] Copy Price ID to `.env.local` as `STRIPE_PRICE_ID_PROFESSIONAL`

### Set Up Webhooks (Development)
- [ ] Install Stripe CLI: https://stripe.com/docs/stripe-cli
- [ ] Run: `stripe login`
- [ ] Run: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
- [ ] Copy webhook signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Set Up Webhooks (Production)
- [ ] Go to Developers > Webhooks
- [ ] Add endpoint: `https://your-domain.com/api/webhooks/stripe`
- [ ] Select events:
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.paid`
- [ ] Copy signing secret to production environment variables

## 4. Application Setup

### Install Dependencies
- [ ] Run: `npm install`
- [ ] Verify no errors in installation

### Environment Variables
- [ ] Verify `.env.local` has all required variables (see below)
- [ ] Never commit `.env.local` to version control
- [ ] Ensure `.env.local` is in `.gitignore`

### Start Development Server
- [ ] Run: `npm run dev`
- [ ] Verify server starts on port 3000 or 3001
- [ ] Check for any errors in console

## 5. Testing

### Test Database Connection
- [ ] Navigate to `http://localhost:3001`
- [ ] Check browser console for errors
- [ ] Try creating a test organization via API

### Test Authentication
- [ ] Navigate to `/auth/signin`
- [ ] Try Google sign-in (if configured)
- [ ] Try email sign-in (if configured)

### Test Stripe Integration
- [ ] Navigate to pricing page
- [ ] Click "Subscribe" on a plan
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Verify checkout session is created
- [ ] Check Stripe Dashboard for payment

### Test Webhooks
- [ ] Complete a test subscription
- [ ] Check Supabase for organization update
- [ ] Verify audit log was created

## 6. Production Deployment

### Environment Variables
- [ ] Add all environment variables to production host
- [ ] Update `NEXT_PUBLIC_URL` to production domain
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Use production Stripe keys (not test mode)

### Stripe Webhook
- [ ] Create production webhook endpoint in Stripe
- [ ] Add production domain
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret

### OAuth Redirect URIs
- [ ] Add production callback URLs to Google Console
- [ ] Format: `https://your-domain.com/api/auth/callback/google`

### Database
- [ ] Verify Row Level Security policies are appropriate
- [ ] Consider upgrading Supabase plan if needed
- [ ] Set up database backups

## Required Environment Variables

Create a `.env.local` file with these variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)

# Email (optional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@unite-hub.io

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public_key
STRIPE_PRICE_ID_STARTER=price_1234567890
STRIPE_PRICE_ID_PROFESSIONAL=price_0987654321
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application
NEXT_PUBLIC_URL=http://localhost:3001

# AI Agents (Optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Gmail Integration (Optional)
GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
```

## Troubleshooting

### Database Connection Fails
- Verify Supabase project is not paused
- Check that credentials are correct
- Ensure you're using service role key for server-side operations

### Authentication Issues
- Verify OAuth redirect URIs match exactly
- Check NextAuth secret is set
- Ensure cookies are enabled in browser

### Stripe Checkout Fails
- Verify you're in test mode for development
- Check price IDs match your Stripe products
- Ensure webhook secret is correct

### Webhook Not Receiving Events
- For local dev, ensure Stripe CLI is running
- Check webhook endpoint is publicly accessible (production)
- Verify selected events in Stripe dashboard

## Next Steps

After completing the checklist:
1. Customize Row Level Security policies for your needs
2. Build out dashboard UI components
3. Implement user-organization relationship management
4. Add team member invitation system
5. Create email templates for authentication
6. Set up monitoring and error tracking
7. Configure CI/CD for deployments

## Support

- [Integration Guide](./docs/INTEGRATION_GUIDE.md) - Detailed technical documentation
- [Supabase Setup](./supabase/README.md) - Database-specific instructions
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
