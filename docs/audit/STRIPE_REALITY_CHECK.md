# Stripe Reality Check

**Generated**: 2025-11-28
**Status**: PARTIAL - Configuration Mismatch

---

## Summary

This report verifies the Stripe integration against the codebase requirements.

### Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| Stripe SDK | INSTALLED | stripe@latest |
| Basic Config | CONFIGURED | Single-mode keys present |
| Dual Mode | NOT CONFIGURED | Missing test/live separation |
| Webhook | PARTIAL | Single endpoint configured |
| Price IDs | PARTIAL | 2 of 6 configured |

---

## Codebase Analysis

### Billing Architecture

The system implements a dual-mode billing router (`src/lib/billing/stripe-router.ts`):

```typescript
// Routing logic
export function getBillingModeForUser(email?: string, role?: string): BillingMode {
  // Staff/internal users → TEST mode
  // External customers → LIVE mode
}
```

### Staff Sandbox Registry

Internal users who should use TEST mode:
- `phill.mcgurk@gmail.com` (founder)
- `support@carsi.com.au` (staff_admin)
- `ranamuzamil1199@gmail.com` (engineering)
- `admin@unite-group.in` (admin)
- `contact@unite-group.in` (admin)
- `dev@unite-group.in` (engineering)

Internal domains:
- `unite-group.in`
- `disasterrecoveryqld.au`
- `carsi.com.au`

---

## Current Configuration

### Configured in .env.local

```env
STRIPE_SECRET_KEY=sk_test_51SK3Z3BY5KEPMwxd...
STRIPE_WEBHOOK_SECRET=whsec_f8e47035ca94e48f...
STRIPE_PRICE_ID_STARTER=price_1SSi0JBY5KEPMwxd1TfAWQER
STRIPE_PRICE_ID_PROFESSIONAL=price_1SSi0YBY5KEPMwxdrnA0r5cP
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SK3Z3BY5KEPMwxd...
```

### Missing Configuration

For dual-mode billing to work, these are needed:

**Test Mode:**
```env
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
STRIPE_TEST_PRICE_STARTER=price_...
STRIPE_TEST_PRICE_PRO=price_...
STRIPE_TEST_PRICE_ELITE=price_...
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
```

**Live Mode:**
```env
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_PRICE_STARTER=price_...
STRIPE_LIVE_PRICE_PRO=price_...
STRIPE_LIVE_PRICE_ELITE=price_...
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
```

---

## Pricing Tiers

### Expected Products (AUD, GST Included)

| Tier | Monthly | Annual | Status |
|------|---------|--------|--------|
| Starter | $495 | $4,950 | PARTIAL |
| Professional | $895 | $8,950 | PARTIAL |
| Elite | $1,295 | $12,950 | NOT CREATED |

### Code References

From `src/lib/billing/pricing-config.ts`:

```typescript
PRICING_PLANS = {
  starter: {
    name: 'Starter',
    price: 495,           // AUD, GST included
    annualPrice: 4950,    // AUD, GST included
    currency: 'AUD',
    gstIncluded: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_STARTER || "price_starter_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL || "price_starter_annual",
  },
  pro: {
    name: 'Pro',
    price: 895,           // AUD, GST included
    annualPrice: 8950,    // AUD, GST included
    currency: 'AUD',
    gstIncluded: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_PROFESSIONAL || "price_pro_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL || "price_pro_annual",
  },
  elite: {
    name: 'Elite',
    price: 1295,          // AUD, GST included
    annualPrice: 12950,   // AUD, GST included
    currency: 'AUD',
    gstIncluded: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_ELITE || "price_elite_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ID_ELITE_ANNUAL || "price_elite_annual",
  }
}
```

---

## Webhook Configuration

### Current Webhook Endpoint

Single endpoint: `/api/stripe/webhook`

### Required for Dual Mode

Two separate webhooks needed:
- `/api/webhooks/stripe/test` - For test mode events
- `/api/webhooks/stripe/live` - For live mode events

### Webhook Events to Listen For

```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
checkout.session.completed
```

---

## Stripe Dashboard Actions Required

### Step 1: Create Products (Test Mode)

1. Go to Stripe Dashboard → Products
2. Switch to Test Mode
3. Create products:

| Product | Price (AUD inc GST) | Interval |
|---------|---------------------|----------|
| Unite Hub Starter | $495 | Monthly |
| Unite Hub Starter Annual | $4,950 | Yearly |
| Unite Hub Professional | $895 | Monthly |
| Unite Hub Professional Annual | $8,950 | Yearly |
| Unite Hub Elite | $1,295 | Monthly |
| Unite Hub Elite Annual | $12,950 | Yearly |

### Step 2: Create Products (Live Mode)

Repeat Step 1 in Live mode.

### Step 3: Configure Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint for Test mode:
   - URL: `https://your-domain.com/api/webhooks/stripe/test`
   - Events: All subscription and invoice events
3. Add endpoint for Live mode:
   - URL: `https://your-domain.com/api/webhooks/stripe/live`
   - Events: All subscription and invoice events

### Step 4: Copy Price IDs

After creating products, copy the price IDs to environment:

```env
# Test Mode Price IDs
STRIPE_TEST_PRICE_STARTER=price_1XXX...
STRIPE_TEST_PRICE_PRO=price_1XXX...
STRIPE_TEST_PRICE_ELITE=price_1XXX...

# Live Mode Price IDs
STRIPE_LIVE_PRICE_STARTER=price_1XXX...
STRIPE_LIVE_PRICE_PRO=price_1XXX...
STRIPE_LIVE_PRICE_ELITE=price_1XXX...
```

---

## Testing Checklist

### Pre-Production Testing

- [ ] Create test products in Stripe
- [ ] Configure test environment variables
- [ ] Test checkout flow with test card (4242 4242 4242 4242)
- [ ] Verify webhook events are received
- [ ] Test subscription cancellation
- [ ] Test upgrade/downgrade flow

### Live Deployment Testing

- [ ] Create live products in Stripe
- [ ] Configure production environment variables
- [ ] Test with real card (small amount)
- [ ] Verify webhook events in production
- [ ] Monitor for errors in first 24 hours

---

## Code Files to Update

If consolidating to single-mode (simpler setup):

```typescript
// src/lib/billing/stripe-router.ts
// Change to always use single key set

// src/lib/billing/pricing-config.ts
// Use direct price IDs without mode prefix
```

If keeping dual-mode (recommended for scale):

```typescript
// Ensure all files use getBillingModeForUser()
// src/app/api/billing/subscription/route.ts
// src/app/api/stripe/checkout/route.ts
// src/app/api/webhooks/stripe/[mode]/route.ts
```

---

## Recommendations

1. **Short Term**: Use single-mode with existing configuration
2. **Medium Term**: Implement full dual-mode for staff testing
3. **Production**: Always use live mode for real customers

---

*Stripe audit completed: 2025-11-28*
