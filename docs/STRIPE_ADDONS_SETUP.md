# Stripe Add-On Products Configuration Guide

**Status**: P3-003 - Future Enhancement (After Core Plans Stable)
**Last Updated**: 2025-11-28
**Priority**: Post-Launch

## Overview

This document outlines the add-on products to be created in Stripe once the core subscription plans (Starter, Pro, Elite) are fully operational and validated.

## Current System Support

The pricing configuration (`src/lib/billing/pricing-config.ts`) already supports overages:

| Overage Type | Starter | Pro | Elite |
|--------------|---------|-----|-------|
| AI Tokens (per 1,000) | A$0.015 | A$0.012 | A$0.010 |
| Extra Audit | A$5 | A$3 | A$1 |

## Recommended Add-On Products

### 1. Extra Team Seats

**Purpose**: Allow customers to add team members beyond plan limits

| Add-On | Price (AUD) | Billing |
|--------|-------------|---------|
| Extra Seat (Starter) | A$49/month | Recurring |
| Extra Seat (Pro) | A$39/month | Recurring |
| Extra Seat (Elite) | A$29/month | Recurring |

**Stripe Product Setup**:
```
Product Name: Extra Team Seat
Pricing: Metered or per-unit recurring
Metadata: { "type": "addon", "category": "seats" }
```

### 2. Extra Brands/Projects (Synthex)

**Purpose**: Enable multi-brand management beyond plan limits

| Add-On | Price (AUD) | Billing |
|--------|-------------|---------|
| Extra Brand (Launch) | A$99/month | Recurring |
| Extra Brand (Growth) | A$79/month | Recurring |
| Extra Brand (Scale) | Included | - |

**Stripe Product Setup**:
```
Product Name: Additional Brand Slot
Pricing: Per-unit recurring
Metadata: { "type": "addon", "category": "brands" }
```

### 3. Additional Job Credits (Synthex)

**Purpose**: One-time purchase of additional content generation jobs

| Add-On | Price (AUD) | Jobs |
|--------|-------------|------|
| Job Pack - Small | A$29 | 10 jobs |
| Job Pack - Medium | A$49 | 25 jobs |
| Job Pack - Large | A$99 | 75 jobs |

**Stripe Product Setup**:
```
Product Name: Content Job Pack
Pricing: One-time
Metadata: { "type": "addon", "category": "jobs", "quantity": X }
```

### 4. AI Token Top-Up

**Purpose**: One-time purchase of additional AI tokens

| Add-On | Price (AUD) | Tokens |
|--------|-------------|--------|
| Token Pack - 50K | A$9 | 50,000 tokens |
| Token Pack - 200K | A$29 | 200,000 tokens |
| Token Pack - 1M | A$99 | 1,000,000 tokens |

**Stripe Product Setup**:
```
Product Name: AI Token Pack
Pricing: One-time
Metadata: { "type": "addon", "category": "tokens", "quantity": X }
```

### 5. Priority Support Upgrade

**Purpose**: Upgrade to priority support from any plan

| Add-On | Price (AUD) | Billing |
|--------|-------------|---------|
| Priority Support | A$149/month | Recurring |

**Features**:
- 4-hour response time (vs 24-48 hour standard)
- Dedicated support channel
- Monthly strategy call
- Priority feature requests

**Stripe Product Setup**:
```
Product Name: Priority Support
Pricing: Recurring monthly
Metadata: { "type": "addon", "category": "support" }
```

### 6. White Label Add-On

**Purpose**: Remove Synthex branding for agencies

| Add-On | Price (AUD) | Billing |
|--------|-------------|---------|
| White Label | A$299/month | Recurring |

**Features**:
- Custom domain support
- Remove all Synthex branding
- Custom email sender domain
- Branded reports/exports

**Stripe Product Setup**:
```
Product Name: White Label Package
Pricing: Recurring monthly
Metadata: { "type": "addon", "category": "whitelabel" }
```

## Implementation Steps

### Step 1: Create Products in Stripe Dashboard

1. Navigate to: https://dashboard.stripe.com/products
2. Create each add-on product with appropriate pricing
3. Note the `price_xxxx` IDs for each add-on

### Step 2: Update Environment Variables

```bash
# Add-on Price IDs
STRIPE_PRICE_ID_ADDON_SEAT_STARTER="price_xxxx"
STRIPE_PRICE_ID_ADDON_SEAT_PRO="price_xxxx"
STRIPE_PRICE_ID_ADDON_SEAT_ELITE="price_xxxx"
STRIPE_PRICE_ID_ADDON_BRAND_LAUNCH="price_xxxx"
STRIPE_PRICE_ID_ADDON_BRAND_GROWTH="price_xxxx"
STRIPE_PRICE_ID_ADDON_JOBS_SMALL="price_xxxx"
STRIPE_PRICE_ID_ADDON_JOBS_MEDIUM="price_xxxx"
STRIPE_PRICE_ID_ADDON_JOBS_LARGE="price_xxxx"
STRIPE_PRICE_ID_ADDON_TOKENS_50K="price_xxxx"
STRIPE_PRICE_ID_ADDON_TOKENS_200K="price_xxxx"
STRIPE_PRICE_ID_ADDON_TOKENS_1M="price_xxxx"
STRIPE_PRICE_ID_ADDON_PRIORITY_SUPPORT="price_xxxx"
STRIPE_PRICE_ID_ADDON_WHITE_LABEL="price_xxxx"
```

### Step 3: Extend Pricing Config

Add to `src/lib/billing/pricing-config.ts`:

```typescript
export interface AddOnProduct {
  id: string;
  name: string;
  price: number;
  currency: "AUD";
  type: "recurring" | "one-time";
  category: "seats" | "brands" | "jobs" | "tokens" | "support" | "whitelabel";
  stripePriceId: string;
  applicablePlans?: string[]; // Which plans can purchase this add-on
  quantity?: number; // For one-time packs
}

export const ADDON_PRODUCTS: Record<string, AddOnProduct> = {
  // ... add-on definitions
};
```

### Step 4: Create Add-On Purchase API

Create `/api/stripe/addon-purchase/route.ts`:

```typescript
// Handle add-on purchases via Stripe Checkout
// Support both subscription add-ons and one-time purchases
```

### Step 5: Update Dashboard UI

- Add "Manage Add-ons" section to billing page
- Show available add-ons based on current plan
- Display current add-on usage

## Webhook Handling

Ensure webhook handles these events for add-ons:

```typescript
// Add to BILLING_CONFIG.webhookEvents
"checkout.session.completed", // One-time add-on purchases
"invoice.paid",                // Recurring add-on payments
```

## Database Schema

Consider adding:

```sql
CREATE TABLE addon_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  addon_id TEXT NOT NULL,
  stripe_subscription_item_id TEXT,
  stripe_invoice_id TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Priority Order

1. **Phase 1** (Post-Launch): AI Token Top-Up, Extra Seats
2. **Phase 2**: Extra Brands, Job Packs
3. **Phase 3**: Priority Support, White Label

## Code References

- Pricing config: `src/lib/billing/pricing-config.ts`
- Stripe checkout: `src/app/api/stripe/checkout/route.ts`
- Billing dashboard: `src/app/synthex/billing/page.tsx`

## Notes

- All prices in AUD, GST inclusive
- Test add-ons in Stripe Test Mode before production
- Consider usage-based billing for tokens (metered billing)
- White label requires additional infrastructure setup
