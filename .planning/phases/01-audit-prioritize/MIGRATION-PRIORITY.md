# Design Token Migration Priority List

**Milestone**: v1.1 Design Token Migration
**Target**: Reduce from 426 violations to <50 (90%+ compliance)

---

## Priority 1: UI Components (Phase 2)

**Goal**: 25 violations → 0
**Impact**: Foundation for all pages - highest ROI
**Estimated Effort**: 2-3 hours

### Files in Order of Violation Count

| Priority | File | Violations | Notes |
|----------|------|------------|-------|
| 1.1 | `src/components/ui/visual/AIModelBadge.tsx` | 16 | AI feature badges |
| 1.2 | `src/components/ui/video/VideoApprovalCard.tsx` | 15 | Video approval UI |
| 1.3 | `src/components/ui/about-page/CreativeLabInfoDrawer.tsx` | 13 | Drawer component |
| 1.4 | `src/components/ui/onboarding/CreativeLabIntroModal.tsx` | 11 | Onboarding modal |
| 1.5 | `src/components/ui/toaster.tsx` | 10 | Toast notifications |
| 1.6 | `src/components/ui/page-header.tsx` | 8 | Page headers |
| 1.7 | `src/components/ui/stat-card.tsx` | 7 | Statistics display |
| 1.8 | `src/components/ui/metrics-card.tsx` | 7 | Metrics display |
| 1.9 | `src/components/ui/button.tsx` | 6 | Core button |
| 1.10 | `src/components/ui/Modal.tsx` | 5 | Modal dialogs |
| 1.11 | `src/components/ui/textarea.tsx` | 5 | Text input |
| 1.12 | `src/components/ui/Spinner.tsx` | 4 | Loading spinner |
| 1.13 | `src/components/ui/Toast.tsx` | 4 | Toast component |
| 1.14 | `src/components/ui/command.tsx` | 4 | Command palette |
| 1.15 | `src/components/ui/select.tsx` | 3 | Select dropdown |
| 1.16 | `src/components/ui/dropdown-menu.tsx` | 3 | Dropdown menu |
| 1.17 | `src/components/ui/loading-skeleton.tsx` | 3 | Skeleton loader |
| 1.18 | `src/components/ui/Breadcrumbs.tsx` | 3 | Breadcrumb nav |
| 1.19 | `src/components/ui/three-d-carousel.tsx` | 2 | Carousel |
| 1.20 | `src/components/ui/popover.tsx` | 2 | Popover |
| 1.21 | `src/components/ui/Slider.tsx` | 2 | Slider input |
| 1.22 | `src/components/ui/dock.tsx` | 1 | Dock component |
| 1.23 | `src/components/ui/dialog.tsx` | 1 | Dialog base |
| 1.24 | `src/components/ui/image-comparison.tsx` | 1 | Image compare |
| 1.25 | `src/components/ui/footer/TransparencyFooter.tsx` | 1 | Footer |

---

## Priority 2: Dashboard Pages (Phase 3)

**Goal**: ~50 violations → <10
**Impact**: Primary client-facing interface
**Estimated Effort**: 4-6 hours

### Files in Order of Violation Count

