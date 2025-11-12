# Stripe Setup Guide

Complete guide to set up Stripe payment processing and subscription management for Unite-Hub CRM.

## Overview

Unite-Hub uses Stripe for:
- Subscription billing (Starter and Professional tiers)
- Payment processing
- Customer management
- Webhook event handling
- Usage-based billing tracking
- Invoice management

## Pricing Tiers

- **Starter**: $249 AUD/month
- **Professional**: $549 AUD/month

## Prerequisites

- Stripe account
- Business information (for production/live mode)
- Bank account for payouts (production)
- Unite-Hub application deployed or running locally

---

## Step 1: Create Stripe Account

### 1.1: Sign Up

1. Go to [Stripe](https://stripe.com/)
2. Click "Start now" or "Sign up"
3. Enter your email address
4. Create a strong password
5. Complete email verification

### 1.2: Complete Business Profile

1. Log in to Stripe Dashboard
2. Navigate to **Settings** > **Business settings**
3. Enter business information:
   - **Business name**: "Unite Group" (or your company name)
   - **Business type**: "Company"
   - **Country**: Australia
   - **Industry**: "Software" > "Marketing Automation"
   - **Business description**: "AI-powered marketing CRM and automation platform"
   - **Website**: https://your-domain.com

### 1.3: Add Banking Information (for Production)

1. Go to **Settings** > **Bank accounts and scheduling**
2. Add your bank account:
   - **Country**: Australia
   - **Account holder name**
   - **BSB**: Your bank's BSB code
   - **Account number**
3. Verify micro-deposits (Stripe will send small test amounts)
4. Set payout schedule: Daily, Weekly, or Monthly

---

## Step 2: Get API Keys

Stripe provides two sets of keys: **Test mode** and **Live mode**.

### 2.1: Test Mode Keys (Development)

1. In Stripe Dashboard, ensure "Test mode" toggle is ON (top right)
2. Navigate to **Developers** > **API keys**
3. You'll see:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal test key")

Copy both keys:
```
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

### 2.2: Live Mode Keys (Production)

**IMPORTANT**: Only use live keys when ready for production!

1. Complete Stripe account activation:
   - Submit business verification documents
   - Add bank account information
   - Complete identity verification
2. Toggle "Test mode" OFF in Stripe Dashboard
3. Navigate to **Developers** > **API keys**
4. Copy live keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (click "Reveal live key")

**Security**: Store live keys securely and never commit to version control!

---

## Step 3: Create Products and Prices

### 3.1: Create Starter Plan Product

1. In Stripe Dashboard (Test mode), go to **Products** > **Add product**
2. Configure Starter plan:
   - **Name**: `Unite-Hub Starter`
   - **Description**: `Starter tier subscription for Unite-Hub CRM - Includes email ingestion, basic AI analysis, and 5 images/month`
   - **Pricing model**: `Recurring`
   - **Price**: `249`
   - **Currency**: `AUD`
   - **Billing period**: `Monthly`
   - **Usage type**: `Licensed` (flat fee)
3. Click "Add product"
4. **Important**: Copy the **Price ID**: `price_xxxxxxxxxxxxx`
   - Save this as `STRIPE_PRICE_ID_STARTER`

### 3.2: Create Professional Plan Product

1. Click **Products** > **Add product**
2. Configure Professional plan:
   - **Name**: `Unite-Hub Professional`
   - **Description**: `Professional tier subscription for Unite-Hub CRM - Includes advanced AI features, multi-personas, competitive analysis, and 20 images/month`
   - **Pricing model**: `Recurring`
   - **Price**: `549`
   - **Currency**: `AUD`
   - **Billing period**: `Monthly`
   - **Usage type**: `Licensed` (flat fee)
3. Click "Add product"
4. **Important**: Copy the **Price ID**: `price_xxxxxxxxxxxxx`
   - Save this as `STRIPE_PRICE_ID_PROFESSIONAL`

### 3.3: Add Product Metadata (Optional but Recommended)

For each product:
1. Click on the product name
2. Scroll to "Metadata"
3. Add custom metadata:
   ```
   plan: starter (or professional)
   emails_limit: 100 (Starter) or unlimited (Professional)
   images_limit: 5 (Starter) or 20 (Professional)
   personas_limit: 1 (Starter) or 3 (Professional)
   ```
4. Click "Save"

---

## Step 4: Configure Webhooks

Webhooks notify your application of Stripe events (subscriptions, payments, etc.).

### 4.1: Create Webhook Endpoint

1. Navigate to **Developers** > **Webhooks**
2. Click "Add endpoint"
3. Configure endpoint:

   **For Local Development:**
   - Use Stripe CLI (see Step 4.3 below)

   **For Production:**
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
   - **Description**: `Unite-Hub Production Webhook`
   - **Events to send**: Select the following events:

4. Select these events:
   - `customer.created`
   - `customer.updated`
   - `customer.deleted`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
   - `checkout.session.completed`
   - `charge.succeeded`
   - `charge.failed`

5. Click "Add endpoint"

### 4.2: Get Webhook Signing Secret

1. Click on your newly created webhook
2. Copy the **Signing secret**: `whsec_...`
3. Save as `STRIPE_WEBHOOK_SECRET`

**Example:**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.3: Test Webhooks Locally with Stripe CLI

For local development, use Stripe CLI to forward webhooks:

**Install Stripe CLI:**

```bash
# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

**Authenticate:**
```bash
stripe login
```

**Forward webhooks to local server:**
```bash
stripe listen --forward-to localhost:3008/api/webhooks/stripe
```

This will output a webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

Use this secret in your local `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Step 5: Configure Environment Variables

Add to `.env.local` for development:

```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PROFESSIONAL=price_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URL
NEXT_PUBLIC_URL=http://localhost:3008
```

For production, update with live keys:

```bash
# Stripe Configuration (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx  # Live price ID
STRIPE_PRICE_ID_PROFESSIONAL=price_xxxxxxxxxxxxx  # Live price ID
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Production webhook secret

# Application URL
NEXT_PUBLIC_URL=https://your-production-domain.com
```

---

## Step 6: Test Payment Flow

### 6.1: Start Application

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3008/api/webhooks/stripe
```

### 6.2: Test Subscription Checkout

1. Navigate to: `http://localhost:3008/pricing`
2. Click "Get Started" on Starter plan ($249 AUD/month)
3. You should be redirected to Stripe Checkout
4. Use Stripe test card numbers:

   **Successful Payment:**
   ```
   Card number: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/34)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

   **Declined Card:**
   ```
   Card number: 4000 0000 0000 0002
   ```

   **Requires Authentication (3D Secure):**
   ```
   Card number: 4000 0025 0000 3155
   ```

5. Enter test email: `test@example.com`
6. Click "Subscribe"

### 6.3: Verify in Stripe Dashboard

1. Go to **Customers** in Stripe Dashboard
2. You should see your test customer
3. Click on the customer to view:
   - Active subscription
   - Payment method
   - Upcoming invoice
4. Go to **Payments** to see completed payment

### 6.4: Verify in Your Application

1. Check your application database (Convex)
2. Verify:
   - Organization created with `plan: "starter"`
   - Subscription record created with status: "active"
   - Stripe customer ID and subscription ID saved
3. Check webhook logs in Terminal 2:
   ```
   checkout.session.completed
   customer.created
   customer.subscription.created
   invoice.paid
   ```

---

## Step 7: Handle Subscription Lifecycle

### 7.1: Subscription States

Understand Stripe subscription statuses:
- `trialing`: In trial period (if trial configured)
- `active`: Subscription is active and paid
- `past_due`: Payment failed, retrying
- `canceled`: Subscription canceled
- `unpaid`: Final payment attempt failed

### 7.2: Payment Failure Handling

When payment fails, Stripe automatically:
1. Retries payment (configurable)
2. Sends webhook: `invoice.payment_failed`
3. Sends email to customer
4. Updates subscription status

Your webhook handler should:
```javascript
case 'invoice.payment_failed':
  // Update organization status
  await db.organizations.update(orgId, {
    status: 'payment_failed',
  });

  // Send notification to user
  await sendEmail({
    to: customer.email,
    subject: 'Payment Failed - Action Required',
    body: 'Your payment failed. Please update your payment method.',
  });
  break;
```

### 7.3: Cancellation Flow

User cancels subscription:
1. User clicks "Cancel Subscription" in settings
2. Your app calls Stripe API:
   ```javascript
   await stripe.subscriptions.update(subscriptionId, {
     cancel_at_period_end: true,
   });
   ```
3. Subscription continues until end of billing period
4. Webhook `customer.subscription.updated` received
5. On period end: `customer.subscription.deleted` webhook

Handle in your app:
```javascript
case 'customer.subscription.deleted':
  await db.organizations.update(orgId, {
    status: 'cancelled',
    plan: 'free',  // Downgrade to free tier if available
  });
  break;
```

---

## Step 8: Customer Portal (Self-Service)

Allow customers to manage their own subscriptions.

### 8.1: Enable Customer Portal

1. In Stripe Dashboard, go to **Settings** > **Customer portal**
2. Click "Activate test link" (for test mode)
3. Configure portal features:
   - [x] Update payment method
   - [x] Cancel subscription
   - [x] View invoice history
   - [ ] Update subscription (optional: allow plan changes)
4. Customize branding:
   - Upload your logo
   - Set brand colors
   - Add custom terms of service link
5. Click "Save"

### 8.2: Implement Portal Access in Your App

Add a "Manage Billing" button in settings:

```javascript
// API route: /api/stripe/customer-portal
import { stripe } from '@/lib/stripe';

export async function POST(req) {
  const { customerId } = await req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings`,
  });

  return Response.json({ url: session.url });
}
```

Frontend:
```javascript
async function openCustomerPortal() {
  const response = await fetch('/api/stripe/customer-portal', {
    method: 'POST',
    body: JSON.stringify({ customerId: org.stripeCustomerId }),
  });
  const { url } = await response.json();
  window.location.href = url;
}
```

---

## Step 9: Testing Webhooks

### 9.1: Test Webhook Signatures

Ensure your webhook handler verifies signatures:

```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  // Handle event
  switch (event.type) {
    case 'customer.subscription.updated':
      // Handle subscription update
      break;
    // ... other cases
  }

  return Response.json({ received: true });
}
```

### 9.2: Test Webhook Events

Use Stripe CLI to trigger test events:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.paid

# Test payment failure
stripe trigger invoice.payment_failed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

Monitor your application logs to ensure events are processed correctly.

### 9.3: Replay Webhooks

If a webhook fails, you can replay it:
1. Go to **Developers** > **Webhooks**
2. Click on your webhook endpoint
3. Find the failed event in the list
4. Click "..." > "Retry"

---

## Step 10: Go Live Checklist

### 10.1: Complete Stripe Account Activation

1. Submit business verification:
   - Business documents (ABN, company registration)
   - Identity verification (passport, driver's license)
   - Proof of address
2. Add bank account and verify
3. Complete tax information (GST details if applicable)

### 10.2: Switch to Live Mode

1. Create live mode products and prices (repeat Step 3)
2. Copy live Price IDs
3. Update environment variables with live keys
4. Create live mode webhook endpoint
5. Test thoroughly in live mode with real (small amount) payment

### 10.3: Production Deployment

Update environment variables in production (Vercel/Railway):

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID_STARTER=price_live_...
STRIPE_PRICE_ID_PROFESSIONAL=price_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
NEXT_PUBLIC_URL=https://your-domain.com
```

---

## Monitoring & Analytics

### 11.1: Monitor Payments

1. **Stripe Dashboard** > **Payments**
   - View all transactions
   - Filter by status, date, amount
   - Export data for accounting

2. **Subscriptions Dashboard**
   - Active subscriptions count
   - Churn rate
   - MRR (Monthly Recurring Revenue)
   - Failed payments

3. **Set Up Email Alerts**
   - Go to **Settings** > **Notifications**
   - Enable:
     - Successful payments
     - Failed payments
     - Disputes and chargebacks
     - Refund requests

### 11.2: Revenue Analytics

Stripe provides built-in analytics:
- MRR (Monthly Recurring Revenue)
- Churn rate
- Customer lifetime value
- Revenue by product

Access at: **Home** > **Revenue recognition**

---

## Troubleshooting

### Error: "No such price: 'price_xxxxx'"

**Cause**: Price ID doesn't exist or wrong mode (test vs live)

**Solution**:
1. Verify you're using the correct mode (test/live)
2. Check Price ID in Stripe Dashboard > Products
3. Ensure environment variable is set correctly
4. Price IDs are different in test and live mode

### Error: "Invalid API Key provided"

**Cause**: Wrong or expired API key

**Solution**:
1. Check environment variable is loaded
2. Verify key format: `sk_test_` or `sk_live_`
3. Regenerate API key if needed
4. Ensure no extra spaces or quotes

### Webhook Not Receiving Events

**Cause**: Webhook configuration issue

**Solution**:
1. Verify webhook URL is accessible (not localhost in production)
2. Check webhook signing secret matches
3. Review webhook logs in Stripe Dashboard
4. Ensure webhook handler returns 200 status
5. Check firewall/CORS settings

### Payment Declined

**Cause**: Various reasons (insufficient funds, card issue, etc.)

**Solution**:
1. Check Stripe Dashboard for decline reason
2. Common test card declines:
   - `4000 0000 0000 0002` - Always declines
   - `4000 0000 0000 9995` - Insufficient funds
3. In production, user must contact their bank

### Subscription Not Created After Payment

**Cause**: Webhook not processed or failed

**Solution**:
1. Check webhook logs in Stripe Dashboard
2. Verify webhook handler is working
3. Review application logs for errors
4. Manually trigger webhook replay if needed
5. Check database for partial records

---

## Security Best Practices

1. **Never expose secret keys**: Use environment variables
2. **Verify webhook signatures**: Always verify `stripe-signature` header
3. **Use HTTPS in production**: Required for live mode
4. **Implement idempotency**: Handle duplicate webhooks gracefully
5. **Log webhook events**: Track all events for audit trail
6. **Secure customer data**: Follow PCI compliance guidelines
7. **Rate limit API calls**: Prevent abuse
8. **Monitor for fraud**: Review high-risk transactions
9. **Regular security audits**: Review access logs monthly
10. **Restrict API key permissions**: Use restricted keys when possible

---

## Cost Breakdown

### Stripe Fees (Australia)

**Card payments:**
- 1.75% + 30¢ AUD per transaction (domestic cards)
- 2.9% + 30¢ AUD per transaction (international cards)

**Example calculation for Starter plan ($249 AUD/month):**
- Gross: $249.00
- Stripe fee: $4.67 (1.75% + 0.30)
- Net: $244.33

**Example for Professional plan ($549 AUD/month):**
- Gross: $549.00
- Stripe fee: $9.91 (1.75% + 0.30)
- Net: $539.09

**No monthly fees** for standard account.

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Stripe](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

## Support

For Stripe-specific issues:
- Stripe Support: https://support.stripe.com/

For Unite-Hub integration issues:
- Contact: contact@unite-group.in
