# Accessibility Audit Skill

Automated WCAG 2.1 AA accessibility audit for React components and pages.

## Usage

```bash
# Run accessibility audit on a component
/accessibility-audit src/components/ui/button.tsx

# Run accessibility audit on a page
/accessibility-audit src/app/dashboard/page.tsx

# Full accessibility audit (all critical components)
/accessibility-audit --full
```

## What This Skill Does

1. **aXe Automated Testing** (57% of WCAG issues)
   - Scans for accessibility violations
   - Checks ARIA attributes
   - Validates semantic HTML
   - Reports contrast ratios

2. **Keyboard Navigation Test**
   - Tab order validation
   - Focus trap testing in modals
   - Escape key support
   - Skip links checking

3. **Color Contrast Validation**
   - Text contrast: 4.5:1 (WCAG AA)
   - UI components: 3:1 (WCAG AA)
   - Reports specific violations

4. **ARIA Attribute Analysis**
   - Button aria-labels for icon-only buttons
   - Form labels + aria-describedby
   - Dialog focus management
   - Semantic role attributes

5. **Heading Hierarchy Check**
   - Single H1 per page
   - Proper H1 → H2/H3 progression
   - Descriptive headings

## Output Format

```
## Accessibility Audit Report: button.tsx

### aXe Violations
- ❌ color-contrast: Button text lacks sufficient contrast (2.8:1, need 4.5:1)
  Line 38: `.bg-accent-500 text-gray-600`

### Keyboard Navigation
- ✅ All buttons are keyboard accessible (tabindex not -1)
- ✅ Focus visible on :focus
- ✅ Icon-only buttons have aria-label

### Color Contrast
- ✅ Primary button: 5.8:1 (exceeds 4.5:1)
- ✅ Secondary button: 4.2:1 (meets 4.5:1)

### ARIA Attributes
- ⚠️ Close button missing aria-label
  Line 46: `<button>✕</button>`
  Fix: Add `aria-label="Close dialog"`

### Heading Hierarchy
- ✅ Page has single H1
- ✅ H2 → H3 progression logical

### Summary
- **Status**: ⚠️ NEEDS FIXES
- **Violations**: 1 critical, 1 warning
- **Pass Rate**: 80% (4/5 checks)
- **Time to Fix**: ~5 minutes
```

## Integration with Playwright

For E2E testing:

```bash
npm run test:a11y:e2e
```

This runs full page accessibility tests on:
- Landing page (desktop, tablet, mobile)
- Dashboard (forms, interactive elements)
- Modals and dialogs
- Color contrast on all viewports

## WCAG 2.1 AA Target Checklist

Before shipping code, verify:

- [ ] aXe automated checks pass (0 violations)
- [ ] Keyboard navigation works end-to-end
- [ ] All buttons have visible labels (text or aria-label)
- [ ] All form inputs have associated labels
- [ ] Color contrast meets 4.5:1 (text) or 3:1 (UI)
- [ ] Focus indicators visible on all interactive elements
- [ ] Modals trap focus properly
- [ ] Images have descriptive alt text
- [ ] Headings follow logical hierarchy

## Common Fixes

### Missing aria-label on icon-only button

**Before**:
```tsx
<Button size="icon">✕</Button>
```

**After**:
```tsx
<Button size="icon" aria-label="Close">✕</Button>
```

### Insufficient color contrast

**Before**:
```tsx
<Badge className="bg-error-100 text-gray-600">Error</Badge>
```

**After**:
```tsx
<Badge className="bg-error-100 text-error-500">Error</Badge>
```

### Form input missing label

**Before**:
```tsx
<Input type="email" placeholder="Enter email..." />
```

**After**:
```tsx
<div>
  <label htmlFor="email">Email Address</label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

## CI/CD Integration

Runs automatically on:
- ✅ Every pull request
- ✅ Push to main/develop
- ✅ Daily scheduled audit (2 AM UTC)

See `.github/workflows/accessibility-audit.yml` for workflow configuration.

## Manual Audit Checklist

For 100% coverage (beyond automated testing):

1. **Screen Reader Testing**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Test all critical user flows
   - Verify announcements make sense

2. **Keyboard-Only Navigation**
   - Unplug mouse or disable trackpad
   - Navigate entire page with Tab/Shift+Tab/Enter/Space
   - Verify all functionality works

3. **High Contrast Mode**
   - Enable Windows High Contrast Mode
   - Verify all elements still visible and usable
   - Check for white-on-white or similar issues

4. **Zoom Testing**
   - Test at 200% zoom
   - Verify text remains readable
   - Check for layout breaks

5. **Color Blindness Simulation**
   - Use browser extensions (Coblis, Color Oracle)
   - Verify meaning not conveyed by color alone

---

**Last Updated**: January 12, 2026
**Status**: ✅ Ready for Production
