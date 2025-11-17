# STRIPE INTEGRATION AUDIT REPORT

**Date**: 2025-11-17
**Auditor**: Claude Code Agent
**Purpose**: Pre-Production Stripe Integration Review
**Status**: ⚠️ **CRITICAL ISSUES FOUND - NOT READY FOR PRODUCTION**

---

## EXECUTIVE SUMMARY

The Stripe integration has a **solid foundation** with comprehensive webhook handling, subscription management, and database schema. However, there are **6 CRITICAL issues** that must be resolved before going live.

**Current State**: 🔴 **NOT PRODUCTION READY**
**Estimated Fix Time**: 2-3 hours
**Risk Level**: HIGH (payment failures, revenue loss)

---

## ✅ WHAT'S WORKING WELL

### 1. **Webhook Implementation** (src/app/api/stripe/webhook/route.ts)
- ✅ Comprehensive event handling (10 event types)
- ✅ Proper signature verification
- ✅ Database synchronization for subscriptions/invoices
- ✅ Rate limiting protection
- ✅ Error handling and logging
- ✅ Idempotent operations with upserts

**Events Handled**:
- ✅ customer.subscription.created/updated/deleted
- ✅ invoice.paid/payment_failed/payment_action_required
- ✅ customer.created/updated
- ✅ payment_intent.succeeded/payment_failed

### 2. **Client Library** (src/lib/stripe/client.ts)
- ✅ Well-organized functions (26 total)
- ✅ TypeScript types throughout
- ✅ Proper error handling
- ✅ Customer management
- ✅ Subscription lifecycle (create, update, cancel, reactivate)
- ✅ Invoice management
- ✅ Payment method handling
- ✅ Proration calculations
- ✅ Billing portal integration

### 3. **Database Schema** (supabase/migrations/012_subscriptions.sql)
- ✅ Proper normalization (subscriptions, invoices, payment_methods)
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) enabled
- ✅ Triggers for updated_at timestamps
- ✅ CHECK constraints for data integrity
- ✅ Metadata JSONB columns for flexibility

### 4. **Checkout Flow** (src/app/api/stripe/checkout/route.ts)
- ✅ Customer creation/retrieval
- ✅ Session creation
- ✅ Success/cancel URLs
- ✅ Metadata tracking
- ✅ Rate limiting
- ✅ Input validation

---

## 🔴 CRITICAL ISSUES (MUST FIX BEFORE LAUNCH)

### Issue #1: Missing Environment Variables in .env.example ⚠️ HIGH PRIORITY

**Problem**: The `.env.example` file is missing ALL Stripe-related environment variables. Developers won't know what to configure.

