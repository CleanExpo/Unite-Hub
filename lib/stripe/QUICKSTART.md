# Stripe Subscription System - Quick Start Guide

Get your Stripe subscription system up and running in 10 minutes.

## Prerequisites

- Stripe account (test mode)
- Node.js and npm installed
- Unite-Hub CRM project setup
- Convex backend running

## 5-Minute Setup

### Step 1: Get Stripe Keys (2 minutes)

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Click **Reveal test key** and copy your **Secret key** (starts with `sk_test_`)

### Step 2: Create Products (1 minute)

1. Go to **Products** → **Add product**

**Starter Plan:**
- Name: `Starter`
- Price: `249` AUD
- Billing period: `Monthly`
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

**Professional Plan:**
- Name: `Professional`
- Price: `549` AUD
- Billing period: `Monthly`
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

### Step 3: Configure Webhooks (1 minute)

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `http://localhost:3008/api/stripe/webhook` (for local testing)
4. Description: `Unite-Hub Subscription Events`
5. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Update Environment Variables (1 minute)

Add to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Price IDs
STRIPE_PRICE_ID_STARTER=price_YOUR_STARTER_PRICE_ID_HERE
STRIPE_PRICE_ID_PROFESSIONAL=price_YOUR_PROFESSIONAL_PRICE_ID_HERE

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Already configured (verify these)
NEXT_PUBLIC_URL=http://localhost:3008
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

### Step 5: Test the Integration (Optional - 5 minutes)

#### Test Locally with Stripe CLI

```bash
# Install Stripe CLI (one-time setup)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3008/api/stripe/webhook

# In another terminal, start your app
npm run dev

# Test a webhook event
stripe trigger customer.subscription.created
```

## Quick Test: Create a Subscription

### 1. Start Your App

```bash
# Terminal 1: Start Convex
npm run convex

# Terminal 2: Start Next.js
npm run dev

# Terminal 3 (optional): Forward webhooks
stripe listen --forward-to localhost:3008/api/stripe/webhook
```

### 2. Create Checkout Session

Open browser console on `http://localhost:3008` and run:

```javascript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plan: 'starter',
    email: 'test@example.com',
    name: 'Test User',
    orgId: 'YOUR_ORG_ID_HERE' // Get from Convex dashboard
  })
});

const data = await response.json();
console.log('Checkout URL:', data.url);
window.location.href = data.url; // Redirect to Stripe Checkout
```

### 3. Complete Test Payment

Use Stripe test card:
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### 4. Verify Subscription Created

After payment, check:
1. **Stripe Dashboard**: See subscription in Payments → Subscriptions
2. **Webhook Events**: See events delivered in Developers → Webhooks
3. **Convex Dashboard**: See subscription in subscriptions table

## Usage Examples

### Get Current Subscription

```typescript
import { useEffect, useState } from 'react';

function SubscriptionStatus({ orgId }) {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetch(`/api/subscription/${orgId}`)
      .then(res => res.json())
      .then(data => setSubscription(data.subscription));
  }, [orgId]);

  if (!subscription) return <div>Loading...</div>;

  return (
    <div>
      <h2>Subscription Status</h2>
      <p>Plan: {subscription.planTier}</p>
      <p>Status: {subscription.status}</p>
      <p>Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
    </div>
  );
}
```

### Upgrade to Professional

```typescript
async function upgradeSubscription(orgId) {
  const response = await fetch('/api/subscription/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      targetPlan: 'professional'
    })
  });

  const data = await response.json();

  if (data.success) {
    alert('Upgraded successfully! ' + data.message);
    console.log('Proration:', data.proration);
  } else {
    alert('Error: ' + data.error);
  }
}
```

### Cancel Subscription

```typescript
async function cancelSubscription(orgId) {
  const confirmed = confirm(
    'Are you sure you want to cancel? You\'ll have access until the end of your billing period.'
  );

  if (!confirmed) return;

  const response = await fetch('/api/subscription/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      cancelImmediately: false, // Cancel at period end
      reason: 'User requested cancellation'
    })
  });

  const data = await response.json();

  if (data.success) {
    alert(data.message);
    console.log('Access until:', data.accessUntil);
  }
}
```

### Open Billing Portal

```typescript
async function openBillingPortal(orgId) {
  const response = await fetch('/api/subscription/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      returnUrl: window.location.href
    })
  });

  const data = await response.json();
  window.location.href = data.url; // Redirect to Stripe portal
}
```

## Common Test Cards

### Successful Payments
- `4242 4242 4242 4242` - Visa (succeeds)
- `5555 5555 5555 4444` - Mastercard (succeeds)

### Failed Payments
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### 3D Secure
- `4000 0027 6000 3184` - Requires authentication

All cards:
- Use any future expiry date
- Use any 3-digit CVC
- Use any postal code

## Troubleshooting

### Issue: "Price ID not found"
**Solution**: Verify price IDs in `.env.local` match Stripe Dashboard exactly.

### Issue: "Webhook signature verification failed"
**Solution**:
1. Check `STRIPE_WEBHOOK_SECRET` is set correctly
2. For local testing, use Stripe CLI webhook forwarding

### Issue: "No subscription found"
**Solution**:
1. Complete a test checkout first
2. Verify webhook events are being delivered
3. Check Convex database for subscription entry

### Issue: "Cannot connect to Convex"
**Solution**:
1. Ensure Convex dev server is running: `npm run convex`
2. Check `NEXT_PUBLIC_CONVEX_URL` is correct

## Next Steps

### Production Deployment

1. **Switch to Live Mode**:
   - Get live API keys from Stripe Dashboard
   - Create live products and prices
   - Update environment variables in production

2. **Update Webhook URL**:
   - Change to: `https://your-domain.com/api/stripe/webhook`
   - Update in Stripe Dashboard
   - Get new signing secret

3. **Test in Production**:
   - Use real payment methods
   - Verify all flows work end-to-end
   - Monitor webhook events

### Add Features

1. **Email Notifications**:
   - Payment failures
   - Subscription renewals
   - Cancellation confirmations

2. **Usage Tracking**:
   - Track feature usage per plan
   - Enforce limits (client accounts, etc.)

3. **Analytics Dashboard**:
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Subscription metrics

4. **Customer Portal**:
   - View subscription details
   - Download invoices
   - Update payment method
   - Change plans

## Resources

- [Full Documentation](./README.md) - Complete API reference
- [Migration Guide](./MIGRATION.md) - Migrate from old system
- [Stripe Documentation](https://stripe.com/docs) - Official Stripe docs
- [Test Cards](https://stripe.com/docs/testing) - All test card numbers

## Support

If you need help:
1. Check the [README.md](./README.md) for detailed documentation
2. Review error logs in browser console and server logs
3. Check Stripe Dashboard webhook event logs
4. Run integration tests: `npx ts-node lib/stripe/test-integration.ts`

## Success Checklist

- [ ] Stripe account created
- [ ] API keys obtained
- [ ] Products created in Stripe
- [ ] Environment variables configured
- [ ] Webhook endpoint configured
- [ ] App running locally
- [ ] Test checkout completed successfully
- [ ] Webhook events received
- [ ] Subscription visible in Convex
- [ ] Can view subscription details
- [ ] Can upgrade/downgrade plan
- [ ] Can cancel subscription

**Congratulations!** Your Stripe subscription system is now operational.
