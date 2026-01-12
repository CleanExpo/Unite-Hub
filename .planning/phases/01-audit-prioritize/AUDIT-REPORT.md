# Design Token Audit Report

**Date**: 2026-01-12
**Milestone**: v1.1 Design Token Migration
**Status**: Baseline Assessment Complete

---

## Executive Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Total Violations** | 426 | <50 | 376 to fix |
| **UI Components** | 25 files | 0 | 25 to fix |
| **Page Components** | 401 files | <50 | 351+ to fix |
| **Compliance Rate** | ~12% | 90%+ | +78% needed |

---

## 1. Summary Statistics

### By Component Type

| Type | Files with Violations | Priority |
|------|----------------------|----------|
| UI Components (`src/components/ui/`) | 25 | **HIGH** - Foundation |
| Dashboard Pages (`src/app/dashboard/`) | ~50 | HIGH |
| Founder OS Pages (`src/app/founder/`) | ~120 | MEDIUM |
| Guardian Pages (`src/app/guardian/`) | ~60 | MEDIUM |
| CRM Pages (`src/app/crm/`) | ~10 | MEDIUM |
| Client Pages (`src/app/client/`) | ~20 | LOW |
| Auth/Admin Pages | ~15 | LOW |
| Other Pages | ~126 | LOW |

### By Severity

| Severity | Description | Count |
|----------|-------------|-------|
| **Critical** | UI components (used everywhere) | 25 |
| **High** | Dashboard/overview pages (client-facing) | ~50 |
| **Medium** | Product pages (Founder, Guardian) | ~180 |
| **Low** | Internal/admin pages | ~171 |

---

## 2. Violations by Color Category

### Gray/Slate Scale (Most Common)

| Pattern | Count | Token Replacement |
|---------|-------|-------------------|
| `gray-50`, `gray-100` | ~30 | `bg-card`, `bg-hover` |
| `gray-200`, `gray-300` | ~40 | `border-subtle`, `text-secondary` |
| `gray-400`, `gray-500` | ~80 | `text-muted` |
| `gray-600`, `gray-700` | ~50 | `text-secondary` |
| `gray-800`, `gray-900`, `gray-950` | ~60 | `text-primary`, `bg-base` |
| `slate-*` (all shades) | ~150 | Same as gray-* |

**Total Gray/Slate**: ~350 violations (82% of all)

### Semantic Colors

| Pattern | Count | Token Replacement |
|---------|-------|-------------------|
| `red-*` | ~100 | `error-*` (error-50, error-500, error-900) |
| `blue-*` | ~180 | `info-*` (info-50, info-500, info-900) |
| `green-*`, `emerald-*` | ~150 | `success-*` (success-50, success-500, success-900) |
| `yellow-*`, `amber-*` | ~170 | `warning-*` (warning-50, warning-500, warning-900) |
| `orange-*` | ~5 | `accent-*` (brand color) |

### Decorative Colors (Case-by-Case)

| Pattern | Count | Recommended Action |
|---------|-------|--------------------|
| `purple-*` | ~60 | Define semantic or use accent variant |
| `pink-*`, `rose-*` | ~35 | Define semantic or use accent variant |
| `cyan-*`, `sky-*` | ~50 | Use `info-*` or define secondary accent |
| `violet-*`, `fuchsia-*` | ~15 | Evaluate necessity |

---

## 3. High-Impact Files (>10 violations each)

### UI Components (Priority 1)

| File | Violations | Impact |
|------|------------|--------|
| `toaster.tsx` | 10 | Used on every page |
| `page-header.tsx` | 8 | Used on all pages |
| `stat-card.tsx` | 7 | Dashboard core |
| `metrics-card.tsx` | 7 | Analytics pages |
| `Modal.tsx` | 5 | Used everywhere |
| `AIModelBadge.tsx` | 16 | AI features |
| `CreativeLabInfoDrawer.tsx` | 13 | Onboarding |
| `VideoApprovalCard.tsx` | 15 | Video features |
| `CreativeLabIntroModal.tsx` | 11 | Onboarding |

### Dashboard Pages (Priority 2)

| File | Violations | Impact |
|------|------------|--------|
| `dashboard/workspaces/page.tsx` | 24 | Workspace selection |
| `dashboard/team/page.tsx` | 28 | Team management |
| `dashboard/contacts/page.tsx` | 26 | CRM core |
| `dashboard/billing/page.tsx` | 24 | Revenue critical |
| `dashboard/monitoring/page.tsx` | 19 | System health |
| `dashboard/showcase/page.tsx` | 17 | Client demos |