**Missing Variables**:
```env
# ==================== Stripe ====================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Product Price IDs
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Impact**:
- New deployments will crash
- Developers won't know what to configure
- Production setup will be error-prone

**Fix**: Update `.env.example` with all required Stripe variables

---

### Issue #2: Pricing Mismatch - Standard Plan Not Configured ⚠️ CRITICAL

**Problem**: The pricing page shows a "Standard" plan for $99/month, but the Stripe client only has "Starter" ($249) and "Professional" ($549) plans.

**Evidence**:

`src/app/pricing/page.tsx`:
```typescript
handleCheckout("standard")  // ❌ This plan doesn't exist!
```

`src/lib/stripe/client.ts`:
```typescript
export const PLAN_TIERS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_ID_STARTER!,
    price: 24900, // $249 AUD/month
  },
  professional: {
    priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
    price: 54900, // $549 AUD/month
  },
  // ❌ NO "standard" plan exists!
}
```

`src/app/api/stripe/checkout/route.ts`:
```typescript
// Validate plan tier
if (plan !== "starter" && plan !== "professional") {
  return NextResponse.json(
    { error: "Invalid plan. Must be 'starter' or 'professional'" },
    { status: 400 }
  );
}
```

**Impact**:
- 100% of pricing page checkouts will fail
- Users will see "Invalid plan" errors
- Complete payment flow breakdown

**Fix Options**:
1. **Option A**: Update pricing page to use existing plans ($249/$549)
2. **Option B**: Add "standard" plan to PLAN_TIERS and create Stripe price
3. **Option C**: Rename "starter" to "standard" throughout codebase

---

### Issue #3: Hardcoded Price Validation - Fails Silently ⚠️ HIGH PRIORITY

**Problem**: The checkout route validates that plan is "starter" or "professional", but the pricing page sends "standard". This causes a **400 error** with no user-visible error handling.

**Checkout Route** (line 34-39):
```typescript
if (plan !== "starter" && plan !== "professional") {
  return NextResponse.json(
    { error: "Invalid plan. Must be 'starter' or 'professional'" },
    { status: 400 }
  );
}
```

**Pricing Page** (line 144):
```typescript
onSelect={() => handleCheckout("standard")}  // ❌ Will always fail!
```

**Impact**:
- User clicks "Get Started" → nothing happens
- No error message shown to user
- Stripe window never opens
- Silent failure = bad UX

**Fix**: Add error handling in pricing page `handleCheckout`:
```typescript
if (!res.ok) {
  const data = await res.json();
  alert(`Error: ${data.error || "Failed to create checkout session"}`);
  return;
}
```

---

### Issue #4: Currency Mismatch - AUD vs USD ⚠️ MEDIUM PRIORITY

**Problem**: Code references both AUD and USD currencies inconsistently.

**PLAN_TIERS Configuration**:
```typescript
starter: {
  price: 24900, // $249 AUD/month  ✓ Correct
  currency: "aud",  ✓ Correct
},
```

**Database Schema**:
```sql
currency TEXT DEFAULT 'usd',  -- ❌ Wrong default!
```

**Webhook Handler**:
```typescript
currency: subscription.items.data[0].price.currency || "aud",  ✓ Falls back to AUD
```

**Impact**:
- If Stripe price is USD, invoices will show incorrect currency
- Database records may have wrong currency
- Financial reporting will be inaccurate

**Fix**:
1. Update database migration default: `currency TEXT DEFAULT 'aud'`
2. Ensure all Stripe prices are created in AUD
3. Add currency validation in checkout

---

### Issue #5: Missing NEXT_PUBLIC_URL Environment Variable ⚠️ CRITICAL

**Problem**: Checkout success/cancel URLs use `process.env.NEXT_PUBLIC_URL` which may not be set.

**Checkout Route** (line 64-65):
```typescript
successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/overview?success=true&session_id={CHECKOUT_SESSION_ID}`,
cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
```

**If Not Set**:
- URLs become `undefined/dashboard/overview`
- Stripe checkout fails with invalid URL error
- Users cannot complete payment

**Fix**:
1. Add to `.env.example`: `NEXT_PUBLIC_URL=https://unite-hub.com`
2. Add validation in checkout route:
```typescript
if (!process.env.NEXT_PUBLIC_URL) {
  throw new Error("NEXT_PUBLIC_URL must be set");
}
```

---

### Issue #6: No Stripe Client Loading on Pricing Page ⚠️ HIGH PRIORITY

**Problem**: The pricing page references Stripe client for redirect but never loads the Stripe.js library.

**Pricing Page** (line 63-70):
```typescript
const stripe = (window as any).Stripe?.(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

if (stripe) {
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) console.error(error);
}
```

**Issues**:
1. ❌ Stripe.js script is not loaded (no `<Script>` tag)
2. ❌ If Stripe client doesn't exist, redirect never happens
3. ❌ No fallback behavior
4. ❌ No error message to user

**Impact**:
- Checkout process fails silently
- Users stuck on pricing page
- Payment never initiated

**Fix**: Add Stripe.js script to layout or use direct redirect:
```typescript
// Option 1: Use session.url instead of client-side redirect
if (data.url) {
  window.location.href = data.url;
}

// Option 2: Load Stripe.js
// Add to app/layout.tsx:
<Script src="https://js.stripe.com/v3/" />
```

---

## ⚠️ MEDIUM PRIORITY ISSUES

### Issue #7: RLS Policies Too Permissive

**Problem**: RLS policies allow ALL reads on subscriptions/invoices/payment_methods.

**Current Policy**:
```sql
CREATE POLICY "Users can view subscriptions" ON subscriptions
  FOR SELECT USING (true);  -- ❌ Anyone can view any subscription!
```

**Should Be**:
```sql
CREATE POLICY "Users can view own org subscriptions" ON subscriptions
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );
```

**Impact**:
- Data leakage between organizations
- Security vulnerability
- GDPR/compliance issues

---

### Issue #8: No Test Mode Indicator

**Problem**: No visual indicator whether app is in Stripe test mode or live mode.

**Impact**:
- Accidentally process real payments in development
- Accidentally use test mode in production
- Confusion about which environment is active

**Fix**: Add indicator to dashboard:
```typescript
{process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') && (
  <div className="bg-yellow-500 text-black p-2 text-center">
    ⚠️ STRIPE TEST MODE ACTIVE
  </div>
)}
```

---

