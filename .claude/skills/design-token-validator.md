# Design Token Validator Skill

Validates that React components use only design tokens (no hardcoded Tailwind colors).

## Usage

```bash
# Validate a single component
/design-token-validator src/components/ui/button.tsx

# Validate entire component directory
/design-token-validator src/components/ui/

# Full codebase validation
/design-token-validator --full

# Fix violations automatically (with confirmation)
/design-token-validator src/components/ui/ --fix
```

## What This Skill Does

1. **Detects Hardcoded Colors**
   - `gray-*`, `red-*`, `blue-*`, `slate-*` classes
   - Hex color codes (#ff6b35, #0d9488)
   - RGB/RGBA values
   - CSS color names

2. **Maps to Design Tokens**
   - Suggests replacement tokens from `globals.css`
   - Provides exact line numbers
   - Shows before/after comparison

3. **Validates Token Usage**
   - Confirms token exists in design system
   - Checks for deprecated tokens
   - Verifies color meets WCAG AA contrast

4. **Generates Fix Report**
   - Comprehensive violation list
   - Suggested replacements
   - Automated fix (optional)

## Output Format

```
## Design Token Validation Report: badge.tsx

### Hardcoded Colors Found: 6

1. **Line 83**: `text-gray-600` (secondary variant)
   ❌ Hardcoded Tailwind color
   ✅ Suggested token: `text-text-secondary`

2. **Line 85**: `bg-red-100` (destructive variant)
   ❌ Hardcoded Tailwind color
   ✅ Suggested token: `bg-error-100`

3. **Line 85**: `text-red-600` (destructive variant)
   ❌ Hardcoded Tailwind color
   ✅ Suggested token: `text-error-500`

4. **Line 87**: `bg-blue-100` (info variant)
   ❌ Hardcoded Tailwind color
   ✅ Suggested token: `bg-info-100`

5. **Line 87**: `text-blue-600` (info variant)
   ❌ Hardcoded Tailwind color
   ✅ Suggested token: `text-info-500`

6. **Line 88**: `bg-red-900/30` (error variant)
   ❌ Hardcoded Tailwind color
   ✅ Suggested token: `bg-error-900/30`

### Compliance Summary
- **Status**: ❌ NON-COMPLIANT
- **Violations**: 6 hardcoded colors
- **Compliance**: 0% (0/6 valid)
- **Est. Fix Time**: 2 minutes

### Approved Design Tokens

From `src/app/globals.css`:

**Accent Colors** (Primary Brand - Orange)
- `accent-50` through `accent-900`
- Orange (#ff6b35) brand color

**Semantic Colors**
- `error-*` (red states)
- `warning-*` (yellow states)
- `info-*` (blue states)
- `success-*` (green states)

**Text Colors**
- `text-primary` (#f8f8f8)
- `text-secondary` (#9ca3af)
- `text-muted` (#6b7280)

**Background Colors**
- `bg-base` (#08090a)
- `bg-raised` (#0f1012)
- `bg-card` (#141517)
- `bg-hover` (#1a1b1e)

**Border Colors**
- `border-subtle` (10% white)
- `border-medium` (14% white)

### Recommended Fixes

```bash
# Option 1: Apply automated fixes
/design-token-validator src/components/ui/badge.tsx --fix

# Option 2: Manual fixes (show replacements)
/design-token-validator src/components/ui/badge.tsx --show-diffs
```

---

## Color Mapping Reference

### Accent Colors (Primary Brand - Orange)
```
Hardcoded      →  Design Token
---
orange-50      →  accent-50
orange-100     →  accent-100
orange-200     →  accent-200
orange-300     →  accent-300
orange-400     →  accent-400
orange-500     →  accent-500  ⭐ PRIMARY
orange-600     →  accent-600
orange-700     →  accent-700
orange-800     →  accent-800
orange-900     →  accent-900
```

### Error/Destructive States
```
Hardcoded      →  Design Token
---
red-50         →  error-50
red-100        →  error-100
red-400        →  error-400
red-500        →  error-500
red-600        →  error-500 (use 500, not 600)
red-900        →  error-900
```

### Info/Blue States
```
Hardcoded      →  Design Token
---
blue-50        →  info-50
blue-100       →  info-100
blue-400       →  info-400
blue-600       →  info-500
blue-900       →  info-900
```

### Text Colors
```
Hardcoded      →  Design Token
---
gray-300       →  text-secondary
gray-600       →  text-secondary
gray-900       →  text-primary
white          →  text-primary
```

### Background Colors
```
Hardcoded      →  Design Token
---
gray-50        →  bg-card
gray-100       →  bg-hover
slate-950      →  bg-base
```

## Integration with CI/CD

Runs automatically in GitHub Actions:

```yaml
- name: Run Design Token Validator
  run: npm run test:design-tokens
```

See `.github/workflows/accessibility-audit.yml` for workflow integration.

## Batch Operations

### Validate entire UI components directory
```bash
/design-token-validator src/components/ui/ --batch
```

### Generate compliance report
```bash
/design-token-validator --full --report design-tokens-report.md
```

### Export violations as CSV
```bash
/design-token-validator --full --csv design-tokens-violations.csv
```

## Phase 2B: Mass Migration

For large-scale token migrations across 883 files:

```bash
# Dry run (no changes, just report)
/design-token-validator --full --dry-run

# Apply fixes to all files
/design-token-validator --full --fix --batch

# Generate migration summary
/design-token-validator --full --summary migration-summary.txt
```

## Common Issues & Fixes

### Issue: Gradient colors not recognized

**Before**:
```tsx
<Card className="bg-gradient-to-br from-blue-500/10 to-pink-500/10">
```

**After**:
```tsx
<Card className="bg-gradient-to-br from-accent-500/10 to-accent-400/10">
```

### Issue: Opacity colors

**Before**:
```tsx
<div className="bg-gray-900/50">
```

**After**:
```tsx
<div className="bg-bg-base/50">
```

### Issue: Hover states with hardcoded colors

**Before**:
```tsx
<Button className="hover:bg-blue-600">
```

**After**:
```tsx
<Button className="hover:bg-accent-600">
```

## Standards & Documentation

**Design System Reference**: `/DESIGN-SYSTEM.md`
**Color Tokens**: `src/app/globals.css` (lines 194-224)
**Tailwind Config**: `tailwind.config.cjs`
**Token Usage Examples**: `src/components/ui/` (all components)

## Quality Assurance

After running validator:

1. ✅ All violations documented
2. ✅ Suggested tokens verified in `globals.css`
3. ✅ No deprecated tokens recommended
4. ✅ Contrast ratios validated
5. ✅ Before/after diffs generated
6. ✅ Automated fixes preview available

---

**Last Updated**: January 12, 2026
**Status**: ✅ Ready for Production
**Compliance Target**: 100% design token usage in components
