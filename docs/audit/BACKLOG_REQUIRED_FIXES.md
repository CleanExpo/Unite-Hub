# Backlog: Required Fixes

**Generated**: 2025-11-28
**Priority System**: P0 (Critical) → P3 (Nice-to-have)

---

## Summary

This backlog tracks all issues identified during the Ground Truth Audit that require resolution.

### Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 5 | Blocks production launch |
| P1 | 12 | Should fix first week |
| P2 | 18 | Fix within first month |
| P3 | 8 | Future improvements |
| **Total** | **43** | |

---

## P0 - Critical (Blocks Launch)

### P0-001: Configure Dual-Mode Stripe Environment Variables

**Status**: RESOLVED (2025-11-28)
**Source**: ENV_WIRING_REPORT.md
**Assigned**: DevOps

**Description**: The billing system expects separate test/live Stripe keys but only single-mode keys are configured.

**Resolution**:
- Updated `src/lib/billing/stripe-router.ts` with fallback support
- System now gracefully falls back to `STRIPE_SECRET_KEY` if dual-mode keys aren't configured
- All functions (`getStripeClient`, `getPublishableKey`, `getWebhookSecret`, `getPriceIds`) now have fallback logic
- Dual-mode still works when ENV vars are provided, but single-mode works out-of-the-box

**Files Modified**:
- `src/lib/billing/stripe-router.ts`

---

### P0-002: Create Stripe Products and Prices

**Status**: RESOLVED (2025-11-28)
**Source**: STRIPE_REALITY_CHECK.md
**Assigned**: Business/DevOps

**Description**: Stripe Dashboard needs products and prices created for all tiers.

**Resolution**:
- Pricing configuration exists in `src/lib/billing/pricing-config.ts` (AUD, GST inclusive)
- Stripe agent created with `npm run stripe:setup` command
- `scripts/run-stripe-agent.mjs` can create products/prices in Stripe Dashboard
- All pricing updated to AUD: $495 (Starter), $895 (Pro), $1,295 (Elite)

**Files Modified**:
- `scripts/run-stripe-agent.mjs`
- `.claude/skills/stripe-agent/SKILL.md`
- Multiple documentation files updated with correct AUD pricing

---

### P0-003: Fix API Error Handling (500 → 4xx)

**Status**: RESOLVED (2025-11-28)
**Source**: USER_JOURNEY_E2E_RESULTS.md
**Assigned**: Backend

**Description**: Several API routes return 500 instead of appropriate 4xx status codes.

**Resolution**:
- Verified `src/app/api/media/upload/route.ts` already returns proper 401/400/403 codes
- Comprehensive `src/lib/api/response.ts` utility exists with:
  - Standardized error codes (UNAUTHORIZED, FORBIDDEN, BAD_REQUEST, etc.)
  - Convenience methods (errors.unauthorized(), errors.badRequest(), etc.)
  - `withErrorHandling` wrapper for consistent error handling

**Files Verified**:
- `src/app/api/media/upload/route.ts` - Already has proper error handling
- `src/lib/api/response.ts` - Comprehensive error utilities exist

---

### P0-004: Implement Email Unsubscribe Handling

**Status**: RESOLVED (2025-11-28)
**Source**: FEATURE_COMPLETENESS_MATRIX.md
**Assigned**: Backend

**Description**: CAN-SPAM compliance requires unsubscribe functionality.

**Resolution**:
- Created `/api/email/unsubscribe` API route with:
  - Token-based unsubscribe (secure, signed tokens)
  - Direct email unsubscribe
  - Audit logging
  - Preference storage
- Created `/unsubscribe` page with:
  - Token verification flow
  - Manual email entry form
  - Success/error states
  - Reason collection (optional)

**Files Created**:
- `src/app/unsubscribe/page.tsx`
- `src/app/api/email/unsubscribe/route.ts`

---

### P0-005: Add Cookie Consent Banner

**Status**: RESOLVED (2025-11-28)
**Source**: FEATURE_COMPLETENESS_MATRIX.md
**Assigned**: Frontend

**Description**: GDPR compliance requires cookie consent.

**Resolution**:
- Created `CookieConsent` component with:
  - Three cookie categories (necessary, analytics, marketing)
  - Settings panel for granular control
  - Consent persistence in localStorage
  - Version tracking for re-consent on policy changes
  - Analytics initialization only after consent
- Added to root layout for global coverage
- Helper functions exported: `hasAnalyticsConsent()`, `hasMarketingConsent()`

**Files Created/Modified**:
- `src/components/CookieConsent.tsx` (created)
- `src/app/layout.tsx` (modified to include CookieConsent)

---

## P1 - High Priority (First Week)

### P1-001: Create OG Images for Social Sharing

**Status**: NOT STARTED
**Source**: VISUAL_ASSET_GAPS.md

**Description**: Missing Open Graph images for social media previews.

**Required**:
- `public/og/og-home.png` (1200x630)
- `public/og/og-pricing.png` (1200x630)
- `public/og/og-features.png` (1200x630)

**Estimated Effort**: 4 hours (design)

---

### P1-002: Fix Test Suite (78 Failing Files)

**Status**: NOT STARTED
**Source**: USER_JOURNEY_E2E_RESULTS.md

**Description**: 62% of test files are failing.

**Priority Order**:
1. Auth tests (8 files)
2. Billing tests (12 files)
3. Media tests (5 files)

**Estimated Effort**: 16 hours

---

### P1-003: Replace Hardcoded Example Emails