| Priority | File | Violations |
|----------|------|------------|
| 2.1 | `src/app/dashboard/team/page.tsx` | 28 |
| 2.2 | `src/app/dashboard/contacts/page.tsx` | 26 |
| 2.3 | `src/app/dashboard/workspaces/page.tsx` | 24 |
| 2.4 | `src/app/dashboard/billing/page.tsx` | 24 |
| 2.5 | `src/app/dashboard/projects/page.tsx` | 20 |
| 2.6 | `src/app/dashboard/monitoring/page.tsx` | 19 |
| 2.7 | `src/app/dashboard/showcase/page.tsx` | 17 |
| 2.8 | `src/app/dashboard/sites/page.tsx` | 17 |
| 2.9 | `src/app/dashboard/marketplace/page.tsx` | 16 |
| 2.10 | `src/app/dashboard/content/page.tsx` | 20 |
| 2.11 | `src/app/dashboard/intelligence/page.tsx` | 13 |
| 2.12 | `src/app/dashboard/memory/page.tsx` | 17 |
| 2.13 | `src/app/dashboard/modern/page.tsx` | 13 |
| 2.14 | `src/app/dashboard/meetings/page.tsx` | 14 |
| 2.15 | `src/app/dashboard/approvals/page.tsx` | 26 |
| 2.16 | `src/app/dashboard/calendar/page.tsx` | 14 |
| 2.17 | `src/app/dashboard/drip-campaigns/page.tsx` | 10 |
| 2.18 | `src/app/dashboard/email-templates/page.tsx` | 9 |
| 2.19 | `src/app/dashboard/insights/page.tsx` | 8 |
| 2.20 | `src/app/dashboard/overview/page.tsx` | 7 |
| 2.21 | `src/app/dashboard/queue/page.tsx` | 10 |
| 2.22 | `src/app/dashboard/reports/page.tsx` | 9 |
| 2.23 | `src/app/dashboard/profile/page.tsx` | 17 |
| 2.24 | `src/app/dashboard/seo/page.tsx` | 7 |
| 2.25 | `src/app/dashboard/tasks/page.tsx` | 12 |

### Dashboard Subdirectories

| Directory | Files | Estimated Violations |
|-----------|-------|---------------------|
| `dashboard/aido/` | 10 | ~200 |
| `dashboard/ai-tools/` | 3 | ~40 |
| `dashboard/seo/` | 5 | ~25 |
| `dashboard/settings/` | 3 | ~15 |

---

## Priority 3: CRM Pages (Phase 4)

**Goal**: ~10 violations → 0
**Impact**: Core CRM functionality
**Estimated Effort**: 1-2 hours

| Priority | File | Violations |
|----------|------|------------|
| 3.1 | `src/app/crm/staff/page.tsx` | 8 |
| 3.2 | `src/app/crm/dashboard/page.tsx` | 3 |
| 3.3 | `src/app/crm/admin/devices/page.tsx` | 17 |
| 3.4 | `src/app/crm/decision-circuits/ab-tests/[test_id]/page.tsx` | 1 |

---

## Priority 4: Product Pages (Phase 5)

**Goal**: ~180 violations → <40
**Impact**: Internal product tools
**Estimated Effort**: 8-12 hours

### Founder OS Pages (120+ files)

Top 20 by violation count:

| Priority | File | Violations |
|----------|------|------------|
| 4.1 | `src/app/founder/negotiation/page.tsx` | 35+ |
| 4.2 | `src/app/founder/agi-brain/page.tsx` | 31+ |
| 4.3 | `src/app/founder/synthex-seo/page.tsx` | 30+ |
| 4.4 | `src/app/founder/agi-console/page.tsx` | 30+ |
| 4.5 | `src/app/founder/blue-ocean/page.tsx` | 26+ |
| 4.6 | `src/app/founder/intelligence-hub/page.tsx` | 26+ |
| 4.7 | `src/app/founder/network/page.tsx` | 24+ |
| 4.8 | `src/app/founder/guardian-warehouse/page.tsx` | 26+ |
| 4.9 | `src/app/founder/guardian-replay/page.tsx` | 24+ |
| 4.10 | `src/app/founder/guardian-scenarios/page.tsx` | 30+ |
| 4.11 | `src/app/founder/insights/page.tsx` | 20+ |
| 4.12 | `src/app/founder/businesses/page.tsx` | 19 |
| 4.13 | `src/app/founder/ai-phill/page.tsx` | 19 |
| 4.14 | `src/app/founder/settings/page.tsx` | 18 |
| 4.15 | `src/app/founder/strategy/page.tsx` | 18 |

### Guardian Pages (60+ files)

