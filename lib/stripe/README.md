# Stripe Subscription System - Unite-Hub CRM

Complete Stripe subscription management system for Unite-Hub CRM with two pricing tiers: **Starter** ($249 AUD/month) and **Professional** ($549 AUD/month).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Stripe Integration                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Stripe     │─────▶│   Webhooks   │─────▶│  Convex   │ │
│  │   Dashboard  │      │   Handler    │      │  Database │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                     │       │
│         │                      │                     │       │
│         ▼                      ▼                     ▼       │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │  Checkout    │      │  Subscription│      │   API     │ │
│  │  Sessions    │      │  Management  │      │  Routes   │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Functionality
- ✅ Customer creation and management
- ✅ Subscription creation via Checkout
- ✅ Subscription upgrades/downgrades with proration
- ✅ Subscription cancellation (immediate or at period end)
- ✅ Subscription reactivation
- ✅ Invoice management and billing history
- ✅ Stripe Customer Portal access
- ✅ Webhook event processing
- ✅ Real-time database synchronization with Convex

### Pricing Tiers

#### Starter - $249 AUD/month
- 1 Client Account
- Basic email processing
- Single persona generation
- Basic mind mapping
- Standard marketing strategy
- Single platform campaigns

#### Professional - $549 AUD/month
- 5 Client Accounts
- Advanced email processing
- Multi-persona generation
- Advanced mind mapping with auto-expansion
- Comprehensive marketing strategies with competitor analysis
- Multi-platform campaigns
- Hooks & scripts library
- DALL-E image generation
- Priority support

## File Structure

```
lib/stripe/
├── client.ts              # Main Stripe client with all operations
└── README.md              # This file

convex/
└── subscriptions.ts       # Convex database functions

src/app/api/
├── stripe/
│   ├── checkout/route.ts  # Create checkout sessions
│   └── webhook/route.ts   # Handle Stripe webhooks
└── subscription/
    ├── [orgId]/route.ts   # GET subscription details
    ├── upgrade/route.ts   # POST upgrade subscription
    ├── downgrade/route.ts # POST downgrade subscription
    ├── cancel/route.ts    # POST cancel subscription
    ├── reactivate/route.ts# POST reactivate subscription
    ├── invoices/route.ts  # GET billing history
    └── portal/route.ts    # POST create portal session
```

## API Endpoints

### Create Checkout Session
```typescript
POST /api/stripe/checkout
Body: {
  plan: "starter" | "professional",
  email: string,
  name: string,
  orgId: string
}
Response: {
  sessionId: string,
  url: string,
  customerId: string
}
```

### Get Subscription Details
```typescript
GET /api/subscription/[orgId]
Response: {
  subscription: {
    id: string,
    orgId: string,
    planTier: "starter" | "professional",
    status: "active" | "canceled" | "past_due" | "trialing",
    cancelAtPeriodEnd: boolean,
    currentPeriodStart: number,
    currentPeriodEnd: number,
    daysUntilRenewal: number
  },
  plan: {
    name: string,
    price: number,
    currency: string,
    features: string[]
  }
}
```

### Upgrade Subscription
```typescript
POST /api/subscription/upgrade
Body: {
  orgId: string,
  targetPlan: "professional"
}
Response: {
  success: boolean,
  message: string,
  subscription: {...},
  proration: {
    amount: number,
    currency: string
  }
}
```

### Downgrade Subscription
```typescript
POST /api/subscription/downgrade
Body: {
  orgId: string,
  targetPlan: "starter"
}
Response: {
  success: boolean,
  message: string,
  subscription: {...},
  proration: {
    amount: number,
    currency: string,
    note: string
  }
}
```

### Cancel Subscription
```typescript
POST /api/subscription/cancel
Body: {
  orgId: string,
  cancelImmediately?: boolean,
  reason?: string
}
Response: {
  success: boolean,
  message: string,
  subscription: {...},
  daysRemaining?: number,
  accessUntil?: string
}
```

### Reactivate Subscription
```typescript
POST /api/subscription/reactivate
Body: {
  orgId: string
}
Response: {
  success: boolean,
  message: string,
  subscription: {...}
}
```

### Get Billing History
```typescript
GET /api/subscription/invoices?orgId={orgId}&limit={limit}
Response: {
  invoices: Array<{
    id: string,
    number: string,
    status: string,
    amount: number,
    amountPaid: number,
    currency: string,
    created: number,
    invoicePdf: string,
    hostedInvoiceUrl: string
  }>,
  upcomingInvoice: {
    amount: number,
    currency: string,
    periodStart: number,
    periodEnd: number,
    nextPaymentAttempt: number
  }
}
```

### Create Billing Portal Session
```typescript
POST /api/subscription/portal
Body: {
  orgId: string,
  returnUrl: string
}
Response: {
  url: string
}
```

## Webhook Events

The webhook handler processes the following Stripe events:

### Subscription Events
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription modified (plan change, status change)
- `customer.subscription.deleted` - Subscription canceled/expired

### Invoice Events
- `invoice.paid` - Invoice payment succeeded
- `invoice.payment_failed` - Invoice payment failed
- `invoice.payment_action_required` - Additional payment action needed

### Customer Events
- `customer.created` - New customer created
- `customer.updated` - Customer details updated

### Payment Events
- `payment_intent.succeeded` - Payment succeeded
- `payment_intent.payment_failed` - Payment failed

