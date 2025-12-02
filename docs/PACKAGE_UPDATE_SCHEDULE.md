# Package Update Schedule

**Status**: 📦 Package Management
**Priority**: P3-5 (LOW)
**Created**: 2025-12-03
**Last Audit**: 2025-12-03
**Next Audit**: 2025-12-17 (2 weeks)

---

## Executive Summary

**Total Outdated Packages**: 42
- **Critical Security**: 0 packages
- **High Priority**: 5 packages
- **Medium Priority**: 14 packages
- **Low Priority**: 23 packages

**Recommendation**: Update high-priority packages first (Supabase, Anthropic, Next.js), then batch medium/low priority updates during next maintenance window.

---

## Critical Security Updates (P0)

**None identified** ✅

All security-critical packages are up-to-date based on `npm audit` results.

---

## High Priority Updates (P1)

These packages are core dependencies that should be updated soon:

| Package | Current | Wanted | Latest | Priority | Breaking Changes |
|---------|---------|--------|--------|----------|-----------------|
| `@supabase/supabase-js` | 2.81.1 | 2.86.0 | 2.86.0 | HIGH | Likely minor fixes, check changelog |
| `@supabase/ssr` | 0.7.0 | 0.7.0 | 0.8.0 | HIGH | May affect server-side rendering |
| `next` | 16.0.1 | 16.0.6 | 16.0.6 | HIGH | 5 patch versions behind |
| `@anthropic-ai/sdk` | 0.71.0 | *(current)* | *(check latest)* | HIGH | Check for new Claude models |
| `@types/node` | 20.19.25 | 20.19.25 | 24.10.1 | MEDIUM | Major version jump, check compatibility |

---

## Medium Priority Updates (P2)

Updates that improve functionality but are less urgent:

### Cloud & Storage (4 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@aws-sdk/client-cloudfront` | 3.936.0 | 3.943.0 | 3.943.0 | AWS SDK updates frequently, safe to update |
| `@aws-sdk/client-s3` | 3.936.0 | 3.943.0 | 3.943.0 | Same as cloudfront |
| `@google-cloud/storage` | 7.17.3 | 7.18.0 | 7.18.0 | Minor update, safe |
| `@azure/storage-blob` | 12.29.1 | *(current)* | *(check)* | Not shown as outdated |

### AI & Analytics (4 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@openrouter/sdk` | 0.1.11 | 0.1.27 | 0.2.9 | Major version jump 0.1 → 0.2, check breaking changes |
| `@sentry/nextjs` | 10.27.0 | 10.28.0 | 10.28.0 | Minor update, safe |
| `posthog-js` | 1.298.1 | 1.299.0 | 1.299.0 | Minor update, safe |
| `openai` | 6.9.0 | 6.9.1 | 6.9.1 | Patch update, safe |

### Payments & Integrations (2 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@stripe/react-stripe-js` | 5.3.0 | 5.4.1 | 5.4.1 | Check for new features |
| `stripe` | 19.3.1 | 19.3.1 | 20.0.0 | Major version jump, check changelog |

### React & State Management (4 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@tanstack/react-query` | 5.90.10 | 5.90.11 | 5.90.11 | Patch update, safe |
| `react-hook-form` | 7.66.0 | 7.67.0 | 7.67.0 | Minor update, safe |
| `react-day-picker` | 9.11.1 | 9.11.3 | 9.11.3 | Patch update, safe |
| `zustand` | 4.5.7 | 4.5.7 | 5.0.9 | Major version jump, check breaking changes |

---

## Low Priority Updates (P3)

These updates are non-critical and can be batched:

