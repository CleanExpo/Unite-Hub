# Visual Regression Baseline Skill

Capture and manage Playwright visual regression baselines for UI consistency.

## Usage

```bash
# Capture new baselines for all visual tests
/visual-regression-baseline

# Capture baseline for specific page
/visual-regression-baseline landing-page

# Compare current state against baselines (no updates)
/visual-regression-baseline --compare

# Open Visual Diff Dashboard
/visual-regression-baseline --dashboard
```

## What This Skill Does

1. **Captures Baseline Screenshots**
   - 3 viewports: Mobile (375×667), Tablet (768×1024), Desktop (1440×900)
   - Full-page screenshots with animations disabled
   - Consistent rendering (fonts loaded, network idle)

2. **Manages Snapshot Directory**
   - Location: `tests/visual/visual-regression.spec.ts-snapshots/`
   - Platform-specific naming: `{page}-{viewport}-chromium-win32.png`
   - Git-tracked for version control

3. **Validates Changes**
   - Compares against stored baselines
   - Reports pixel differences
   - Generates diff images for review

4. **Visual Diff Dashboard**
   - URL: `/dev/visual-diff`
   - Side-by-side, overlay, and slider comparison modes
   - Filter by status: passed, changed, new

## Commands Reference

### Capture All Baselines
```bash
npm run test:visual:baseline
# or
cd tests/visual && npx playwright test --config=playwright.visual.config.ts --update-snapshots
```

### Compare Against Baselines
```bash
npm run test:visual
# or
cd tests/visual && npx playwright test --config=playwright.visual.config.ts
```

### View Playwright Report
```bash
npm run test:visual:report
# or
npx playwright show-report
```

### Open Visual Diff Dashboard
```bash
# Start dev server first
npm run dev

# Then visit
http://localhost:3008/dev/visual-diff
```

## Current Test Coverage

| Page | Mobile | Tablet | Desktop | Status |
|------|--------|--------|---------|--------|
| Landing Page | ✅ | ✅ | ✅ | Baseline captured |
| Health Check | ✅ | ✅ | ✅ | Baseline captured |
| Dashboard | ✅ | ✅ | ✅ | Baseline captured |
| Error 404 | - | - | ✅ | Baseline captured |
| Button Hover | - | - | ✅ | Baseline captured |
| Button Focus | - | - | ✅ | Baseline captured |
| Navigation | - | - | ✅ | Baseline captured |

**Total**: 16 baseline snapshots

## Adding New Visual Tests

### 1. Add test to visual-regression.spec.ts

```typescript
test.describe('Visual Regression - New Page', () => {
  test('should render correctly across all viewports', async ({ page }) => {
    await testPageAcrossViewports(page, `${BASE_URL}/new-page`, 'new-page', '[data-testid="new-page"]');
  });
});
```

### 2. Capture baseline

```bash
npm run test:visual:baseline
```

### 3. Verify in dashboard

Visit `/dev/visual-diff` and confirm new snapshot appears.

### 4. Commit baseline

```bash
git add tests/visual/visual-regression.spec.ts-snapshots/
git commit -m "feat(visual): Add baseline for new-page"
```

## Threshold Configuration

Default thresholds in `playwright.visual.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,    // Max pixels that can differ
    threshold: 0.2,        // 20% pixel difference tolerance
  },
}
```

Adjust for specific tests:

```typescript
await expect(page).toHaveScreenshot('animated-component.png', {
  threshold: 0.3,         // Higher tolerance for animations
  maxDiffPixelRatio: 0.1, // Max 10% of image can differ
});
```

## CI/CD Integration

Visual tests run on every PR via GitHub Actions:

```yaml
# .github/workflows/visual-regression.yml
- name: Run visual regression tests
  run: npm run test:visual
  continue-on-error: true

- name: Upload snapshot diffs
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-diff-snapshots
    path: tests/visual/**/*-snapshots/
```

## Troubleshooting

### Test fails with different image size

**Cause**: Full-page screenshot captured different content height.

**Fix**: Ensure consistent scroll state:
```typescript
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
```

### Fonts not loading consistently

**Fix**: Add font wait in test:
```typescript
await page.waitForFunction(() => document.fonts.ready);
```

### Animations causing flaky tests

**Fix**: Disable animations:
```typescript
await expect(page).toHaveScreenshot('page.png', {
  animations: 'disabled',
});
```

### Different baselines on CI vs local

**Cause**: Different OS renders fonts differently.

**Fix**: Use platform-specific baselines (already configured with `-win32` suffix).

## Visual Diff Dashboard Features

- **Side by Side**: View baseline and current next to each other
- **Overlay**: Blend images with opacity slider
- **Slider**: Drag handle to reveal differences
- **Filters**: All, Changed, Passed, New
- **Refresh**: Re-scan snapshots directory

## File Locations

- **Test spec**: `tests/visual/visual-regression.spec.ts`
- **Test config**: `tests/visual/playwright.visual.config.ts`
- **Baselines**: `tests/visual/visual-regression.spec.ts-snapshots/`
- **Diff Dashboard**: `src/app/dev/visual-diff/page.tsx`
- **API Route**: `src/app/api/visual-snapshots/route.ts`

---

**Last Updated**: January 12, 2026
**Status**: ✅ Ready for Production
**Baselines**: 16 snapshots captured
