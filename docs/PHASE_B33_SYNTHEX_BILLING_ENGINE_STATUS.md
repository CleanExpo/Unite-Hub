# Phase B33: Synthex Billing, Plans, and Usage Metering Engine

**Status**: Complete
**Date**: 2025-12-07
**Phase**: B33 of Synthex Portal

## Overview

Phase B33 implements a flexible billing and subscription layer that can be used for Unite-Hub internal brands and external paying Synthex clients. Includes basic metering over AI tokens, emails, events, and other resources with limit warnings.

## Components Implemented

### 1. Database Migration (439_synthex_billing_plans.sql)

**Tables Created**:
- `synthex_billing_plans` - Available plans with pricing and limits
- `synthex_subscriptions` - Tenant subscriptions to plans
- `synthex_usage_meters` - Usage tracking per metric per period
- `synthex_invoices` - Invoice history

**Default Plans Seeded**:
| Plan | Monthly | Limits |
|------|---------|--------|
| Free | $0 | 10K AI tokens, 100 emails, 250 contacts |
| Starter | $49 | 100K AI tokens, 5K emails, 2.5K contacts |
| Professional | $149 | 500K AI tokens, 25K emails, 15K contacts |
| Enterprise | $499 | Unlimited |

**Key Features**:
- Helper function `get_tenant_usage_summary` for dashboard queries
- Helper function `record_usage` for atomic usage increments
- Full RLS policies for tenant isolation
- External billing provider ID placeholders (Stripe-ready)

### 2. Service Layer (billingPlanService.ts)

**Plan Management**:
- `getAvailablePlans()` - List all active public plans
- `getPlanByCode(code)` - Get specific plan
- `getPlanById(planId)` - Get plan by ID

**Subscription Management**:
- `getTenantSubscription(tenantId)` - Get current subscription with plan
- `upsertSubscription(tenantId, planCode, externalIds)` - Create/update subscription
- `cancelSubscription(tenantId, immediately)` - Cancel subscription

**Usage Metering**:
- `recordUsage(tenantId, metric, quantity)` - Record usage
- `incrementUsage(tenantId, metric, amount)` - Increment counter
- `getUsageSummary(tenantId, periodRange)` - Get usage with limits
- `classifyUsageAgainstLimits(tenantId)` - Get usage warnings

**Invoicing**:
- `getInvoices(tenantId, options)` - Get invoice history
- `createInvoice(tenantId, data)` - Create invoice

**Stripe Placeholders**:
- `createCheckoutSession()` - TODO when STRIPE_SECRET_KEY configured
- `handleStripeWebhook()` - TODO for webhook handling

### 3. API Routes

**GET /api/synthex/billing/plans**
- List available plans with formatted prices
- Optional: get specific plan by code

**GET/POST /api/synthex/billing/usage**
- GET: Get usage summary with warnings
- POST: Record or increment usage

### 4. UI Page (/synthex/billing)

Existing billing page from B22 covers:
- Current Plan display
- Usage Overview with progress bars
- Upgrade/Downgrade options
- Invoice history
- Payment methods

## Usage Examples

### Get Available Plans
```typescript
const plans = await getAvailablePlans();
```

### Subscribe to a Plan
```typescript
const subscription = await upsertSubscription('tenant-123', 'starter', {
  customerId: 'cus_xxx',
  subscriptionId: 'sub_xxx',
});
```

### Record Usage
```typescript
await incrementUsage('tenant-123', 'ai_tokens', 500);
```

### Check Usage Warnings
```typescript
const warnings = await classifyUsageAgainstLimits('tenant-123');
// Returns: [{ metric, level: 'warning'|'critical'|'exceeded', message, ... }]
```

## Metrics Tracked

| Metric | Description |
|--------|-------------|
| ai_tokens | Claude API token usage |
| emails_sent | Emails sent via campaigns |
| contacts | Total contacts in database |
| campaigns | Active campaigns |
| events | Tracked events |
| api_calls | API requests |
| team_members | Team member seats |

## Warning Levels

- **75%+**: Warning level
- **90%+**: Critical level
- **100%+**: Exceeded level

## Future Integration Points

1. **Stripe Integration**
   - Set STRIPE_SECRET_KEY to enable checkout
   - Webhook endpoint ready at /api/synthex/billing/webhook

2. **Usage-Based Billing**
   - Record overage at end of period
   - Generate usage-based invoices

3. **Plan Upgrades**
   - Prorated billing calculations
   - Immediate vs end-of-period upgrades

## Migration Notes

Run migration 439 in Supabase SQL Editor:
```sql
\i supabase/migrations/439_synthex_billing_plans.sql
```

## Related Phases

- B22: Plans & Entitlements Foundation
- B28: Stripe Integration (checkout flow)