### Dev Dependencies (10 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@typescript-eslint/eslint-plugin` | 8.48.0 | 8.48.1 | 8.48.1 | Patch update |
| `@typescript-eslint/parser` | 8.48.0 | 8.48.1 | 8.48.1 | Patch update |
| `@vitest/coverage-v8` | 1.6.1 | 1.6.1 | 4.0.15 | Major version jump, check breaking changes |
| `@vitest/ui` | 1.6.1 | 1.6.1 | 4.0.15 | Major version jump |
| `vitest` | 1.6.1 | 1.6.1 | 4.0.15 | Major version jump |
| `happy-dom` | 12.10.3 | 12.10.3 | 20.0.11 | Major version jump |
| `@vitejs/plugin-react` | 4.7.0 | 4.7.0 | 5.1.1 | Major version jump |
| `msw` | 2.12.2 | 2.12.3 | 2.12.3 | Patch update |
| `@playwright/mcp` | 0.0.46 | 0.0.46 | 0.0.49 | Alpha version, update cautiously |
| `playwright` | 1.57.0-alpha | *(current)* | *(check)* | Alpha version |

### UI & Animation (4 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `framer-motion` | 12.23.24 | 12.23.25 | 12.23.25 | Patch update |
| `lucide-react` | 0.462.0 | 0.462.0 | 0.555.0 | Large version jump, check icons |
| `shadcn` | 3.5.0 | 3.5.1 | 3.5.1 | Patch update |
| `tailwind-merge` | 2.6.0 | 2.6.0 | 3.4.0 | Major version jump |

### Backend & Utilities (5 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@opentelemetry/auto-instrumentations-node` | 0.67.1 | 0.67.2 | 0.67.2 | Patch update |
| `convex` | 1.29.1 | 1.30.0 | 1.30.0 | Minor update |
| `nodemailer` | 7.0.10 | 7.0.11 | 7.0.11 | Patch update |
| `rate-limiter-flexible` | 8.2.1 | 8.3.0 | 9.0.0 | Major version jump, check changelog |
| `supabase` | 2.63.1 | 2.65.0 | 2.65.0 | Minor update (CLI tool) |

### Type Definitions (4 packages)

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| `@types/dompurify` | 3.2.0 | 3.0.5 | 3.0.5 | Version downgrade? Check if intentional |
| `@types/next-auth` | 3.15.0 | 3.13.0 | 3.13.0 | Version downgrade? Check if intentional |
| `@types/nodemailer` | 7.0.3 | 7.0.4 | 7.0.4 | Patch update |
| `@types/react` | 18.3.26 | 18.3.27 | 19.2.7 | Major version jump (React 19 types) |
| `@types/react-dom` | 18.3.7 | 18.3.7 | 19.2.3 | Major version jump (React 19 types) |

---

## Deferred Updates (Hold)

Packages to **NOT** update yet due to breaking changes or stability concerns:

| Package | Current | Latest | Reason to Hold |
|---------|---------|--------|----------------|
| `zod` | 3.25.76 | 4.1.13 | Major version jump, likely breaking changes |
| `@types/react` | 18.x | 19.x | Wait until React 19 is stable in production |
| `@types/react-dom` | 18.x | 19.x | Same as above |
| `rate-limiter-flexible` | 8.x | 9.x | Major version, check breaking changes first |

---

## Update Strategy

### Phase 1: High Priority (Week 1) ✅

**Goal**: Update core dependencies with minimal risk

```bash
# Supabase updates (critical for database operations)
npm install @supabase/supabase-js@2.86.0 @supabase/ssr@0.8.0

# Next.js patch updates (bug fixes, security)
npm install next@16.0.6

# Test thoroughly after each update
npm run test && npm run test:e2e && npm run build
```

**Testing Requirements**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass (auth, contact management)
- [ ] Dev server starts without errors
- [ ] Production build succeeds
- [ ] Supabase connection works
- [ ] Authentication flow works

---

### Phase 2: Medium Priority (Week 2-3) ✅

**Goal**: Update cloud SDKs, analytics, and minor dependencies

