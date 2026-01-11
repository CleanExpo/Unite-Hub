# Hardcoded Colors Audit & Fix Plan

**Scope**: 883 files using hardcoded Tailwind colors
**Priority**: 10 critical components first, then batch replacement
**Status**: Phase 2 of Week 1 Task 2

---

## Critical Component Fixes (10 files)

### 1. Badge Component - src/components/ui/badge.tsx
**Issues Found** (Lines 83-88):
```typescript
// WRONG
secondary: 'bg-bg-hover text-gray-600 dark:text-gray-300',
destructive: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
```

**Fixes Needed**:
- `text-gray-600` → `text-text-secondary`
- `text-gray-300` → `text-text-secondary` (dark mode)
- `bg-red-100` → `bg-error-100`
- `bg-red-900/30` → `bg-error-900/30`
- `text-red-600` → `text-error-500`
- `text-red-400` → `text-error-400`
- `bg-blue-100` → `bg-info-100`
- `bg-blue-900/30` → `bg-info-900/30`
- `text-blue-600` → `text-info-500`
- `text-blue-400` → `text-info-400`

### 2. Button Component - src/components/ui/button.tsx
**Status**: ✅ VERIFIED - Uses design tokens only
- All colors use `accent-*`, `bg-*`, `text-*` design tokens
- No hardcoded Tailwind colors found

### 3. Card Component - src/components/ui/card.tsx
**Status**: ✅ TO CHECK - Read and audit

### 4. Input Component - src/components/ui/input.tsx
**Status**: ⏳ TO CHECK

### 5. Dialog Component - src/components/ui/dialog.tsx
**Status**: ⏳ TO CHECK

### 6. Table Component - src/components/ui/table.tsx
**Status**: ⏳ TO CHECK

### 7. Design Studio - src/components/synthex/design-studio/DesignStudio.tsx
**Status**: ⏳ TO CHECK (Large component, 480+ lines)

### 8. Dashboard Pages (3 files)
- src/app/dashboard/overview/page.tsx
- src/app/dashboard/layout.tsx
- src/app/page.tsx (3 versions)

### 9. Founders Pages (Multiple)
- src/app/founder/audit/page.tsx
- Guardian dashboard pages

### 10. Loyalty Components
- src/components/loyalty/LoyaltyStatusBanner.tsx
- src/components/loyalty/ReferralInviteWidget.tsx

---

## Color Token Mapping Reference

### Error/Destructive States
```
red-50   → error-50   (rgba(239, 68, 68, 0.08))
red-100  → error-100  (rgba(239, 68, 68, 0.12))
red-400  → error-400  (from palette)
red-500  → error-500  (#ef4444)
red-600  → error-500  (use error-500, not -600)
red-900  → error-900  (darker shade)
```

### Info/Blue States
```
blue-50   → info-50    (rgba(59, 130, 246, 0.08))
blue-100  → info-100   (rgba(59, 130, 246, 0.12))
blue-400  → info-400   (from palette)
blue-600  → info-500   (#3b82f6)
blue-900  → info-900   (darker shade)
```

### Text Colors
```
gray-300  → text-text-secondary (for all dark mode secondary text)
gray-600  → text-text-secondary
gray-900  → text-text-primary
```

### Gray/Neutral States
```
gray-50   → bg-accent-50
gray-100  → bg-accent-100
gray-200  → border-border-subtle
```

---

## Batch Replacement Strategy

### Phase 2A: Critical Components (10 files)
1. Fix badge.tsx hardcoded colors (lines 83-88)
2. Verify button.tsx (appears clean)
3. Audit card, input, dialog, table
4. Fix synthex design-studio
5. Fix dashboard pages
6. Fix founder/guardian pages
7. Fix loyalty components

### Phase 2B: Full Codebase (883 files)
**Safe replacements** (unlikely to break anything):
```bash
# Error states
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec \
  sed -i 's/\bredestruct\b/error/g; \
          s/\btext-red-600\b/text-error-500/g; \
          s/\btext-red-400\b/text-error-400/g; \
          s/\btext-red-700\b/text-error-600/g; \
          s/\bbg-red-100\b/bg-error-100/g; \
          s/\bbg-red-900\/30\b/bg-error-900\/30/g' {} +

# Info states
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec \
  sed -i 's/\btext-blue-600\b/text-info-500/g; \
          s/\btext-blue-400\b/text-info-400/g; \
          s/\bbg-blue-100\b/bg-info-100/g; \
          s/\bbg-blue-900\/30\b/bg-info-900\/30/g' {} +

# Text colors
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec \
  sed -i 's/\btext-gray-600\b/text-text-secondary/g; \
          s/\btext-gray-300\b/text-text-secondary/g; \
          s/\btext-gray-900\b/text-text-primary/g' {} +
```

---

## Audit Findings Summary

| Component | Status | Issues | Priority |
|---|---|---|---|
| badge.tsx | ❌ Broken | 6 hardcoded colors | P0 |
| button.tsx | ✅ Clean | None | - |
| card.tsx | ⏳ Pending | TBD | P1 |
| input.tsx | ⏳ Pending | TBD | P1 |
| dialog.tsx | ⏳ Pending | TBD | P1 |
| table.tsx | ⏳ Pending | TBD | P1 |
| design-studio | ⏳ Pending | TBD | P1 |
| dashboard pages | ⏳ Pending | TBD | P1 |
| founder pages | ⏳ Pending | TBD | P2 |
| loyalty components | ⏳ Pending | TBD | P2 |

---

## Next Steps

1. **Immediate** (Today):
   - Fix badge.tsx (lines 83-88)
   - Audit remaining 9 critical components
   - Create targeted fix list

2. **Week 1 Completion**:
   - Fix all 10 critical components
   - Run full test suite
   - Verify visual regression tests

3. **Week 2 (Phase 2B)**:
   - Batch replace safe hardcoded colors (883 files)
   - Re-run TypeScript check
   - Full test suite validation

---

**Unresolved**: How strict should we be on color replacements?
- Option A: Replace ALL hardcoded colors (requires validation of each)
- Option B: Only fix semantic colors (error, info, warning) - safer
- Option C: Focus on components, leave utility classes as-is
