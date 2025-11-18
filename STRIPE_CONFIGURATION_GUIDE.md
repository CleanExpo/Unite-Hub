# Stripe Configuration Guide for Unite-Hub

## Overview

Unite-Hub uses Stripe for subscription billing with two plans:
- **Starter**: $249 AUD/month (1 client account)
- **Professional**: $549 AUD/month (5 client accounts)

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...           # Get from Stripe Dashboard → Developers → API Keys
STRIPE_PRICE_ID_STARTER=price_...       # Created in Step 3 below
STRIPE_PRICE_ID_PROFESSIONAL=price_...  # Created in Step 3 below
STRIPE_WEBHOOK_SECRET=whsec_...         # Created in Step 4 below
```

## Setup Steps

### Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a Stripe account
3. Complete business verification (required for live mode)
4. Switch to **Test mode** for development

### Step 2: Get API Keys

1. Go to: **Stripe Dashboard** → **Developers** → **API Keys**
2. Copy **Secret key** (starts with `sk_test_...` in test mode)
3. Add to `.env.local` as `STRIPE_SECRET_KEY`

### Step 3: Create Products and Prices

#### Create Starter Plan

1. Go to: **Stripe Dashboard** → **Products** → **Add product**
2. Fill in:
   - **Name**: Unite-Hub Starter
   - **Description**: 1 Client Account, Basic features
   - **Pricing model**: Standard pricing
   - **Price**: 249.00
   - **Currency**: AUD (Australian Dollar)
   - **Billing period**: Monthly
3. Click **Add product**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env.local` as `STRIPE_PRICE_ID_STARTER`

#### Create Professional Plan

1. Go to: **Stripe Dashboard** → **Products** → **Add product**
2. Fill in:
   - **Name**: Unite-Hub Professional
   - **Description**: 5 Client Accounts, Advanced features, Priority support
   - **Pricing model**: Standard pricing
   - **Price**: 549.00
   - **Currency**: AUD (Australian Dollar)
   - **Billing period**: Monthly
3. Click **Add product**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env.local` as `STRIPE_PRICE_ID_PROFESSIONAL`

### Step 4: Configure Webhooks

Webhooks allow Stripe to notify Unite-Hub when subscriptions change.

#### For Local Development (Using Stripe CLI)

1. **Install Stripe CLI**:
   ```bash
   # macOS (Homebrew)
   brew install stripe/stripe-cli/stripe

   # Windows (Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to http://localhost:3008/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_...`)
5. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### For Production (Vercel/Deployed App)

1. Go to: **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
   - **Description**: Unite-Hub Production Webhook
   - **Events to send**: Select these events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.created`
     - `payment_intent.succeeded`
4. Click **Add endpoint**
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Step 5: Configure Customer Portal

The Customer Portal allows users to manage their subscriptions.

1. Go to: **Stripe Dashboard** → **Settings** → **Customer portal**
2. Enable **Customer portal**
3. Configure settings:
   - **Business name**: Unite-Hub
   - **Support email**: support@unite-hub.com
   - **Privacy policy**: https://unite-hub.com/privacy
   - **Terms of service**: https://unite-hub.com/terms
4. **Features**:
   - ✅ Update payment method
   - ✅ Update billing information
   - ✅ View invoices
   - ✅ Cancel subscription (at end of period)
   - ✅ Switch plans
5. Click **Save**

### Step 6: Test the Integration

#### Test Checkout Flow

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3008/dashboard/billing`
3. Click **Upgrade to Starter** or **Upgrade to Professional**
4. Use Stripe test card: **4242 4242 4242 4242**
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete checkout
6. Verify subscription created in Stripe Dashboard

#### Test Webhook Events

1. Ensure `stripe listen` is running
2. Trigger events in Stripe Dashboard (e.g., pause subscription)
3. Check console for webhook events
4. Verify database updated correctly

### Step 7: Production Checklist

Before going live:

- [ ] Switch Stripe account to **Live mode**
- [ ] Update `.env.production` with live API keys
- [ ] Create live products and prices
- [ ] Configure production webhook endpoint
- [ ] Test live payment with real card (then refund)
- [ ] Enable Radar for fraud detection
- [ ] Set up email receipts
- [ ] Configure tax settings (if applicable)
- [ ] Enable 3D Secure (Recommended)

## Environment Variable Summary

```env
# Development (.env.local)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PRICE_ID_STARTER=price_1234abcd...
STRIPE_PRICE_ID_PROFESSIONAL=price_5678efgh...
STRIPE_WEBHOOK_SECRET=whsec_local...

# Production (Vercel Environment Variables)
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_PRICE_ID_STARTER=price_live_1234abcd...
STRIPE_PRICE_ID_PROFESSIONAL=price_live_5678efgh...
STRIPE_WEBHOOK_SECRET=whsec_prod...
```

## Plan Features Breakdown

### Starter Plan ($249 AUD/month)
- ✅ 1 Client Account
- ✅ Basic email processing
- ✅ Single persona generation
- ✅ Basic mind mapping
- ✅ Standard marketing strategy
- ✅ Single platform campaigns
- ❌ Hooks library
- ❌ AI image generation
- ❌ Priority support

### Professional Plan ($549 AUD/month)
- ✅ 5 Client Accounts
- ✅ Advanced email processing
- ✅ Multi-persona generation
- ✅ Advanced mind mapping with auto-expansion
- ✅ Comprehensive marketing strategy
- ✅ Multi-platform campaigns
- ✅ Hooks library access
- ✅ AI image generation (DALL-E)
- ✅ Priority support

## Troubleshooting

### "STRIPE_SECRET_KEY is required" Error

**Problem**: Environment variable not loaded

**Solution**:
1. Verify `.env.local` exists in project root
2. Restart dev server: `npm run dev`
3. Check spelling: `STRIPE_SECRET_KEY` (exact case)

### "Price ID not found" Error

**Problem**: Invalid price ID

**Solution**:
1. Verify price exists in Stripe Dashboard → Products
2. Check mode (test vs live) matches
3. Copy price ID exactly (starts with `price_`)

### Webhooks Not Firing

**Problem**: Webhook not configured correctly

**Solution**:
1. Ensure `stripe listen` is running (local)
2. Verify endpoint URL is correct (production)
3. Check webhook events are enabled
4. Look for errors in Stripe Dashboard → Developers → Events

### "Customer not found" Error

**Problem**: Customer ID mismatch

**Solution**:
1. Check `organizations.stripe_customer_id` in database
2. Verify customer exists in Stripe Dashboard → Customers
3. Re-create customer if needed

## Testing Cards

Use these test cards in Stripe test mode:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

## API Routes

Unite-Hub Stripe integration uses these API routes:

- `POST /api/stripe/create-checkout-session` - Start subscription
- `POST /api/stripe/create-portal-session` - Manage subscription
- `POST /api/stripe/webhook` - Handle Stripe events
- `GET /api/subscription/status` - Check subscription status
- `POST /api/subscription/upgrade` - Upgrade plan
- `POST /api/subscription/downgrade` - Downgrade plan
- `POST /api/subscription/cancel` - Cancel subscription

## Database Schema

Subscription data stored in `subscriptions` table:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  plan_tier TEXT CHECK (plan_tier IN ('starter', 'professional')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Unite-Hub Support**: support@unite-hub.com

---

**Last Updated**: 2025-01-18
**Stripe API Version**: 2024-11-20.acacia