```bash
# AWS SDK updates
npm install @aws-sdk/client-cloudfront@3.943.0 @aws-sdk/client-s3@3.943.0

# Analytics updates
npm install @sentry/nextjs@10.28.0 posthog-js@1.299.0

# React libraries
npm install @tanstack/react-query@5.90.11 react-hook-form@7.67.0 react-day-picker@9.11.3

# Test after batch update
npm run test && npm run build
```

**Testing Requirements**:
- [ ] Unit tests pass
- [ ] Build succeeds
- [ ] No console warnings in dev
- [ ] Sentry error tracking works
- [ ] PostHog analytics works

---

### Phase 3: Low Priority (Week 4) ✅

**Goal**: Update dev dependencies and non-critical packages

```bash
# ESLint & TypeScript
npm install -D @typescript-eslint/eslint-plugin@8.48.1 @typescript-eslint/parser@8.48.1

# UI libraries
npm install framer-motion@12.23.25 shadcn@3.5.1

# Backend utilities
npm install nodemailer@7.0.11 convex@1.30.0 supabase@2.65.0

# Test
npm run test && npm run lint
```

**Testing Requirements**:
- [ ] Linting works
- [ ] UI components render correctly
- [ ] Animations work

---

### Phase 4: Major Version Updates (Future) 🔄

**Goal**: Evaluate and test major version updates in separate PRs

These require careful testing and may have breaking changes:

1. **Vitest 1.x → 4.x**
   - Create branch: `upgrade/vitest-4`
   - Update test configuration
   - Run full test suite
   - Check for breaking changes in API

