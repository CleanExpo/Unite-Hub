# Stripe Price ID Configuration Guide

**Status**: P3-002 - Requires Setup Before Production Launch
**Last Updated**: 2025-11-28

## Current State

### Configured Price IDs (in .env.local)
```bash
STRIPE_PRICE_ID_STARTER="price_1SSi0JBY5KEPMwxd1TfAWQER"        # A$495/month
STRIPE_PRICE_ID_PROFESSIONAL="price_1SSi0YBY5KEPMwxdrnA0r5cP"   # A$895/month
```

### Missing Price IDs (Must Create in Stripe Dashboard)
```bash
STRIPE_PRICE_ID_ELITE=""                    # A$1,295/month
STRIPE_PRICE_ID_STARTER_ANNUAL=""           # A$4,950/year
STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL=""      # A$8,950/year
STRIPE_PRICE_ID_ELITE_ANNUAL=""             # A$12,950/year
```

## Required Stripe Products & Prices

### Step 1: Create Products in Stripe Dashboard

Navigate to: https://dashboard.stripe.com/products

Create **3 Products**:

| Product Name | Product ID (suggested) |
|--------------|------------------------|
| Synthex Starter | prod_starter |
| Synthex Pro | prod_pro |
| Synthex Elite | prod_elite |

### Step 2: Create Prices for Each Product

#### Starter Plan
| Interval | Amount (AUD) | Environment Variable |
|----------|-------------|---------------------|
| Monthly | A$495.00 | `STRIPE_PRICE_ID_STARTER` |
| Yearly | A$4,950.00 | `STRIPE_PRICE_ID_STARTER_ANNUAL` |

#### Pro Plan
| Interval | Amount (AUD) | Environment Variable |
|----------|-------------|---------------------|
| Monthly | A$895.00 | `STRIPE_PRICE_ID_PROFESSIONAL` |
| Yearly | A$8,950.00 | `STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL` |

#### Elite Plan
| Interval | Amount (AUD) | Environment Variable |
|----------|-------------|---------------------|
| Monthly | A$1,295.00 | `STRIPE_PRICE_ID_ELITE` |
| Yearly | A$12,950.00 | `STRIPE_PRICE_ID_ELITE_ANNUAL` |

### Step 3: Configure Prices in Stripe

For each price, set:
- **Currency**: AUD (Australian Dollar)
- **Billing**: Recurring
- **Tax behavior**: Inclusive (GST is included in prices)
- **Usage type**: Licensed

### Step 4: Update Environment Variables

After creating prices in Stripe, copy each `price_xxxx` ID to `.env.local`:

```bash
# Monthly Plans
STRIPE_PRICE_ID_STARTER="price_xxxx"
STRIPE_PRICE_ID_PROFESSIONAL="price_xxxx"
STRIPE_PRICE_ID_ELITE="price_xxxx"

# Annual Plans (12 months for price of 10)
STRIPE_PRICE_ID_STARTER_ANNUAL="price_xxxx"
STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL="price_xxxx"
STRIPE_PRICE_ID_ELITE_ANNUAL="price_xxxx"
```

### Step 5: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all 6 price IDs for Production environment
3. Redeploy to apply changes

## Test Mode vs Live Mode

**Current**: Using Test Mode keys (`sk_test_*`, `pk_test_*`)

**For Production**:
1. Create same products/prices in Live Mode
2. Update `STRIPE_SECRET_KEY` to live key (`sk_live_*`)
3. Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key (`pk_live_*`)
4. Update webhook secret for production endpoint

## Webhook Configuration

Ensure webhook is configured for:
```
https://synthex.social/api/stripe/webhook
```

Events to listen for (from pricing-config.ts):
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

## Verification Checklist

- [ ] All 6 price IDs created in Stripe
- [ ] All 6 environment variables set in .env.local
- [ ] All 6 environment variables set in Vercel
- [ ] Webhook configured and verified
- [ ] Test subscription flow with test card
- [ ] Annual billing shows correct discount (2 months free)

## Code Reference

Pricing configuration: `src/lib/billing/pricing-config.ts`
Stripe client: `src/lib/stripe/client.ts`
Checkout API: `src/app/api/stripe/checkout/route.ts`

## Contact

For Stripe account access or assistance:
- Stripe Dashboard: https://dashboard.stripe.com
- Account: contact@unite-group.in
