# Visual Regression Testing (Percy.io)

Automated visual regression testing for detecting UI changes across breakpoints.

---

## Quick Start

### Local Development

```bash
# Capture baseline screenshots (first-time setup)
npm run test:visual:baseline

# Run visual regression tests with Percy
npm run test:visual:percy

# Or just Percy (requires PERCY_TOKEN)
PERCY_TOKEN=your_token npm run test:visual:percy
```

### CI/CD

Tests automatically run on:
- Pull requests to `main` / `develop`
- Pushes to `main` / `develop`
- Daily scheduled (2 AM UTC)

Results posted as PR comments with:
- Percy build links
- Visual diff summaries
- Snapshot counts per viewport

---

## Setup & Configuration

### 1. Percy.io Account

1. Sign up at https://percy.io (free tier: 5,000 snapshots/month)
2. Create project for Unite-Hub
3. Copy `PERCY_TOKEN` from project settings
4. Add to GitHub Secrets: `Settings > Secrets > PERCY_TOKEN`

### 2. Configuration Files

**`.percyrc.yml`** - Percy configuration:
- Network idle timeout: 750ms
- Snapshot widths: 375px (mobile), 768px (tablet), 1440px (desktop)
- Min height: 1024px
- Parallel snapshots: 3

**`playwright.config.ts`** - Playwright configuration:
- 3 browser contexts (Chromium, Firefox, WebKit)
- 30-second timeout
- Retry on failure: 2x

### 3. GitHub Actions Workflow

**`.github/workflows/visual-regression.yml`**:
- Job 1: Visual regression (Percy)
- Job 2: Lighthouse CI
- Job 3: WCAG compliance check

---

## Test Structure

### File: `tests/visual/visual-regression.spec.ts`

**Coverage**:
- Landing page (3 viewports)
- Health check page (3 viewports)
- Dashboard (responsive)
- Design tokens showcase
- Component library (buttons, forms, cards, dialogs, badges)
- Responsive breakpoints (mobile, tablet, desktop)
- Interactive states (button hover/focus, input focus/filled)
- Theming (dark mode)
- Error pages (404)

### Viewports Tested

| Viewport | Width | Height | Use Case |
|----------|-------|--------|----------|
| **Mobile** | 375px | 667px | iPhone/Android phones |
| **Tablet** | 768px | 1024px | iPad/Android tablets |
| **Desktop** | 1440px | 900px | Laptop/desktop browsers |

---

## Capturing Baselines

First-time setup requires capturing baseline screenshots:

```bash
# Start dev server
npm run dev

# In another terminal, capture baselines
npm run test:visual:baseline

# Commit baseline snapshots
git add tests/visual/__screenshots__/
git commit -m "feat: capture visual regression baselines"
```

**What this does**:
- Runs all visual tests with `--update-snapshots`
- Creates `.png` files for each viewport
- Stores in `tests/visual/__screenshots__/`

---

## Running Tests

### Against Dev Server

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm run test:visual:percy
```

### With Percy Integration

```bash
# Requires PERCY_TOKEN environment variable
PERCY_TOKEN=abc123xyz npm run test:visual:percy

# Creates visual build on Percy.io with:
# - Snapshots for current branch
# - Comparison against main branch
# - Visual diffs for changes
# - Review approval flow
```

### Debug Mode

```bash
# Run tests with Playwright inspector
npm run test:visual:percy -- --debug

# Or headed mode to see browser
npm run test:visual:percy -- --headed
```

---

## Understanding Results

### Visual Diff Report (Percy.io)

When tests run, Percy shows:

1. **Approved State**: No visual changes detected ✅
2. **Approved with Changes**: Some changes reviewed and approved ✅
3. **Unreviewed**: New changes waiting for review 👀
4. **Rejected**: Changes failed review ❌

### GitHub PR Comments

```markdown
## 📸 Visual Regression Testing

