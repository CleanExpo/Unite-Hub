# Stripe Integration Migration Guide

This guide helps you migrate from the old Stripe setup to the new comprehensive subscription system.

## Overview of Changes

### Old System
- Basic Stripe checkout integration
- Limited webhook handling
- Manual database updates
- No subscription management endpoints

### New System
- Complete subscription lifecycle management
- Full webhook event processing
- Automatic database synchronization with Convex
- RESTful API endpoints for all operations
- TypeScript types and utilities
- Production-ready error handling

## Migration Steps

### 1. Update Environment Variables

Ensure all required environment variables are set in `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs (UPDATE THESE)
STRIPE_PRICE_ID_STARTER=price_...     # $249 AUD/month
STRIPE_PRICE_ID_PROFESSIONAL=price_... # $549 AUD/month

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# App URLs
NEXT_PUBLIC_URL=http://localhost:3008
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

### 2. Update Stripe Products

#### Create or Update Products in Stripe Dashboard

1. **Starter Plan**
   - Name: "Starter"
   - Description: "Perfect for getting started with Unite-Hub CRM"
   - Price: $249 AUD
   - Billing: Monthly recurring
   - Copy the Price ID to `STRIPE_PRICE_ID_STARTER`

2. **Professional Plan**
   - Name: "Professional"
   - Description: "Advanced features for growing businesses"
   - Price: $549 AUD
   - Billing: Monthly recurring
   - Copy the Price ID to `STRIPE_PRICE_ID_PROFESSIONAL`

### 3. Update Stripe Client References

#### Before:
```typescript
import { stripe } from "@/lib/stripe";
```

#### After:
```typescript
import {
  stripe,
  PLAN_TIERS,
  getOrCreateCustomer,
  createCheckoutSession,
  getSubscription,
  // ... other functions
} from "@/lib/stripe";
```

### 4. Update Checkout Flow

#### Before:
```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  payment_method_types: ["card"],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: successUrl,
  cancel_url: cancelUrl,
  customer_email: email,
});
```

#### After:
```typescript
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe";

const customer = await getOrCreateCustomer({
  email,
  name,
  organizationId: orgId,
});

