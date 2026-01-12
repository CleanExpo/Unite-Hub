# Design Token Violations - Raw Data

**Captured**: 2026-01-12
**Test File**: tests/design-tokens/token-usage.test.ts
**Total Violations**: 426 (25 UI + 401 pages)

---

## UI Component Violations (25 files)

| File | Violations |
|------|------------|
| src/components/ui/toaster.tsx | slate-700, slate-800, slate-100, slate-600, slate-400, red-500, red-950, red-100, red-400, green-400 |
| src/components/ui/Toast.tsx | red-600, blue-600, green-600, yellow-600 |
| src/components/ui/three-d-carousel.tsx | slate-900, slate-800 |
| src/components/ui/textarea.tsx | slate-700, slate-800, slate-900, slate-400, blue-500 |
| src/components/ui/stat-card.tsx | gray-500, slate-800, gray-200, slate-700, slate-400, red-500, emerald-500 |
| src/components/ui/Spinner.tsx | gray-600, gray-400, blue-600, blue-400 |
| src/components/ui/Slider.tsx | gray-200, gray-700 |
| src/components/ui/select.tsx | slate-700, slate-800, slate-300 |
| src/components/ui/popover.tsx | slate-700, slate-800 |
| src/components/ui/page-header.tsx | gray-500, gray-700, slate-400, slate-300, gray-400, slate-500, gray-200, slate-700 |
| src/components/ui/Modal.tsx | gray-900, gray-100, gray-400, gray-600, gray-200 |
| src/components/ui/metrics-card.tsx | gray-200, gray-300, gray-600, gray-700, gray-900, red-600, green-600 |
| src/components/ui/loading-skeleton.tsx | gray-200, slate-700, slate-800 |
| src/components/ui/image-comparison.tsx | gray-400 |
| src/components/ui/dropdown-menu.tsx | slate-700, slate-800, slate-300 |
| src/components/ui/dock.tsx | gray-900 |
| src/components/ui/dialog.tsx | slate-400 |
| src/components/ui/command.tsx | slate-800, slate-700, slate-400, slate-300 |
| src/components/ui/button.tsx | red-600, red-700, red-800, green-600, green-700, green-800 |
| src/components/ui/Breadcrumbs.tsx | gray-400, gray-100, gray-600 |
| src/components/ui/visual/AIModelBadge.tsx | blue-700, blue-400, blue-100, blue-900, green-700, green-400, green-100, green-900, amber-700, amber-400, amber-100, amber-900, purple-700, purple-400, purple-100, purple-900 |
| src/components/ui/about-page/CreativeLabInfoDrawer.tsx | gray-400, gray-600, gray-300, gray-500, gray-700, gray-200, red-600, red-400, blue-500, green-600, green-400, green-500, purple-500 |
| src/components/ui/footer/TransparencyFooter.tsx | green-500 |
| src/components/ui/video/VideoApprovalCard.tsx | gray-400, red-600, red-400, red-50, red-900, green-600, green-400, green-50, green-900, yellow-50, yellow-900, yellow-600, yellow-700, yellow-300, yellow-400 |
| src/components/ui/onboarding/CreativeLabIntroModal.tsx | gray-400, gray-600, gray-300, green-500, yellow-50, yellow-900, yellow-200, yellow-800, yellow-600, yellow-700, yellow-300 |

---

## Page Violations (401 files)

### High-Impact Pages (>15 violations)

| File | Color Count |
|------|-------------|
| src/app/founder/synthex-seo/page.tsx | 30+ |
| src/app/founder/negotiation/page.tsx | 35+ |
| src/app/founder/network/page.tsx | 24+ |
| src/app/founder/intelligence-hub/page.tsx | 26+ |
| src/app/founder/agi-brain/page.tsx | 31+ |
| src/app/founder/agi-console/page.tsx | 30+ |
| src/app/founder/blue-ocean/page.tsx | 26+ |
| src/app/guardian/admin/network/page.tsx | 33+ |
| src/app/guardian/admin/integrations/page.tsx | 29+ |
| src/app/guardian/admin/lifecycle/page.tsx | 31+ |
| src/app/guardian/admin/editions/page.tsx | 34+ |
| src/app/guardian/plugins/industry/government/page.tsx | 40+ |
| src/app/guardian/plugins/industry/healthcare/page.tsx | 31+ |
| src/app/dashboard/aido/onboarding/page.tsx | 32+ |
| src/app/dashboard/aido/reality-loop/page.tsx | 35+ |

