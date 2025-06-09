# Production Environment Variables Update Guide

## Steps to Update Vercel Environment Variables

### 1. Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your Unite Group project
3. Navigate to Settings → Environment Variables

### 2. Required Environment Variables to Update/Verify

#### Core Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Already set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Already set
- `SUPABASE_SERVICE_ROLE_KEY`: Already set

#### Stripe Configuration (CRITICAL - Fix Required)
- `STRIPE_SECRET_KEY`: Must start with `sk_live_` for production
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Must start with `pk_live_` for production
- `STRIPE_WEBHOOK_SECRET`: Must start with `whsec_`

#### Email Service
- `RESEND_API_KEY`: Required for email functionality

#### Redis Configuration (Optional)
- `REDIS_HOST`: Your Redis host
- `REDIS_PORT`: 6379
- `REDIS_PASSWORD`: Your Redis password
- `REDIS_DB`: 0

#### Application Configuration
- `NEXT_PUBLIC_SITE_URL`: https://unitegroup.vercel.app
- `NEXT_PUBLIC_APP_NAME`: Unite Group
- `NEXT_PUBLIC_APP_VERSION`: 14.0
- `NEXT_PUBLIC_CURRENCY`: aud
- `NEXT_PUBLIC_CONSULTATION_PRICE`: 55000

#### Security
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: https://unitegroup.vercel.app

#### AI Services (Optional but Recommended)
- `OPENAI_API_KEY`: For AI monitoring features
- `ANTHROPIC_API_KEY`: For advanced AI capabilities
- `AZURE_OPENAI_API_KEY`: For Azure AI services
- `AZURE_OPENAI_ENDPOINT`: Your Azure endpoint
- `GOOGLE_AI_API_KEY`: For Google AI services

#### Monitoring (Optional)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics
- `SENTRY_DSN`: Error tracking
- `SENTRY_AUTH_TOKEN`: Sentry authentication

### 3. Environment Variable Scopes
Set variables for:
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. After Updating Variables
1. Trigger a new deployment from Vercel dashboard
2. Monitor the deployment logs for any errors
3. Test all integrations after deployment

## Stripe Configuration Fix

The current Stripe configuration is using test keys in production. This needs immediate attention:

### Steps to Fix:
1. Log into Stripe Dashboard (https://dashboard.stripe.com)
2. Switch to Live mode (toggle in top right)
3. Go to Developers → API keys
4. Copy the live keys:
   - Publishable key (starts with `pk_live_`)
   - Secret key (starts with `sk_live_`)
5. Set up webhook endpoint:
   - Go to Developers → Webhooks
   - Add endpoint: `https://unitegroup.vercel.app/api/stripe/webhook`
   - Select events to listen for
   - Copy the webhook secret (starts with `whsec_`)
6. Update these in Vercel environment variables

## Verification Steps
After updating:
1. Check `/api/health` endpoint
2. Test Stripe payment flow
3. Verify email sending
4. Check AI dashboard at `/dashboard/ai`
5. Monitor error logs in Vercel dashboard