### Issue #9: No Retry Logic for Failed Webhooks

**Problem**: If webhook handler fails, Stripe will retry, but we don't track failures.

**Recommendation**: Add webhook event logging table:
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE,
  event_type TEXT,
  processed_at TIMESTAMP,
  error TEXT,
  retry_count INTEGER DEFAULT 0
);
```

---

### Issue #10: TODO Comments in Production Code

**Found in webhook handler**:
- Line 407: `// TODO: Send email notification to customer` (payment failed)
- Line 416: `// TODO: Send email notification to customer` (action required)
- Line 507: `// TODO: Send email notification to customer` (payment failed)

**Impact**:
- Customers won't receive payment failure notifications
- Increased churn (users don't know why card failed)
- Support ticket volume increases

---

## 📋 PRE-LAUNCH CHECKLIST

### Environment Configuration
- [ ] Add all Stripe env vars to `.env.example`
- [ ] Set `STRIPE_SECRET_KEY` (live key: `sk_live_...`)
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live key: `pk_live_...`)
- [ ] Set `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard)
- [ ] Set `NEXT_PUBLIC_URL` (production domain)
- [ ] Create Stripe products/prices for both plans
- [ ] Set `STRIPE_PRICE_ID_STARTER` (or STANDARD)
- [ ] Set `STRIPE_PRICE_ID_PROFESSIONAL`

### Code Fixes
- [ ] Fix pricing page plan name mismatch (standard vs starter)
- [ ] Add Stripe.js script loading OR use direct URL redirect
- [ ] Update RLS policies for proper workspace isolation
- [ ] Add currency validation in checkout
- [ ] Update database default currency to AUD
- [ ] Add error handling in pricing page `handleCheckout`
- [ ] Add test mode indicator to dashboard
- [ ] Implement customer email notifications (TODO items)

### Stripe Dashboard Configuration
- [ ] Create live mode products ("Starter" and "Professional")
- [ ] Create recurring prices (monthly) in AUD
- [ ] Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select webhook events to send (all 10 handled events)
- [ ] Copy webhook signing secret to env vars
- [ ] Test webhook delivery
- [ ] Configure billing portal settings
- [ ] Set up tax collection (if needed for AU)
- [ ] Configure email receipts
- [ ] Add business information (legal entity, address)

### Database
- [ ] Run migration 012 (subscriptions tables)
- [ ] Update RLS policies
- [ ] Verify indexes created
- [ ] Test workspace isolation

### Testing (Critical!)
- [ ] Test full checkout flow (test mode)
- [ ] Verify webhook events received and processed
- [ ] Test subscription creation
- [ ] Test subscription upgrade/downgrade
- [ ] Test subscription cancellation
- [ ] Test failed payment handling
- [ ] Test invoice generation
- [ ] Verify database records match Stripe data
- [ ] Test billing portal access
- [ ] Verify email notifications sent

### Monitoring & Alerts
- [ ] Set up Stripe webhook failure alerts
- [ ] Monitor payment failure rate
- [ ] Track subscription churn
- [ ] Monitor failed payment notifications
- [ ] Set up revenue tracking

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### 1. IMMEDIATE (Before ANY Testing)

**A. Fix Plan Name Mismatch** (5 minutes)

Update `src/lib/stripe/client.ts`:
```typescript
export const PLAN_TIERS = {
  standard: {  // Change from "starter"
    name: "Standard",
    priceId: process.env.STRIPE_PRICE_ID_STANDARD!,
    price: 9900, // $99/month
    currency: "usd",
    interval: "month",
    features: [
      "Unlimited Client Accounts",
      "Unlimited contacts",
      "Email processing & tracking",
      // ... rest from pricing page
    ],
  },
  // Remove starter/professional OR keep all three
} as const;
```

Update `src/app/api/stripe/checkout/route.ts`:
```typescript
if (plan !== "standard") {
  return NextResponse.json(
    { error: "Invalid plan. Must be 'standard'" },
    { status: 400 }
  );
}
```

**B. Add Environment Variables** (2 minutes)

Update `.env.example` with Stripe section (see Issue #1 above).

**C. Fix Stripe Redirect** (3 minutes)

Update `src/app/pricing/page.tsx`:
```typescript
const data = await res.json();

if (!res.ok) {
  alert(`Error: ${data.error || "Failed to create checkout session"}`);
  setIsLoading(false);
  return;
}