const session = await createCheckoutSession({
  customerId: customer.id,
  priceId: PLAN_TIERS.starter.priceId,
  successUrl,
  cancelUrl,
  metadata: { organizationId: orgId },
});
```

### 5. Update Webhook Handler

The new webhook handler is located at:
- `src/app/api/stripe/webhook/route.ts`

It automatically:
- Verifies webhook signatures
- Processes all subscription events
- Updates Convex database
- Handles errors gracefully

**No manual updates needed** - the webhook handler is complete and production-ready.

### 6. Migrate Database Schema

The Convex schema already includes the subscriptions table:

```typescript
subscriptions: defineTable({
  orgId: v.id("organizations"),
  planTier: v.union(v.literal("starter"), v.literal("professional")),
  status: v.union(
    v.literal("active"),
    v.literal("canceled"),
    v.literal("past_due"),
    v.literal("trialing")
  ),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.string(),
  stripePriceId: v.string(),
  cancelAtPeriodEnd: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**No migration needed** - this is already in your schema.

### 7. Update Frontend Components

#### Before:
```typescript
// Manual Stripe API calls
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({ plan, email }),
});
```

#### After:
```typescript
import {
  formatCurrency,
  getDaysUntilRenewal,
  isSubscriptionActive
} from "@/lib/stripe";

// Use new API endpoints
const response = await fetch(`/api/subscription/${orgId}`);
const { subscription, plan } = await response.json();

// Use utility functions
const displayPrice = formatCurrency(plan.price, plan.currency);
const daysLeft = getDaysUntilRenewal(subscription.currentPeriodEnd);
const isActive = isSubscriptionActive(subscription.status);
```

### 8. Test the Integration

Run the test suite:

```bash
# Run integration tests
npx ts-node lib/stripe/test-integration.ts
```

Or test manually:

```typescript
import { runAllTests, formatTestResults } from "@/lib/stripe/test-integration";

const results = await runAllTests();
formatTestResults(results);
```

Expected output:
```
✓ PASS Test 1: Environment Variables
✓ PASS Test 2: Stripe API Connection
✓ PASS Test 3: Price IDs
✓ PASS Test 4: Customer Creation
✓ PASS Test 5: Webhook Endpoint
✓ PASS Test 6: Plan Configuration

Total: 6 passed, 0 failed
```

### 9. Update Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Update endpoint URL to: `https://your-domain.com/api/stripe/webhook`
3. Select all subscription-related events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
   - `customer.created`
   - `customer.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 10. Test Webhook Locally

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3008/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
```

## API Endpoint Updates

### New Endpoints Available

All subscription management endpoints are now available:

```typescript
// Get subscription
GET /api/subscription/[orgId]

// Upgrade/downgrade
POST /api/subscription/upgrade
POST /api/subscription/downgrade

// Cancel/reactivate
POST /api/subscription/cancel
POST /api/subscription/reactivate

// Billing
GET /api/subscription/invoices
POST /api/subscription/portal
```

See [README.md](./README.md) for detailed API documentation.

## Breaking Changes

### 1. Price Changes
- **Old**: $99/month (Starter), $299/month (Professional)
- **New**: $249 AUD/month (Starter), $549 AUD/month (Professional)

**Action**: Update all pricing displays in frontend

### 2. Plan Tier Names
- **Old**: `"starter"`, `"professional"`, `"enterprise"`
- **New**: `"starter"`, `"professional"` (enterprise removed)

**Action**: Remove enterprise references from UI

### 3. Database Field Names
- **Old**: Mixed field names
- **New**: Standardized names (e.g., `stripeCustomerId`, `stripeSubscriptionId`)

**Action**: Update any direct database queries

### 4. API Response Formats
- **Old**: Minimal response data
- **New**: Comprehensive response with subscription, plan, and Stripe details

**Action**: Update frontend components to use new response structure

## Rollback Plan

If issues arise, you can rollback by:

1. **Revert webhook endpoint**:
   - Point Stripe webhook back to old endpoint
   - Keep webhook secret unchanged

2. **Keep old Stripe client**:
   - The old `src/lib/stripe.ts` still exists
   - Can import from old location temporarily

3. **Database is forward-compatible**:
   - New schema is additive only
   - Old subscriptions will continue to work

## Post-Migration Checklist

- [ ] All environment variables set
- [ ] Stripe products created with correct prices
- [ ] Price IDs updated in environment
- [ ] Webhook endpoint configured and tested
- [ ] Integration tests passing
- [ ] Manual checkout flow tested
- [ ] Subscription upgrade tested
- [ ] Subscription cancellation tested
- [ ] Invoice retrieval tested
- [ ] Billing portal access tested
- [ ] Frontend components updated
- [ ] Error handling tested
- [ ] Production deployment planned

## Common Issues

### Issue 1: Webhook signature verification fails
**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` is correctly set. Use Stripe CLI to test locally.

### Issue 2: Price IDs not found
**Solution**: Verify price IDs in Stripe Dashboard match environment variables exactly.

### Issue 3: Convex connection fails
**Solution**: Check `NEXT_PUBLIC_CONVEX_URL` is set correctly. Ensure Convex dev server is running.

### Issue 4: Customer creation fails
**Solution**: Verify Stripe API key has correct permissions. Check for API errors in logs.

### Issue 5: Subscription not syncing to database
**Solution**: Check webhook event logs in Stripe Dashboard. Verify webhook handler is processing events.

## Support

For issues during migration:
1. Check error logs in application
2. Review Stripe Dashboard event logs
3. Run integration tests for diagnostics
4. Check webhook delivery status in Stripe

## Next Steps

After successful migration:
1. Monitor webhook events in production
2. Set up error monitoring (Sentry, etc.)
3. Configure email notifications for payment failures
4. Implement usage tracking and limits
5. Add subscription analytics dashboard
6. Set up automated tests for critical flows

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Convex Documentation](https://docs.convex.dev)
