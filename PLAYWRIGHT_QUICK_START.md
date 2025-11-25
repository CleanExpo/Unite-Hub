# Playwright E2E Tests - Quick Start Guide

## Installation

```bash
# Install Playwright (if not already installed)
npm install -D @playwright/test

# Download browsers
npx playwright install

# Install optional dependencies
npm install -D @playwright/test @testing-library/react @testing-library/user-event
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test strategy-create

# Run specific test
npx playwright test TC-601

# Run tests in debug mode
npx playwright test --debug

# Run tests with UI mode
npx playwright test --ui
```

### Browser-Specific

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit

# All browsers
npx playwright test
```

### Execution Options

```bash
# Sequential execution (recommended for real-time tests)
npx playwright test --workers=1

# Parallel execution
npx playwright test --workers=4

# With retries (for CI)
npx playwright test --retries=2

# Keep browser open after test
npx playwright test --headed --slow-mo=1000
```

## Viewing Results

```bash
# Show HTML report
npx playwright show-report

# Show specific report
npx playwright show-report test-results/html

# List all reports
ls -la test-results/
```

## Test Output Files

After running tests, you'll find:

- `test-results/html/` - Interactive HTML report
- `test-results/results.json` - Machine-readable results
- `test-results/junit.xml` - JUnit format (for CI/CD)
- Videos/traces - if enabled

## Environment Setup

### Start the Development Server

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npx playwright test
```

### Environment Variables

```bash
# Custom base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3008 npx playwright test

# Enable traces
PLAYWRIGHT_TRACE=on npx playwright test

# Record videos
PLAYWRIGHT_VIDEO=on npx playwright test

# Slow motion (ms)
PLAYWRIGHT_SLOW_MO=500 npx playwright test
```

## Test Structure

```
tests/
├── fixtures.ts                    # Reusable fixtures & helpers
├── global-setup.ts               # Setup before all tests
├── global-teardown.ts            # Cleanup after all tests
└── strategy/
    ├── strategy-create.spec.ts    # TC-101 to TC-107
    ├── strategy-hierarchy.spec.ts # TC-201 to TC-210
    ├── strategy-validation.spec.ts# TC-301 to TC-311
    ├── strategy-synergy.spec.ts   # TC-401 to TC-411
    ├── strategy-history.spec.ts   # TC-501 to TC-510
    └── strategy-realtime.spec.ts  # TC-601 to TC-612
```

## Test Categories

### Strategy Creation (7 tests)
```bash
npx playwright test TC-101  # Load dashboard
npx playwright test TC-102  # Submit objective
npx playwright test TC-103  # Wait validation
npx playwright test TC-104  # Assert hierarchy
npx playwright test TC-105  # Check metrics
npx playwright test TC-106  # Error handling
npx playwright test TC-107  # Verify API
```

### Hierarchy Rendering (10 tests)
```bash
npx playwright test TC-20   # All hierarchy tests
```

### Validation Pipeline (11 tests)
```bash
npx playwright test TC-30   # All validation tests
```

### Synergy Analysis (11 tests)
```bash
npx playwright test TC-40   # All synergy tests
```

### History Timeline (10 tests)
```bash
npx playwright test TC-50   # All history tests
```

### Real-Time Updates (12 tests)
```bash
npx playwright test TC-60   # All real-time tests
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 3008
# Windows
netstat -ano | findstr :3008
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3008
kill -9 <PID>
```

### Browser Not Installing
```bash
# Force browser download
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### Tests Timing Out
```bash
# Increase timeout
npx playwright test --timeout=120000

# Or in playwright.config.ts
timeout: 120000  // 2 minutes
```

### Test Data Issues
```bash
# Clear local storage between tests
# Tests automatically handle via fixtures

# Force fresh start
npx playwright test --no-reuse-existing-server
```

## Debugging Tips

### 1. Use Headed Mode
```bash
npx playwright test --headed --headed
```

### 2. Add Debugging Points
```typescript
// In your test
await page.pause();  // Pauses execution, opens inspector
```

### 3. View Network Requests
```bash
npx playwright test --trace=on
npx playwright show-trace trace.zip
```

### 4. Take Screenshots
```bash
# Automatically on failure, or use:
await page.screenshot({ path: 'screenshot.png' });
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npx playwright test

- name: Upload results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-results
    path: test-results/
```

### Jenkins
```groovy
sh 'npx playwright test --reporter=junit'
junit 'test-results/junit.xml'
```

## Performance Monitoring

The test suite monitors:
- **Polling intervals**: Should start at 5s, increase to 20s
- **Response times**: Should be < 5s average
- **UI flicker**: Should be < 20 mutations/sec
- **Request deduplication**: Concurrent duplicates merged
- **Focus refresh**: Should complete in < 2 seconds

## Test Reports

After running tests:

```bash
# View HTML report
npx playwright show-report

# Check results.json for programmatic access
cat test-results/results.json | jq '.stats'

# View JUnit for CI systems
cat test-results/junit.xml
```

## Useful Commands

```bash
# List all available tests
npx playwright test --list

# Count tests
npx playwright test --list | wc -l

# Run tests matching pattern
npx playwright test -g "focus"

# Run tests not matching pattern
npx playwright test --grep-invert "history"

# Run tests on specific line
npx playwright test tests/strategy/strategy-create.spec.ts:50
```

## Next Steps

1. **Run tests locally**: `npx playwright test`
2. **Review results**: `npx playwright show-report`
3. **Fix any failures**: Check test output for details
4. **Add to CI/CD**: Use examples above
5. **Monitor regularly**: Add to deployment pipeline

---

For more information, see `PHASE_3_E2E_TESTING_GUIDE.md`