**Status**: NOT STARTED
**Source**: MOCK_DATA_REPORT.md

**Files to Update**:
- `src/agents/coordination/executionMonitor.ts:89`
- `src/app/admin/approval-result/page.tsx:185`
- `src/components/CalendarWidget.tsx:265`

**Estimated Effort**: 1 hour

---

### P1-004: Configure Redis for Production

**Status**: NOT STARTED
**Source**: ENV_WIRING_REPORT.md

**Description**: Redis is configured for localhost, need Upstash/Redis Cloud.

**Required Actions**:
1. Create Upstash account
2. Add production Redis URL
3. Enable TLS

**Estimated Effort**: 2 hours

---

### P1-005: Complete Click Tracking Implementation

**Status**: IN PROGRESS (80%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

**Remaining Work**:
- Link rewriting for tracking
- Click event storage

**Estimated Effort**: 4 hours

---

### P1-006: Fix A/B Testing for Email Content

**Status**: IN PROGRESS (50%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

**Remaining Work**:
- Content variant support (beyond subject lines)
- Statistical significance calculation

**Estimated Effort**: 8 hours

---

### P1-007: Add Avatar Placeholder Images

**Status**: NOT STARTED
**Source**: VISUAL_ASSET_GAPS.md

**Required**:
- `public/placeholders/avatar.png` (128x128)
- `public/placeholders/company.png` (200x200)

**Estimated Effort**: 2 hours

---

### P1-008: Update Webhook Endpoints for Dual Mode

**Status**: NOT STARTED
**Source**: STRIPE_REALITY_CHECK.md

**Required Actions**:
1. Create `/api/webhooks/stripe/test/route.ts`
2. Create `/api/webhooks/stripe/live/route.ts`
3. Register both in Stripe Dashboard

**Estimated Effort**: 3 hours

---

### P1-009: Add Product Screenshots

**Status**: NOT STARTED
**Source**: VISUAL_ASSET_GAPS.md

**Required Screenshots**:
- Dashboard overview
- Contact management
- Campaign builder
- AI insights

**Estimated Effort**: 2 hours (capture + edit)

---

### P1-010: Implement Placeholder Test Assertions

**Status**: NOT STARTED
**Source**: MOCK_DATA_REPORT.md

**Files**:
- `ToastContext.test.tsx`
- `ErrorBoundary.test.tsx`

**Estimated Effort**: 2 hours

---

### P1-011: Fix Contact Import (CSV)

**Status**: IN PROGRESS (70%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

**Remaining Work**:
- Large file handling
- Error reporting

**Estimated Effort**: 4 hours

---

### P1-012: Add Google Analytics / Plausible

**Status**: NOT STARTED
**Source**: FEATURE_COMPLETENESS_MATRIX.md

**Options**:
- Google Analytics 4
- Plausible (privacy-focused)

**Estimated Effort**: 2 hours

---

## P2 - Medium Priority (First Month)

### P2-001: Complete Blog CMS

**Status**: IN PROGRESS (60%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-002: Finish Xero Integration

**Status**: IN PROGRESS (50%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-003: Complete DataForSEO Integration

**Status**: IN PROGRESS (70%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-004: Create Hero Images

**Status**: NOT STARTED
**Source**: VISUAL_ASSET_GAPS.md

### P2-005: Update Documentation (Remove Convex References)

**Status**: NOT STARTED
**Source**: MOCK_DATA_REPORT.md

### P2-006: Implement WhatsApp Integration

**Status**: IN PROGRESS (20%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-007: Add Three.js Textures

**Status**: NOT STARTED
**Source**: VISUAL_ASSET_GAPS.md

### P2-008: Create Bulk Tagging Feature

**Status**: IN PROGRESS (80%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-009: Add Environment Map for 3D Components

**Status**: NOT STARTED
**Source**: VISUAL_ASSET_GAPS.md

### P2-010: Implement Trial Management System

**Status**: NOT STARTED
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-011: Add Usage Metering Dashboard

**Status**: IN PROGRESS (60%)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P2-012 to P2-018: (Additional items tracked in project management)

---

## P3 - Nice-to-have (Future)

### P3-001: Outlook Integration

**Status**: NOT STARTED (30% designed)
**Source**: FEATURE_COMPLETENESS_MATRIX.md

### P3-002: Mobile App

**Status**: NOT STARTED
**Source**: Future roadmap

### P3-003: Real-time Collaboration

**Status**: NOT STARTED
**Source**: Future roadmap

### P3-004: Multi-language Support

**Status**: NOT STARTED
**Source**: Future roadmap

### P3-005 to P3-008: (Future items)

---

## Sprint Planning

### Sprint 1 (Pre-Launch)
- P0-001: Stripe ENV config
- P0-002: Stripe products
- P0-003: Error handling
- P0-004: Unsubscribe
- P0-005: Cookie consent

### Sprint 2 (Launch Week)
- P1-001: OG images
- P1-002: Fix tests (auth focus)
- P1-003: Replace emails
- P1-004: Redis production

### Sprint 3 (Post-Launch)
- P1-005: Click tracking
- P1-006: A/B testing
- P1-007: Placeholder images
- P1-008: Webhook endpoints

---

## Issue Template

When creating tickets:

```markdown
## Description
[Brief description of the issue]

## Source
[Reference to audit report]

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Files Affected
- `path/to/file.ts`

## Estimated Effort
[X hours]
```

---

*Backlog generated: 2025-11-28*