// Use direct URL redirect instead of Stripe client
if (data.url) {
  window.location.href = data.url;
} else {
  alert("Checkout session created but no URL provided");
  setIsLoading(false);
}
```

### 2. BEFORE PRODUCTION DEPLOYMENT

**D. Update RLS Policies** (10 minutes)
**E. Add Currency Validation** (5 minutes)
**F. Add Test Mode Indicator** (5 minutes)
**G. Implement Email Notifications** (30 minutes)

### 3. BEFORE GOING LIVE

**H. Create Stripe Products** (15 minutes)
**I. Configure Webhook Endpoint** (10 minutes)
**J. Run Full Test Suite** (60 minutes)

---

## 💰 FINANCIAL RISK ASSESSMENT

**If Deployed As-Is**:
- ❌ 100% of payment attempts will fail (plan mismatch)
- ❌ $0 revenue generated
- ❌ Poor user experience (silent failures)
- ❌ Potential data leakage (RLS policies)
- ❌ No notification of failed payments
- ❌ Unable to debug issues (no logging)

**Estimated Revenue Loss**: **100% for first 24-48 hours** until issues discovered

---

## ✅ PRODUCTION READINESS SCORE

| Category | Score | Status |
|----------|-------|--------|
| **Code Quality** | 8/10 | ✅ Good |
| **Security** | 6/10 | ⚠️ Needs Work |
| **Functionality** | 3/10 | 🔴 Critical Issues |
| **Error Handling** | 7/10 | ⚠️ Needs Work |
| **Testing** | 0/10 | 🔴 Not Tested |
| **Documentation** | 5/10 | ⚠️ Needs Work |
| **Monitoring** | 4/10 | ⚠️ Needs Work |

**Overall**: **4.7/10** - 🔴 **NOT PRODUCTION READY**

---

## 📝 RECOMMENDED NEXT STEPS

1. **Fix Critical Issues** (30 minutes)
   - Update plan tier configuration
   - Add environment variables
   - Fix Stripe redirect logic

2. **Create Stripe Products** (15 minutes)
   - Log into Stripe Dashboard
   - Create "Standard" product
   - Create monthly price in USD ($99)
   - Copy price ID to environment

3. **Test Locally** (30 minutes)
   - Use Stripe test mode
   - Complete full checkout flow
   - Verify webhook events
   - Check database records

4. **Fix Medium Priority Issues** (60 minutes)
   - Update RLS policies
   - Add email notifications
   - Add test mode indicator
   - Implement error tracking

5. **Deploy to Staging** (30 minutes)
   - Test with Stripe test mode
   - Verify all webhooks work
   - Test edge cases

6. **Go Live** (When Above Complete)
   - Switch to live Stripe keys
   - Configure live webhook endpoint
   - Monitor first 24 hours closely

---

## 📞 SUPPORT & RESOURCES

**Stripe Documentation**:
- [Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)

**Internal Resources**:
- Test Suite: `src/lib/stripe/test-integration.ts`
- Database Migration: `supabase/migrations/012_subscriptions.sql`
- API Routes: `src/app/api/stripe/`

---

**Audit Completed By**: Claude Code Agent
**Date**: 2025-11-17
**Next Review**: After critical fixes implemented
**Status**: ⚠️ **BLOCKED FOR PRODUCTION** until issues resolved

---

## APPENDIX A: Required Environment Variables

```env
# ==================== Stripe ====================
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Stripe Product Price IDs
# Create products in Stripe Dashboard → Products
# Then copy the price IDs here
STRIPE_PRICE_ID_STANDARD=price_xxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret
# Get from: https://dashboard.stripe.com/webhooks
# After creating endpoint at: https://yourdomain.com/api/stripe/webhook
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Application URL (for Stripe redirects)
NEXT_PUBLIC_URL=https://yourdomain.com
```

## APPENDIX B: Stripe Dashboard Setup Steps

1. **Create Product**:
   - Go to Products → Add Product
   - Name: "Unite-Hub Standard"
   - Description: "AI-Powered CRM & Marketing Automation"
   - Pricing: $99.00 USD
   - Billing Period: Monthly
   - Click "Save product"
   - Copy Price ID → Add to `.env` as `STRIPE_PRICE_ID_STANDARD`

2. **Configure Webhook**:
   - Go to Developers → Webhooks → Add Endpoint
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send: Select all checkout, customer, invoice, and payment_intent events
   - Click "Add endpoint"
   - Copy Signing Secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

3. **Test Webhook**:
   - Click "Send test webhook"
   - Select event type: `customer.subscription.created`
   - Click "Send test webhook"
   - Verify received in your app logs

---

**END OF AUDIT REPORT**