2. **Zustand 4.x → 5.x**
   - Create branch: `upgrade/zustand-5`
   - Review [Zustand v5 migration guide](https://github.com/pmndrs/zustand/releases)
   - Update all store implementations
   - Test state management thoroughly

3. **Stripe 19.x → 20.x**
   - Create branch: `upgrade/stripe-20`
   - Review [Stripe SDK changelog](https://github.com/stripe/stripe-node/releases)
   - Update webhook handlers
   - Test payment flows end-to-end

4. **OpenRouter 0.1.x → 0.2.x**
   - Create branch: `upgrade/openrouter-0.2`
   - Review OpenRouter SDK changelog
   - Update AI integration code
   - Test SEO research and content generation

5. **Zod 3.x → 4.x**
   - Create branch: `upgrade/zod-4`
   - Review [Zod v4 breaking changes](https://github.com/colinhacks/zod/releases)
   - Update all schema definitions
   - Run full validation test suite

---

## Update Process

### 1. Pre-Update Checklist

Before updating any package:

- [ ] **Check changelog**: Read release notes for breaking changes
- [ ] **Review dependencies**: Ensure peer dependencies are compatible
- [ ] **Check issues**: Search GitHub issues for known problems
- [ ] **Backup current state**: Commit all changes, create branch
- [ ] **Run tests**: Ensure all tests pass before update
- [ ] **Document current versions**: Record in this file

---

### 2. Update Procedure

```bash
# 1. Create update branch
git checkout -b update/package-name-version

# 2. Update package
npm install package-name@version

# 3. Update lock file
npm install

# 4. Run tests
npm run test
npm run test:e2e
npm run test:integration

# 5. Check for warnings
npm run dev
# Watch console for deprecation warnings

# 6. Build for production
npm run build

# 7. Check bundle size
npm run build
# Review .next/analyze output

# 8. Commit changes
git add package.json package-lock.json
git commit -m "chore: update package-name to version X.Y.Z"

# 9. Test in staging environment
npm run start
# Manual testing of key features

# 10. Create PR
git push origin update/package-name-version
gh pr create --title "chore: Update package-name to X.Y.Z"
```

---

### 3. Post-Update Testing

**Critical Paths to Test**:

- [ ] **Authentication Flow**
  - Login with Google
  - Logout
  - Session persistence
  - PKCE flow

- [ ] **Database Operations**
  - Create contact
  - Update contact
  - Delete contact
  - Workspace isolation

- [ ] **AI Agents**
  - Email agent processing
  - Content generation
  - Sentiment analysis
  - Lead scoring

- [ ] **Campaigns**
  - Create drip campaign
  - Send test email
  - Track opens/clicks

- [ ] **Integrations**
  - Gmail sync
  - Stripe webhooks
  - Sentry error tracking
  - PostHog analytics

---

### 4. Rollback Procedure

If update causes issues:

```bash
# 1. Revert package.json and package-lock.json
git checkout main -- package.json package-lock.json

# 2. Reinstall dependencies
npm install

# 3. Run tests to verify rollback
npm run test

# 4. Document rollback reason
echo "Rollback reason: [describe issue]" >> ROLLBACK_LOG.md

# 5. Create issue to track problem
gh issue create --title "Package update rollback: package-name" \
  --body "Update to version X.Y.Z caused: [describe issue]"
```

---

## CI/CD Considerations

### Automated Testing

**Current CI Pipeline** (`.github/workflows/`):

```yaml
# Add to existing CI workflow
- name: Install dependencies
  run: npm ci

- name: Run unit tests
  run: npm run test:unit

- name: Run integration tests
  run: npm run test:integration

- name: Run E2E tests
  run: npm run test:e2e

- name: Build production
  run: npm run build

- name: Check bundle size
  run: |
    npm run build
    # Add bundle size check
```

---

### Dependency Update Automation

**Option 1: Dependabot (Recommended)**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    reviewers:
      - "your-team"
    labels:
      - "dependencies"
    commit-message:
      prefix: "chore"
      include: "scope"
    ignore:
      # Ignore major version updates for breaking change packages
      - dependency-name: "zod"
        update-types: ["version-update:semver-major"]
      - dependency-name: "zustand"
        update-types: ["version-update:semver-major"]
      - dependency-name: "vitest"
        update-types: ["version-update:semver-major"]
```

**Option 2: Renovate Bot**

More configurable, better for monorepos, but requires more setup.

---

## Breaking Change Alerts

### Packages to Watch

| Package | Version | Known Breaking Changes |
|---------|---------|------------------------|
| `@openrouter/sdk` | 0.2.x | API signature changes, check docs |
| `zustand` | 5.x | Store API changes, check migration guide |
| `zod` | 4.x | Schema API changes, check changelog |
| `stripe` | 20.x | Webhook event types, check docs |
| `vitest` | 4.x | Config changes, check migration guide |
| `rate-limiter-flexible` | 9.x | Constructor changes, check docs |

---

## Package Update Log

### 2025-12-03 - Initial Audit

**Audited**: 42 outdated packages
**Action**: Created this document, no updates performed
**Next Review**: 2025-12-17

---

### Template for Future Updates

```markdown
### YYYY-MM-DD - [Update Description]

**Updated Packages**:
- package-name: X.Y.Z → A.B.C

**Breaking Changes**: None / [Description]

**Testing Results**:
- [ ] Unit tests: Pass/Fail
- [ ] Integration tests: Pass/Fail
- [ ] E2E tests: Pass/Fail
- [ ] Production build: Pass/Fail

**Issues Found**: None / [Description]

**Rollback Required**: No / Yes - [Reason]

**Next Review**: YYYY-MM-DD
```

---

## Related Documentation

- **Security Audit**: `docs/API_ROUTE_SECURITY_AUDIT.md`
- **Testing Guide**: `CLAUDE.md` (Test section)
- **CI/CD**: `.github/workflows/`
- **Package.json**: `package.json`

---

## References

- [npm outdated documentation](https://docs.npmjs.com/cli/v10/commands/npm-outdated)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)

---

**Last Updated**: 2025-12-03
**Next Audit**: 2025-12-17 (bi-weekly schedule)
**Status**: ✅ Audit complete, update schedule created
**Action Required**: Begin Phase 1 updates (high priority) in next sprint
