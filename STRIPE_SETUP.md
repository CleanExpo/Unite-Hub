# Stripe Integration Setup Guide

## Prerequisites

1. **Stripe Account**: Sign up at https://stripe.com
2. **Stripe CLI**: Install from https://stripe.com/docs/stripe-cli

## Installation

### Windows (Scoop)
```bash
scoop install stripe
```

### Windows (Manual)
1. Download from https://github.com/stripe/stripe-cli/releases/latest
2. Extract and add to PATH

## Setup Steps

### 1. Get Your Stripe API Keys

Go to: https://dashboard.stripe.com/test/apikeys

You need:
- **Publishable Key** (starts with `pk_test_`)
- **Secret Key** (starts with `sk_test_`)

### 2. Update .env.local

Replace the placeholder values in your `.env.local`:

```env
# Replace these with your real Stripe keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Create price IDs in Stripe Dashboard → Products
STRIPE_PRICE_ID_STARTER=price_YOUR_STARTER_PLAN_ID
STRIPE_PRICE_ID_PROFESSIONAL=price_YOUR_PROFESSIONAL_PLAN_ID
```

### 3. Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate.

### 4. Forward Webhooks (Development)

**IMPORTANT: Use port 3008** (not 4242)

```bash
stripe listen --forward-to localhost:3008/api/stripe/webhook
```

This will output a webhook signing secret like:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy this secret** and update your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Restart Your Dev Server

After updating `.env.local`:

```bash
# Kill current server (Ctrl+C or kill process)
npm run dev
```

## Testing Webhooks

### Test Payment Intent Success

```bash
stripe trigger payment_intent.succeeded
```

### Test Subscription Events

```bash
# Create subscription
stripe trigger customer.subscription.created

# Update subscription
stripe trigger customer.subscription.updated

# Cancel subscription
stripe trigger customer.subscription.deleted
```

### Test Invoice Events

```bash
# Successful payment
stripe trigger invoice.payment_succeeded

# Failed payment
stripe trigger invoice.payment_failed
```

## Webhook Events Handled

Your app now handles these Stripe events:

- ✅ `payment_intent.succeeded` - Successful payment
- ✅ `payment_intent.payment_failed` - Failed payment
- ✅ `customer.subscription.created` - New subscription
- ✅ `customer.subscription.updated` - Subscription changed
- ✅ `customer.subscription.deleted` - Subscription canceled
- ✅ `invoice.payment_succeeded` - Invoice paid
- ✅ `invoice.payment_failed` - Invoice payment failed

## Create Products in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/products
2. Click **+ Add product**

### Starter Plan
- **Name**: Unite Hub - Starter
- **Pricing**: $49/month (or your price)
- **Recurring**: Monthly
- Copy the **Price ID** → Update `STRIPE_PRICE_ID_STARTER` in `.env.local`

### Professional Plan
- **Name**: Unite Hub - Professional
- **Pricing**: $149/month (or your price)
- **Recurring**: Monthly
- Copy the **Price ID** → Update `STRIPE_PRICE_ID_PROFESSIONAL` in `.env.local`

## Verify Webhook Endpoint

### Check Server Logs

When you trigger an event, you should see in your dev server:

```
PaymentIntent succeeded: pi_xxxxxxxxxxxxx
Payment succeeded for organization default-org
```

### Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your endpoint
3. View recent events and delivery attempts

## Production Setup

### 1. Create Production Webhook Endpoint

In Stripe Dashboard → Webhooks → Add endpoint:

```
https://yourdomain.com/api/stripe/webhook
```

Select events to listen for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 2. Get Signing Secret

After creating the endpoint, copy the **Signing secret** (starts with `whsec_`)

Update production environment variables:
```env
STRIPE_WEBHOOK_SECRET=whsec_PRODUCTION_SECRET_HERE
```

### 3. Use Production Keys

Replace test keys with live keys:
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

## Troubleshooting

### Webhook Signature Verification Failed

- Check that `STRIPE_WEBHOOK_SECRET` matches your webhook signing secret
- Ensure you're using the correct environment (test vs production)
- Restart dev server after updating `.env.local`

### Events Not Being Received

- Check that `stripe listen` is running
- Verify dev server is running on port 3008
- Check server logs for errors

### Database Errors

- Ensure organization has `stripe_customer_id` set
- Check that organization exists in database
- Review audit logs for error details

## Quick Commands Reference

```bash
# Login
stripe login

# Listen for webhooks (DEVELOPMENT)
stripe listen --forward-to localhost:3008/api/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# View webhook events
stripe events list

# View specific event
stripe events retrieve evt_xxxxxxxxxxxxx

# Test with specific customer
stripe trigger payment_intent.succeeded --add customer=cus_xxxxxxxxxxxxx
```

## Next Steps

1. ✅ Install Stripe CLI
2. ✅ Get API keys from dashboard
3. ✅ Update `.env.local` with real keys
4. ✅ Create products in Stripe Dashboard
5. ✅ Run `stripe listen` to forward webhooks
6. ✅ Test with `stripe trigger` commands
7. ✅ Implement payment UI in your app

## Current Status

- ✅ Webhook endpoint created: `/api/stripe/webhook`
- ✅ All major events handled
- ✅ Database integration ready
- ✅ Audit logging enabled
- ⚠️ Need real Stripe keys
- ⚠️ Need webhook secret from `stripe listen`
- ⚠️ Need product/price IDs from dashboard

---

**Webhook Endpoint:** http://localhost:3008/api/stripe/webhook
**Port:** 3008 (not 4242!)
