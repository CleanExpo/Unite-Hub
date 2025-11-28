# P3: Product Surface Completion Audit

**Date**: 2025-11-28
**Status**: COMPLETE (Issues Documented)

---

## Executive Summary

**Critical Finding**: Three different pricing systems exist with conflicting values. This must be reconciled before launch.

---

## P3-T1: Tier Configuration Analysis

### Pricing Discrepancy Matrix

| Source | File | Starter | Pro | Elite/Enterprise |
|--------|------|---------|-----|------------------|
| Billing Config | `src/lib/billing/pricing-config.ts` | $495 AUD | $895 AUD | $1,295 AUD |
| Stripe Client | `lib/stripe/client.ts` | $249 AUD | $549 AUD | - |
| Marketing Page | `src/app/(marketing)/pricing/page.tsx` | $29 USD | $99 USD | Contact Sales |
| Audit Tiers | `src/server/tierLogic.ts` | (features only) | (features only) | (features only) |

### Analysis

1. **pricing-config.ts** - Used by billing engine, has Stripe price ID placeholders
2. **lib/stripe/client.ts** - Legacy Stripe integration, different prices
3. **pricing/page.tsx** - Marketing page shows lowest prices (USD)

### Recommendation

**Canonical Source**: `src/lib/billing/pricing-config.ts` should be the single source of truth.

Actions needed:
1. Update `lib/stripe/client.ts` to use pricing-config.ts
2. Update `pricing/page.tsx` to display AUD prices from pricing-config.ts
3. Create actual Stripe products matching pricing-config.ts

---

## P3-T2: Add-on Product Codes

### Found Add-on Types

**File**: `src/lib/seo/auditTypes.ts`

```typescript
type AddonType =
  | "competitor_tracking"
  | "local_pack_tracker"
  | "social_intelligence"
  | "content_velocity"
```

### Add-on Status

| Add-on | Stripe Product | Implementation |
|--------|---------------|----------------|
| competitor_tracking | Not created | tierLogic.ts handles |
| local_pack_tracker | Not created | tierLogic.ts handles |
| social_intelligence | Not created | tierLogic.ts handles |
| content_velocity | Not created | tierLogic.ts handles |

**Status**: Add-on logic exists but no Stripe products created.

---

## P3-T3: Trial Flow Analysis

### Trial Configuration

**File**: `src/lib/billing/pricing-config.ts`

```typescript
export const TRIAL_CONFIG = {
  durationDays: 14,          // 14-day trial
  features: "pro",           // Full Pro features
  requireCard: false,        // No card required
  reminderDays: [7, 3, 1],   // Email reminders
  gracePeriodDays: 3,        // Grace period after trial
};
```

### Trial Components Found

| Component | File | Status |
|-----------|------|--------|
| Trial Experience Engine | `src/lib/trial/trialExperienceEngine.ts` | Implemented |
| Trial Capability Profile | `src/lib/trial/trialCapabilityProfile.ts` | Implemented |
| Trial Upgrade Prompt | `src/components/trial/TrialUpgradePrompt.tsx` | Implemented |
| Trial Capability Banner | `src/components/trial/TrialCapabilityBanner.tsx` | Implemented |

### Trial Flow Status

- **Countdown display**: Uses `daysRemaining`, `hoursRemaining`
- **Upgrade prompts**: Contextual, urgency-based (low/medium/high)
- **Reminders**: Configured for days 7, 3, 1
- **Soft limits**: AI tokens (allow overrun with warning)
- **Hard limits**: VIF generations, blueprints (block at cap)

**Note**: Task spec mentions 7-day countdown but code uses 14-day trial.

---

## P3-T4: Audit Wizard Page

### Search Results

No dedicated audit wizard page found at `**/audit*wizard*.tsx`.

### Related Audit Components

| Component | File | Purpose |
|-----------|------|---------|
| Audit Types | `src/lib/seo/auditTypes.ts` | Type definitions |
| Tier Logic | `src/server/tierLogic.ts` | Audit configuration |
| SEO Config | `src/lib/seo/seoConfig.ts` | SEO audit settings |

**Status**: Audit wizard page does not exist - may need creation.

---

## P3-T5: Stripe Product ID Mapping

### Current Stripe Price IDs (Placeholders)

**File**: `src/lib/billing/pricing-config.ts`

| Plan | Monthly | Annual |
|------|---------|--------|
| Starter | `price_starter_monthly` | `price_starter_annual` |
| Pro | `price_pro_monthly` | `price_pro_annual` |
| Elite | `price_elite_monthly` | `price_elite_annual` |

### Legacy Stripe IDs

**File**: `lib/stripe/client.ts`

```typescript
priceId: process.env.STRIPE_PRICE_ID_STARTER!,
priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
```

**Status**: Stripe Price IDs are placeholders. Real IDs need to be created in Stripe Dashboard and added to environment variables.

---

## Issues Identified

### Critical (Must Fix Before Launch)

1. **P3-001**: Three pricing systems with conflicting values
2. **P3-002**: Stripe products not created
3. **P3-003**: Price IDs are placeholder strings

### Medium Priority

4. **P3-004**: Add-on products not in Stripe
5. **P3-005**: Audit wizard page doesn't exist

### Low Priority

6. **P3-006**: Trial duration mismatch (spec says 7-day, code says 14-day)

---

## Recommendations

### Immediate Actions

1. **Consolidate pricing** to single source: `pricing-config.ts`
2. **Create Stripe products** matching pricing-config values
3. **Update environment variables** with real Stripe Price IDs:
   ```env
   STRIPE_PRICE_ID_STARTER_MONTHLY=price_xxx
   STRIPE_PRICE_ID_STARTER_ANNUAL=price_xxx
   STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
   STRIPE_PRICE_ID_PRO_ANNUAL=price_xxx
   STRIPE_PRICE_ID_ELITE_MONTHLY=price_xxx
   STRIPE_PRICE_ID_ELITE_ANNUAL=price_xxx
   ```

### Marketing Page Fix

Update `pricing/page.tsx` to:
1. Import from `pricing-config.ts`
2. Display AUD prices (not USD)
3. Use `formatPrice()` helper

---

**Generated**: 2025-11-28
**Audit Phase**: P3