### Founder OS Pages (Priority 3)

| File | Violations | Impact |
|------|------------|--------|
| `founder/synthex-seo/page.tsx` | 30+ | SEO product |
| `founder/negotiation/page.tsx` | 35+ | Sales tool |
| `founder/network/page.tsx` | 24+ | Networking |
| `founder/intelligence-hub/page.tsx` | 26+ | Core dashboard |
| `founder/agi-brain/page.tsx` | 31+ | AI features |
| `founder/blue-ocean/page.tsx` | 26+ | Strategy tool |

### Guardian Pages (Priority 4)

| File | Violations | Impact |
|------|------------|--------|
| `guardian/admin/network/page.tsx` | 33+ | Admin core |
| `guardian/admin/integrations/page.tsx` | 29+ | Integration hub |
| `guardian/admin/editions/page.tsx` | 34+ | Version control |
| `guardian/plugins/industry/government/page.tsx` | 40+ | Industry specific |

---

## 4. Token Mapping Reference

### Background Tokens

| Hardcoded | Design Token | Usage |
|-----------|--------------|-------|
| `bg-gray-50` | `bg-bg-card` | Card backgrounds |
| `bg-gray-100` | `bg-bg-hover` | Hover states |
| `bg-gray-900`, `bg-slate-950` | `bg-bg-base` | Page background |
| `bg-gray-800`, `bg-slate-900` | `bg-bg-raised` | Elevated surfaces |

### Text Tokens

| Hardcoded | Design Token | Usage |
|-----------|--------------|-------|
| `text-gray-900` | `text-text-primary` | Primary text |
| `text-gray-600`, `text-gray-700` | `text-text-secondary` | Secondary text |
| `text-gray-400`, `text-gray-500` | `text-text-muted` | Muted/helper text |

### Border Tokens

| Hardcoded | Design Token | Usage |
|-----------|--------------|-------|
| `border-gray-200` | `border-border-subtle` | Subtle borders |
| `border-gray-300` | `border-border-medium` | Medium borders |

### Semantic Color Tokens

| Hardcoded | Design Token | Usage |
|-----------|--------------|-------|
| `text-red-*`, `bg-red-*` | `text-error-*`, `bg-error-*` | Error states |
| `text-blue-*`, `bg-blue-*` | `text-info-*`, `bg-info-*` | Info states |
| `text-green-*`, `bg-green-*` | `text-success-*`, `bg-success-*` | Success states |
| `text-yellow-*`, `text-amber-*` | `text-warning-*`, `bg-warning-*` | Warning states |
| `text-orange-*`, `bg-orange-*` | `text-accent-*`, `bg-accent-*` | Brand accent |

---

## 5. Migration Effort Estimate

### Phase 2: UI Components (25 files)
- **Effort**: 2-3 hours
- **Risk**: Low (isolated changes)
- **Impact**: High (foundation for all pages)

### Phase 3: Dashboard Pages (~50 files)
- **Effort**: 4-6 hours
- **Risk**: Medium (user-facing)
- **Impact**: High (client experience)

### Phase 4: CRM Pages (~10 files)
- **Effort**: 1-2 hours
- **Risk**: Low
- **Impact**: Medium

### Phase 5: Product Pages (~180 files)
- **Effort**: 8-12 hours
- **Risk**: Medium
- **Impact**: Medium (internal tools)

### Total Estimated Effort: 15-23 hours

---

## 6. Recommendations

### Immediate Actions
1. **Fix UI components first** - Every page improvement benefits from token compliance
2. **Batch by pattern** - Fix all `gray-*` in one pass, then `red-*`, etc.
3. **Use search-replace** - Pattern-based replacement is faster than manual

### Tools Available
- `tests/design-tokens/token-usage.test.ts` - Automated compliance checking
- `.claude/skills/design-token-validator.md` - Claude Code skill for validation

### Quality Gates
- Run tests after each file migration
- Verify visual appearance in dev server
- Commit after each phase completion

---

## Next Steps

1. Proceed to Phase 2: UI Components
2. Fix 25 component files to achieve 0 UI violations
3. Run tests to verify compliance