Build: [Percy Build #123](percy-link)
Status: approved / unreviewed / rejected
Snapshots: 45 captured

Tested Viewports:
- 📱 Mobile (375×667)
- 📱 Tablet (768×1024)
- 🖥️ Desktop (1440×900)
```

### Comparing Changes

In Percy dashboard:
1. Hover over snapshot to see changes
2. Use slider to compare old vs new
3. Highlight only changed areas
4. Approve if changes are intentional
5. Reject if unexpected

---

## Common Workflows

### Adding New Pages

1. Create test in `tests/visual/visual-regression.spec.ts`:

```typescript
test.describe('Visual Regression - New Page', () => {
  test('should render correctly', async ({ page }) => {
    await testPageAcrossViewports(page, '/new-page', 'New Page', 'h1');
  });
});
```

2. Run baseline capture:
   ```bash
   npm run test:visual:baseline
   ```

3. Commit snapshots:
   ```bash
   git add tests/visual/__screenshots__/
   git commit -m "feat: add visual tests for new page"
   ```

### Updating After Component Changes

1. Make component changes
2. Run tests:
   ```bash
   npm run test:visual:percy
   ```
3. Review changes in Percy dashboard
4. Approve if intentional
5. Percy auto-updates baseline

### Debugging Failed Tests

```bash
# Run single test suite
npm run test:visual:percy -- --grep "Landing Page"

# Run with debug output
npm run test:visual:percy -- --debug

# Check for timing issues
npm run test:visual:percy -- --headed
```

---

## Snapshot Management

### Storing Snapshots

Snapshots stored in: `tests/visual/__screenshots__/[test-name]/`

**File structure**:
```
tests/visual/__screenshots__/
├── visual-regression-landing-page
│   ├── landing-page-mobile.png
│   ├── landing-page-tablet.png
│   └── landing-page-desktop.png
├── visual-regression-dashboard
│   ├── dashboard-mobile.png
│   ├── dashboard-tablet.png
│   └── dashboard-desktop.png
└── ...
```

### Size Considerations

- ~50-100 snapshots = 150-300 MB
- Recommended: Store snapshots in git LFS for large projects
- Or: Configure Percy to store only diffs

### Cleanup

```bash
# Remove snapshots (re-capture on next run)
rm -rf tests/visual/__screenshots__/

# Remove Percy cache
rm -rf .percy/
```

---

## Percy Configuration Details

### Network Settings

```yaml
discovery:
  network-idle-timeout: 750  # Wait for network idle
  min-height: 1024           # Minimum page height

snapshot:
  wait-for-fonts: true       # Wait for custom fonts
  min-height: 1024           # Capture at least this height
```

### Comparison Threshold

```yaml
comparison:
  threshold: 0.01  # 1% pixel difference tolerance
```

- 0.00 = Exact pixel match required
- 0.01 = 1% difference allowed (good for animations)
- 0.05 = 5% difference allowed (animations, loading states)

### Static Discovery

For static site generation (optional):
```yaml
static:
  cleanUrls: true      # /page -> /page/
  include: 'src/**'    # Include paths
  exclude: '/admin'    # Exclude paths
```

---

## CI/CD Integration

### GitHub Actions Setup

1. **Secrets Configuration**:
   ```
   Settings > Secrets > New Secret
   Name: PERCY_TOKEN
   Value: (from Percy project settings)
   ```

2. **Workflow Triggers**:
   - On PR to main/develop
   - On push to main/develop
   - Daily scheduled (2 AM UTC)

3. **Artifact Storage**:
   - Results kept for 30 days
   - Screenshots uploaded on failure
   - Percy build link in PR comment

### Cost Tracking

Percy free tier: **5,000 snapshots/month**

Current usage:
- Pages tested: 10
- Viewports per page: 3
- Monthly PRs: ~20
- Snapshots per month: 10 × 3 × 20 = **600** (12% of quota)

**Safe**: Well within free tier limits ✅

---

## Troubleshooting

### Percy Token Not Found

```
Error: PERCY_TOKEN environment variable not set
```

**Fix**:
```bash
# Add to .env.local
PERCY_TOKEN=your_token_here

# Or set temporarily
export PERCY_TOKEN=abc123xyz
npm run test:visual:percy
```

### Server Not Ready

```
Error: Failed to fetch http://localhost:3008
```

**Fix**:
```bash
# Make sure dev server is running
npm run dev

# Or wait longer for server startup
sleep 10
npm run test:visual:percy
```

### Playwright Browsers Missing

```
Error: Executable doesn't exist at /path/to/chromium
```

**Fix**:
```bash
npx playwright install --with-deps
npm run test:visual:percy
```

### Visual Differences Not Detected

1. Check snapshot file size (should be > 100KB)
2. Verify viewport size matches config
3. Check for random content (timestamps, IDs)
4. Increase threshold if needed: `comparison.threshold: 0.05`

### Tests Pass Locally But Fail in CI

**Common causes**:
- Font loading differences (CI has different fonts)
- Animation timing (use `waitForTimeout(200)`)
- Network differences (use `waitForLoadState('networkidle')`)

**Fix**:
```typescript
// Wait for stable state
await page.waitForLoadState('networkidle');
await page.waitForTimeout(200);
await percySnapshot(page, 'Test Name');
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Pages tested** | ≥10 | 10 ✅ |
| **Viewports per page** | 3 | 3 ✅ |
| **Snapshot time** | <5s avg | TBD |
| **Test suite time** | <5min total | TBD |
| **Snapshots/month** | ≤5,000 | ~600 ✅ |
| **Percy storage** | <10GB | TBD |

---

## Resources

- **Percy Documentation**: https://docs.percy.io
- **Playwright Testing**: https://playwright.dev
- **GitHub Actions**: https://docs.github.com/en/actions
- **Our Workflow**: `.github/workflows/visual-regression.yml`

---

## Next Steps

1. ✅ Set up Percy.io account
2. ✅ Configure GitHub Actions secret (PERCY_TOKEN)
3. ✅ Capture baseline screenshots
4. ✅ Run first visual regression test
5. Integrate with PR approval workflow
6. Set up Slack notifications for visual changes
7. Create visual regression dashboard

---

**Last Updated**: January 12, 2026
**Maintained by**: Claude Code 2.1.4
**Test Framework**: Playwright + Percy.io