### Dashboard Pages

| File | Violations |
|------|------------|
| src/app/dashboard/page.tsx | slate-950, slate-400 |
| src/app/dashboard/workspaces/page.tsx | slate-800, slate-700, slate-400, slate-300, slate-900, slate-500, slate-600, red-500, red-400, red-900, blue-100, blue-600, blue-700, blue-500, blue-400, cyan-400, green-500, green-400, emerald-400, purple-100, purple-600, purple-700, purple-400, pink-400 |
| src/app/dashboard/vault/page.tsx | gray-400, gray-500, cyan-800, cyan-400, cyan-500, cyan-900 |
| src/app/dashboard/time-tracker/page.tsx | slate-400, slate-800, slate-700, cyan-600, cyan-700 |
| src/app/dashboard/team/page.tsx | slate-400, slate-800, slate-700, slate-600, slate-300, slate-900, red-100, red-700, red-200, red-500, blue-100, blue-600, blue-700, blue-500, blue-400, cyan-400, green-100, green-700, green-200, green-500, yellow-100, yellow-700, yellow-200, yellow-500, purple-100, purple-600, purple-700, purple-400 |
| src/app/dashboard/tasks/page.tsx | slate-400, slate-800, slate-700, slate-500, red-500, red-400, cyan-600, cyan-700, cyan-500, emerald-500, yellow-500, yellow-400 |
| src/app/dashboard/settings/page.tsx | slate-800, slate-700, slate-900, blue-100, purple-100 |
| src/app/dashboard/contacts/page.tsx | slate-400, slate-800, slate-700, slate-500, slate-300, slate-600, red-500, red-400, red-300, blue-100, blue-600, blue-700, blue-500, cyan-500, blue-400, blue-300, green-500, emerald-500, green-400, amber-500, amber-400, purple-100, purple-600, purple-700, purple-500, pink-500 |
| src/app/dashboard/campaigns/page.tsx | blue-600, blue-700, blue-100, blue-500, purple-600, purple-700, purple-100 |
| src/app/dashboard/billing/page.tsx | slate-800, slate-700, slate-900, slate-400, slate-600, slate-300, red-500, blue-500, cyan-500, blue-100, blue-600, blue-700, blue-400, green-500, green-400, yellow-500, yellow-400, purple-500, pink-500, purple-100, purple-600, purple-700, purple-400, pink-600 |
| src/app/dashboard/analytics/page.tsx | blue-100, purple-100 |
| src/app/dashboard/overview/page.tsx | gray-400, cyan-800, cyan-400, cyan-900, cyan-500, emerald-500, emerald-400 |
| src/app/dashboard/monitoring/page.tsx | gray-600, gray-50, gray-200, gray-400, gray-900, gray-500, red-600, red-50, red-200, red-400, blue-600, green-600, green-50, green-200, green-400, green-500, yellow-600, yellow-50, yellow-200 |

### Founder OS Pages (largest category)

Over 100 Founder pages with violations. Sample:

