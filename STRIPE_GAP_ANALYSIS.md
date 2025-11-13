# Stripe Integration Gap Analysis
**Generated:** 2025-11-13
**Analyzed using:** kwaipilot/kat-coder-pro:free

## Based on claude-code-skills-stripe Repository

---

## Current Implementation

### ✅ What We Have:
- `src/lib/stripe.ts` - Stripe client initialized
- `src/lib/stripe/client.ts` - Stripe utilities
- `src/app/api/stripe/checkout/route.ts` - Checkout session creation
- `src/app/api/stripe/webhook/route.ts` - Webhook handler (DUPLICATE!)
- `src/app/api/webhooks/stripe/route.ts` - Another webhook handler
- Environment variables partially configured

---

## Missing Components

### ❌ API Routes

1. **Customer Portal Route** - MISSING
   ```
   File: src/app/api/stripe/portal/route.ts
   Purpose: Create customer portal session for subscription management
   ```

2. **Subscription Management Routes** - MISSING
   ```
   - src/app/api/subscription/upgrade/route.ts
   - src/app/api/subscription/downgrade/route.ts
   - src/app/api/subscription/cancel/route.ts
   - src/app/api/subscription/reactivate/route.ts
   ```

3. **Invoice Routes** - MISSING
   ```
   - src/app/api/subscription/invoices/route.ts
   Purpose: Fetch customer invoices
   ```

### ❌ Client Components

1. **CheckoutButton Component** - MISSING
   ```
   File: src/components/stripe/CheckoutButton.tsx
   Props: amount, productName, description
   Purpose: Reusable checkout button with Stripe.js
   ```

2. **SubscriptionCard Component** - MISSING
   ```
   File: src/components/stripe/SubscriptionCard.tsx
   Purpose: Display current subscription status
   ```

3. **PricingTable Component** - EXISTS but needs enhancement
   ```
   File: src/app/pricing/page.tsx
   Needs: Integration with CheckoutButton
   ```

### ❌ Webhook Event Handlers

Current webhook routes exist but may be missing handlers for:

```typescript
Missing Event Handlers:
✅ payment_intent.succeeded (may exist)
✅ customer.subscription.created (may exist)
✅ customer.subscription.updated (may exist)
✅ customer.subscription.deleted (may exist)
❌ invoice.payment_succeeded
❌ invoice.payment_failed
❌ customer.subscription.trial_will_end
❌ payment_method.attached
❌ payment_method.detached
```

### ❌ Environment Variables

```bash
# Missing or incomplete:
STRIPE_WEBHOOK_SECRET=whsec_...          # Exists but may need update
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... # Exists
STRIPE_SECRET_KEY=sk_...                   # Exists

# Production keys needed:
STRIPE_SECRET_KEY_LIVE=sk_live_...         # MISSING
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=... # MISSING
```

### ❌ Database Integration

**Current:** Using Convex for subscriptions table

**Missing:**
1. Store `stripeCustomerId` on user/org records
2. Store `stripeSubscriptionId` properly
3. Sync subscription status from webhooks
4. Store invoice history
5. Track payment methods

**Required Convex Mutations:**
```typescript
// convex/subscriptions.ts
❌ updateSubscriptionFromWebhook
❌ storeCustomerId
❌ syncSubscriptionStatus
❌ storeInvoice
```

### ❌ Testing Requirements

**From Repository Guide:**
1. ✅ Test cards documented (4242 4242 4242 4242)
2. ❌ Stripe CLI integration not set up
3. ❌ Local webhook forwarding not documented
4. ❌ Test event triggers not scripted
5. ❌ No testing documentation in repo

---

## Implementation Checklist

### Phase 1: Core Missing Components (Priority)

```
□ Create CheckoutButton component
□ Add Customer Portal API route
□ Enhance webhook event handlers:
  □ invoice.payment_succeeded
  □ invoice.payment_failed
  □ customer.subscription.trial_will_end
□ Add Convex mutations for webhook sync
□ Store stripeCustomerId in organizations table
```

### Phase 2: Subscription Management

```
□ Create subscription management API routes:
  □ /api/subscription/upgrade
  □ /api/subscription/downgrade
  □ /api/subscription/cancel
  □ /api/subscription/reactivate
□ Create SubscriptionCard component
□ Add invoice history route
□ Sync payment methods
```

### Phase 3: Testing & Documentation

```
□ Set up Stripe CLI locally
□ Document test procedures
□ Create test scripts for webhook events
□ Add E2E tests for checkout flow
□ Document deployment process
```

### Phase 4: Production Readiness

```
□ Add live Stripe keys to Vercel
□ Create production webhook endpoint
□ Configure webhook events in Stripe Dashboard
□ Set up webhook monitoring
□ Add error tracking for payment failures
□ Create admin dashboard for subscriptions
```

---

## Critical Issues to Fix

### 🔴 DUPLICATE WEBHOOK HANDLERS
**Issue:** Two webhook routes exist:
- `/api/stripe/webhook`
- `/api/webhooks/stripe`

**Resolution:** Keep ONE, delete the other. Use `/api/webhooks/stripe` (matches guide).

### 🔴 WEBHOOK BODY PARSING
**Issue:** Must disable Next.js body parsing for signature verification

**Required Config:**
```typescript
export const config = {
  api: {
    bodyParser: false,
  },
};
```

### 🔴 MISSING CUSTOMER PORTAL
**Issue:** Users can't manage subscriptions

**Impact:** Cannot cancel, upgrade, or update payment methods

**Solution:** Implement `/api/subscription/portal` route

---

## Recommended Implementation Order

1. **Fix webhook duplicate** (5 min)
2. **Create CheckoutButton** (30 min)
3. **Add Customer Portal route** (30 min)
4. **Enhance webhook handlers** (1 hour)
5. **Add Convex sync mutations** (1 hour)
6. **Create SubscriptionCard** (30 min)
7. **Add subscription management routes** (2 hours)
8. **Testing & documentation** (2 hours)

**Total Estimated Time:** ~8 hours

---

## Code Examples Needed

### 1. CheckoutButton Component
```typescript
// src/components/stripe/CheckoutButton.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function CheckoutButton({
  amount,
  productName,
  description,
}: {
  amount: number;
  productName: string;
  description: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, productName, description }),
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });

    setLoading(false);
  };

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Loading...' : 'Subscribe Now'}
    </Button>
  );
}
```

### 2. Customer Portal Route
```typescript
// src/app/api/subscription/portal/route.ts
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get customer ID from database
  const customerId = await getCustomerIdFromUser(session.user.id);

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

---

## Next Steps

**Immediate Actions:**
1. Review current webhook handlers
2. Identify which events are already handled
3. Delete duplicate webhook route
4. Create CheckoutButton component
5. Test checkout flow end-to-end

**This Week:**
1. Implement customer portal
2. Add missing webhook handlers
3. Sync subscription data to Convex
4. Test with Stripe CLI

**Next Week:**
1. Production deployment
2. Switch to live keys
3. Configure production webhooks
4. Monitor first real transactions

---

*Analysis powered by kwaipilot/kat-coder-pro:free via OpenRouter*