Top 10 by violation count:

| Priority | File | Violations |
|----------|------|------------|
| 4.16 | `src/app/guardian/plugins/industry/government/page.tsx` | 40+ |
| 4.17 | `src/app/guardian/admin/editions/page.tsx` | 34+ |
| 4.18 | `src/app/guardian/admin/network/page.tsx` | 33+ |
| 4.19 | `src/app/guardian/admin/lifecycle/page.tsx` | 31+ |
| 4.20 | `src/app/guardian/plugins/industry/healthcare/page.tsx` | 31+ |
| 4.21 | `src/app/guardian/admin/integrations/page.tsx` | 29+ |
| 4.22 | `src/app/guardian/plugins/industry/insurance/page.tsx` | 31+ |
| 4.23 | `src/app/guardian/admin/meta-governance/page.tsx` | 27+ |
| 4.24 | `src/app/guardian/admin/governance-coach/page.tsx` | 19 |
| 4.25 | `src/app/guardian/admin/exports/page.tsx` | 24+ |

### Synthex Pages

| Priority | File | Violations |
|----------|------|------------|
| 4.26 | `src/app/synthex/studio/page.tsx` | 2 |
| 4.27 | `src/app/synthex/projects/page.tsx` | 4 |
| 4.28 | `src/app/synthex/projects/[projectId]/page.tsx` | 6 |

### Client Portal Pages (~20 files)

| Priority | File | Violations |
|----------|------|------------|
| 4.29 | `src/app/client/dashboard/visual-playground/page.tsx` | 11 |
| 4.30 | `src/app/client/dashboard/enhancements/page.tsx` | 19 |
| 4.31 | `src/app/client/dashboard/approvals/page.tsx` | 23 |
| 4.32 | `src/app/client/dashboard/roadmap/page.tsx` | 16 |

---

## Migration Strategy

### Approach 1: Pattern-Based (Recommended)

1. **Pass 1**: Replace all `gray-*` → text/bg tokens (350 changes)
2. **Pass 2**: Replace all `slate-*` → text/bg tokens (150 changes)
3. **Pass 3**: Replace `red-*` → `error-*` (100 changes)
4. **Pass 4**: Replace `blue-*` → `info-*` (180 changes)
5. **Pass 5**: Replace `green-*`, `emerald-*` → `success-*` (150 changes)
6. **Pass 6**: Replace `yellow-*`, `amber-*` → `warning-*` (170 changes)
7. **Pass 7**: Handle decorative colors case-by-case

### Approach 2: File-Based

Process files in priority order, fixing all violations per file.

### Search-Replace Patterns

```
# Background replacements
bg-gray-50 → bg-bg-card
bg-gray-100 → bg-bg-hover
bg-gray-800 → bg-bg-raised
bg-gray-900 → bg-bg-base
bg-slate-950 → bg-bg-base

# Text replacements
text-gray-900 → text-text-primary
text-gray-600 → text-text-secondary
text-gray-400 → text-text-muted

# Semantic replacements
text-red-600 → text-error-600
bg-red-50 → bg-error-50
text-blue-600 → text-info-600
bg-blue-50 → bg-info-50
text-green-600 → text-success-600
bg-green-50 → bg-success-50
text-yellow-600 → text-warning-600
bg-yellow-50 → bg-warning-50
```

---

## Success Metrics

| Phase | Before | After | Reduction |
|-------|--------|-------|-----------|
| Phase 2 (UI) | 25 | 0 | 100% |
| Phase 3 (Dashboard) | ~200 | <20 | 90%+ |
| Phase 4 (CRM) | ~30 | 0 | 100% |
| Phase 5 (Products) | ~171 | <30 | 80%+ |
| **Total** | **426** | **<50** | **88%+** |

---

## Validation Commands

```bash
# Run after each phase
npm test tests/design-tokens/token-usage.test.ts

# Verify dev server works
npm run dev
```
