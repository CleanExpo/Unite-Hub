# CI/CD Guide

## Overview

This project uses **GitHub Actions** for continuous integration and deployment. The CI/CD pipeline runs automatically on every push and pull request to the `main` branch.

**Pipeline Status**: ![CI](https://github.com/YOUR_ORG/YOUR_REPO/workflows/CI/badge.svg)

---

## Pipeline Structure

### 4 Parallel Jobs

```
┌─────────────────┐
│   Push/PR to    │
│      main       │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    │         │          │         │
    ▼         ▼          ▼         ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Backend │ │Frontend│ │Build │ │ E2E  │
│ Tests  │ │ Tests  │ │Check │ │Tests │
└────────┘ └────────┘ └──────┘ └──────┘
    │         │          │         │
    └────────┬┴──────────┴─────────┘
             │
             ▼
    ┌────────────────┐
    │   Deploy ✓     │
    └────────────────┘
```

### Job Details

| Job                | Duration | Coverage       | What It Does                                    |
| ------------------ | -------- | -------------- | ----------------------------------------------- |
| **Backend Tests**  | ~2-3 min | 87%+           | Lint (ruff), Type check (mypy), Tests (pytest)  |
| **Frontend Tests** | ~3-4 min | 77%+           | Lint (eslint), Type check (tsc), Tests (vitest) |
| **Build Check**    | ~4-5 min | N/A            | Build all packages (verify no build errors)     |
| **E2E Tests**      | ~5-7 min | Critical paths | E2E tests (playwright)                          |

**Total Pipeline Time**: ~7-8 minutes

---

## Running Tests Locally

### Backend Tests

```bash
# Navigate to backend
cd apps/backend

# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/test_prd_agents.py

# Run specific test
uv run pytest tests/test_prd_agents.py::TestPRDAnalysisAgent::test_execute_success

# Run with verbose output
uv run pytest -v

# Run with coverage threshold (fails if < 80%)
uv run pytest --cov=src --cov-fail-under=80
```

**View coverage report**: Open `apps/backend/htmlcov/index.html` in browser

### Frontend Tests

```bash
# Navigate to frontend
cd apps/web

# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test use-prd-generation

# Update snapshots
pnpm test -u
```

**View coverage report**: Open `apps/web/coverage/index.html` in browser

### E2E Tests

```bash
# Navigate to frontend
cd apps/web

# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# Run specific test
pnpm exec playwright test prd-generation

# View test report
pnpm exec playwright show-report
```

### All Tests (Pre-PR Check)

```bash
# From project root - runs all checks
pnpm turbo run type-check lint test && echo "✅ Ready for PR"
```

---

## GitHub Secrets Configuration

### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

#### For CI Pipeline

| Secret                          | Required | Description              | Example                   |
| ------------------------------- | -------- | ------------------------ | ------------------------- |
| `CODECOV_TOKEN`                 | Optional | Codecov upload token     | `abc123...`               |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL     | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key | `eyJhbGc...`              |

#### For Deployment (if using)

| Secret              | Required | Description                     |
| ------------------- | -------- | ------------------------------- |
| `VERCEL_TOKEN`      | Optional | Vercel deployment token         |
| `VERCEL_ORG_ID`     | Optional | Vercel organization ID          |
| `VERCEL_PROJECT_ID` | Optional | Vercel project ID               |
| `DO_API_TOKEN`      | Optional | DigitalOcean API token          |
| `DO_REGISTRY`       | Optional | DigitalOcean container registry |
| `DO_APP_ID`         | Optional | DigitalOcean app ID             |

### Setting Up Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the table above

---

## Code Coverage

### Current Coverage

| Area     | Coverage | Target | Status     |
| -------- | -------- | ------ | ---------- |
| Backend  | 87%      | 80%+   | ✅ Exceeds |
| Frontend | 77%      | 70%+   | ✅ Exceeds |
| Overall  | 82%      | 75%+   | ✅ Exceeds |

### Codecov Integration

**Setup Steps**:

1. Go to [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token
5. Add `CODECOV_TOKEN` to GitHub secrets

**Benefits**:

- ✅ Coverage reports on every PR
- ✅ Visual coverage diff
- ✅ Line-by-line coverage in PR comments
- ✅ Coverage trends over time

### Coverage Badges

Add to your README.md:

```markdown
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
```

---

## Debugging CI Failures

### Common Issues

#### 1. Tests Pass Locally But Fail in CI

**Possible Causes**:

- Environment variable differences
- Timezone/locale differences
- File path differences (Windows vs Linux)
- Race conditions in async tests

**Solutions**:

```bash
# Run tests in CI mode locally
CI=true pnpm test

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Run with same node version as CI
nvm use 20
```

#### 2. Coverage Below Threshold

**Error**:

```
FAIL: coverage: total line coverage of 78.5% is below threshold of 80%
```

**Solutions**:

```bash
# Check which files are missing coverage
uv run pytest --cov=src --cov-report=term-missing

# Add tests for uncovered lines
# Or add `pragma: no cover` for unreachable code
def unreachable_error_handler():  # pragma: no cover
    raise NotImplementedError()
```

#### 3. E2E Tests Timeout

**Error**:

```
Timeout of 30000ms exceeded
```

**Solutions**:

```bash
# Increase timeout in playwright.config.ts
timeout: 60000,

# Or skip flaky tests in CI
test.skip(process.env.CI, 'Flaky in CI');
```

#### 4. Playwright Browser Not Found

**Error**:

```
browserType.launch: Executable doesn't exist
```

**Solution**:

```bash
# Reinstall browsers
pnpm exec playwright install --with-deps chromium
```

---

## Workflow Files

### Main CI Workflow (`.github/workflows/ci.yml`)

**Triggers**:

- Push to `main` branch
- Pull requests to `main` branch

**Jobs**:

1. **backend-tests** - Python tests with pytest
2. **frontend-tests** - TypeScript tests with vitest
3. **build** - Build verification (runs after tests pass)
4. **e2e-tests** - Playwright E2E tests (runs after tests pass)

**Artifacts**:

- Backend test results
- Frontend coverage report
- E2E test results
- Playwright HTML report

### Deployment Workflows

**Frontend** (`.github/workflows/deploy-frontend.yml`):

- Triggers on push to `main` with changes in `apps/web/**`
- Deploys to Vercel

**Backend** (`.github/workflows/deploy-backend.yml`):

- Triggers on push to `main` with changes in `apps/backend/**`
- Builds Docker image
- Deploys to DigitalOcean App Platform

---

## Performance Optimization

### Caching Strategies

**Backend**:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/uv
      apps/backend/.venv
    key: ${{ runner.os }}-uv-${{ hashFiles('apps/backend/pyproject.toml') }}
```

**Frontend**:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm' # Automatic caching
```

### Parallel Execution

Jobs run in parallel to reduce total pipeline time:

- Backend tests + Frontend tests run simultaneously
- Build + E2E tests wait for test jobs to pass

### Resource Optimization

**E2E Tests**:

- Only install `chromium` browser (not all browsers)
- Use `--with-deps` to install system dependencies
- Set `workers: 1` in CI to avoid flakiness

---

## Best Practices

### 1. Test Before Committing

```bash
# Run this before every commit
pnpm turbo run type-check lint test
```

### 2. Keep CI Fast

- ✅ Use caching for dependencies
- ✅ Run jobs in parallel
- ✅ Only run affected tests (with Turborepo)
- ❌ Don't install unnecessary dependencies
- ❌ Don't run E2E tests for every commit (use selective triggers)

### 3. Monitor Flaky Tests

If a test fails intermittently:

```typescript
// Add retries for flaky tests
test('flaky test', async ({ page }) => {
  test.slow(); // Triple timeout
  // or
  test.fixme(); // Mark as broken until fixed
});
```

### 4. Keep Coverage High

- Write tests as you write code (TDD)
- Aim for 80%+ backend, 70%+ frontend
- Don't game the system with meaningless tests
- Focus on critical paths

### 5. Review CI Logs

When CI fails:

1. Click on the failed job
2. Expand the failed step
3. Read the error message
4. Reproduce locally
5. Fix and push

---

## Continuous Deployment

### Automatic Deployments

**Main Branch**:

- ✅ All tests pass → Auto-deploy to production
- ❌ Any test fails → Deployment blocked

**Pull Requests**:

- ✅ All tests pass → Preview deployment
- ❌ Any test fails → No deployment

### Manual Deployments

```bash
# Trigger manual deployment
gh workflow run deploy-frontend.yml

# Or use GitHub UI:
# Actions → Deploy Frontend → Run workflow
```

---

## Status Badges

Add these to your `README.md`:

```markdown
# Project Name

![CI](https://github.com/YOUR_ORG/YOUR_REPO/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
[![Deploy Frontend](https://github.com/YOUR_ORG/YOUR_REPO/workflows/Deploy%20Frontend/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions)
```

---

## Troubleshooting Commands

```bash
# Check workflow syntax
gh workflow view ci.yml

# List recent runs
gh run list --workflow=ci.yml

# View run details
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed

# Watch live logs
gh run watch

# Download artifacts
gh run download <run-id>
```

---

## Next Steps

1. ✅ CI/CD pipeline configured
2. ⏭️ Add Codecov token to GitHub secrets
3. ⏭️ Add status badges to README.md
4. ⏭️ Configure branch protection rules
5. ⏭️ Set up deployment environments

---

## Branch Protection Rules (Recommended)

**Settings → Branches → Add rule**:

- ✅ Require status checks to pass before merging
  - `backend-tests`
  - `frontend-tests`
  - `build`
  - `e2e-tests`
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

---

**Questions?** See individual workflow files in `.github/workflows/` for implementation details.