All webhook events are:
1. Verified using Stripe signature
2. Logged for debugging
3. Synchronized with Convex database
4. Return appropriate HTTP responses

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:
```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# App URLs
NEXT_PUBLIC_URL=http://localhost:3008
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

### 2. Stripe Product Setup

Create products and prices in Stripe Dashboard:

1. **Starter Plan**
   - Name: "Starter"
   - Price: $249 AUD/month
   - Recurring billing
   - Copy Price ID to `STRIPE_PRICE_ID_STARTER`

2. **Professional Plan**
   - Name: "Professional"
   - Price: $549 AUD/month
   - Recurring billing
   - Copy Price ID to `STRIPE_PRICE_ID_PROFESSIONAL`

### 3. Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen to:
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

### 4. Test Webhook Locally

Use Stripe CLI for local testing:
```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3008/api/stripe/webhook

# Test a webhook
stripe trigger customer.subscription.created
```

### 5. Deploy to Production

1. Update environment variables with live Stripe keys
2. Update webhook endpoint URL to production domain
3. Test checkout flow end-to-end
4. Monitor webhook logs in Stripe Dashboard

## Usage Examples

### Client-Side: Create Checkout Session
```typescript
const createCheckoutSession = async (plan: 'starter' | 'professional') => {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan,
      email: user.email,
      name: user.name,
      orgId: organization.id,
    }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

### Client-Side: Get Subscription
```typescript
const getSubscription = async (orgId: string) => {
  const response = await fetch(`/api/subscription/${orgId}`);
  const data = await response.json();
  return data.subscription;
};
```

### Client-Side: Upgrade to Professional
```typescript
const upgradeSubscription = async (orgId: string) => {
  const response = await fetch('/api/subscription/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      targetPlan: 'professional',
    }),
  });

  const data = await response.json();
  if (data.success) {
    console.log('Upgraded successfully!', data.proration);
  }
};
```

### Client-Side: Cancel Subscription
```typescript
const cancelSubscription = async (orgId: string, immediate = false) => {
  const response = await fetch('/api/subscription/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      cancelImmediately: immediate,
      reason: 'Customer request',
    }),
  });

  const data = await response.json();
  if (data.success) {
    console.log(data.message);
    console.log(`Access until: ${data.accessUntil}`);
  }
};
```

### Client-Side: Open Billing Portal
```typescript
const openBillingPortal = async (orgId: string) => {
  const response = await fetch('/api/subscription/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      returnUrl: window.location.href,
    }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe billing portal
};
```

## Error Handling

All API endpoints return consistent error responses:

```typescript
{
  error: string,           // User-friendly error message
  message?: string,        // Technical error details
  code?: string            // Error code (e.g., 'SUBSCRIPTION_NOT_FOUND')
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Resource not found
- `500` - Server error

## Security Considerations

1. **Webhook Signature Verification**: All webhooks are verified using Stripe signature
2. **Environment Variables**: Secrets stored in environment variables, never committed
3. **API Authentication**: Implement authentication middleware for production
4. **HTTPS Only**: Webhooks require HTTPS in production
5. **Rate Limiting**: Implement rate limiting on API endpoints
6. **Input Validation**: All inputs validated before processing

## Testing

### Test Cards (Stripe Test Mode)

Success:
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard

Decline:
- `4000 0000 0000 0002` - Card declined

3D Secure:
- `4000 0027 6000 3184` - Requires authentication

### Test Scenarios

1. **New Subscription**
   - Create checkout session
   - Complete payment
   - Verify webhook received
   - Verify Convex database updated

2. **Upgrade Plan**
   - Start with Starter plan
   - Upgrade to Professional
   - Verify proration calculated
   - Verify database updated

3. **Cancel Subscription**
   - Cancel at period end
   - Verify access continues until end
   - Verify status updated

4. **Payment Failure**
   - Use declining test card
   - Verify webhook received
   - Verify status updated to past_due

## Monitoring

Monitor the following:
1. **Stripe Dashboard**: Payment success rates, failed payments
2. **Webhook Logs**: Event delivery status
3. **Application Logs**: Error rates, response times
4. **Database Consistency**: Stripe vs Convex data sync

## Troubleshooting

### Webhook not receiving events
1. Check webhook endpoint is publicly accessible
2. Verify webhook secret is correct
3. Check Stripe Dashboard webhook logs
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3008/api/stripe/webhook`

### Subscription not created
1. Verify price IDs are correct
2. Check Stripe API logs
3. Verify organizationId is passed in metadata
4. Check Convex database connectivity

### Payment failures
1. Check Stripe Dashboard for decline reason
2. Verify card details are correct
3. Check for 3D Secure requirements
4. Review customer's payment method

## Production Checklist

- [ ] Update to live Stripe API keys
- [ ] Configure webhook with production URL
- [ ] Test complete checkout flow
- [ ] Verify webhook signature validation
- [ ] Implement authentication on API routes
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Test payment failure scenarios
- [ ] Set up customer email notifications
- [ ] Document cancellation policy
- [ ] Configure Stripe billing portal settings
- [ ] Test subscription upgrade/downgrade
- [ ] Verify database synchronization
- [ ] Set up backup and recovery procedures

## Support

For issues related to:
- **Stripe Integration**: Check Stripe Dashboard logs and webhook events
- **Database Sync**: Check Convex logs and database state
- **API Errors**: Check application logs and error monitoring

## License

This Stripe integration is part of Unite-Hub CRM and follows the same license.