| File | Violations |
|------|------------|
| src/app/founder/page.tsx | gray-100, gray-400, gray-800, gray-700, gray-500, red-400, red-500, blue-500, blue-600, blue-700, blue-400, green-400, green-500, green-600, yellow-400, yellow-500, yellow-600, purple-400, purple-600, pink-600, purple-500 |
| src/app/founder/ai-phill/page.tsx | gray-100, gray-400, gray-800, gray-700, gray-600, gray-900, gray-300, gray-500, blue-600, blue-700, blue-400, blue-500, green-600, green-500, green-400, yellow-400, purple-600, purple-700, purple-400 |
| src/app/founder/cognitive-twin/page.tsx | green-500, green-600, yellow-500, yellow-600, yellow-50, yellow-950, yellow-900, yellow-100, yellow-800, yellow-200 |
| src/app/founder/businesses/page.tsx | gray-800, gray-700, gray-100, gray-400, gray-500, gray-900, gray-600, red-400, red-500, red-600, blue-500, blue-600, blue-700, green-400, green-500, green-600, yellow-400, yellow-500, yellow-600 |

### Guardian Pages

| File | Violations |
|------|------------|
| src/app/guardian/risk/page.tsx | red-400, cyan-400, amber-400 |
| src/app/guardian/rules/page.tsx | green-500, green-400, amber-500, amber-600 |
| src/app/guardian/readiness/page.tsx | slate-100, slate-800, slate-500, slate-400, slate-200, slate-50, emerald-100, emerald-800, amber-100, amber-900, rose-100, rose-800, rose-500 |
| src/app/guardian/insights/page.tsx | red-400, cyan-400, amber-400 |
| src/app/guardian/executive/page.tsx | slate-100, slate-800, slate-500, slate-400, slate-200, slate-50, slate-900, emerald-100, emerald-800, amber-100, amber-900, rose-100, rose-800, rose-500 |
| src/app/guardian/alerts/page.tsx | emerald-500, emerald-400, amber-500, amber-400 |
| src/app/guardian/activity/page.tsx | red-500, red-400, cyan-500, cyan-400, sky-500, sky-400, green-500, green-400, amber-500, amber-400 |

### CRM Pages

| File | Violations |
|------|------------|
| src/app/crm/staff/page.tsx | red-500, red-400, red-300, green-500, green-400, green-300, green-600, green-700 |
| src/app/crm/dashboard/page.tsx | blue-500, green-500, purple-500 |

### Auth Pages

| File | Violations |
|------|------------|
| src/app/auth/signup/page.tsx | slate-950, slate-900, slate-800, slate-700, slate-400, slate-600, blue-600, blue-700, blue-400, blue-300 |
| src/app/auth/signin/page.tsx | slate-950, slate-900, gray-900, gray-600, gray-50, gray-300, gray-200, gray-500, gray-700, red-50, red-200, red-700, blue-900, blue-500, blue-200, blue-50, blue-100, blue-600, blue-700, green-600, purple-500, purple-50 |
| src/app/login/page.tsx | gray-950, gray-900, gray-800, gray-400, gray-700, gray-500, gray-100, red-500, red-400 |

---

## Violation Categories Summary

### By Color Family

| Color Family | Approximate Count |
|--------------|-------------------|
| gray-* | ~200 |
| slate-* | ~150 |
| blue-* | ~180 |
| green-* | ~120 |
| red-* | ~100 |
| yellow-* | ~90 |
| amber-* | ~80 |
| purple-* | ~60 |
| cyan-* | ~40 |
| emerald-* | ~30 |
| pink-* | ~20 |
| rose-* | ~15 |
| sky-* | ~10 |
| violet-* | ~10 |
| fuchsia-* | ~5 |

### By Violation Type

| Type | Token Replacement |
|------|-------------------|
| gray-50 to gray-100 | bg-card, bg-hover |
| gray-200 to gray-400 | text-secondary, border-subtle |
| gray-500 to gray-700 | text-muted, text-secondary |
| gray-800 to gray-950 | text-primary, bg-base |
| slate-* | Same as gray-* |
| red-* | error-50 to error-900 |
| blue-* | info-50 to info-900 |
| green-* | success-50 to success-900 |
| yellow-*, amber-* | warning-50 to warning-900 |
| orange-* | accent-50 to accent-900 |

---

## Test Results

```
5/5 tests passed
UI Component Violations: 25 (threshold: ≤30)
Page Violations: 401 (threshold: ≤450)
```
