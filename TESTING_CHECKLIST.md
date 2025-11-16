# Testing Infrastructure - Team Onboarding Checklist

Use this checklist to get started with the Unite-Hub testing infrastructure.

---

## Phase 1: Setup (Day 1)

### Environment Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Copy `.env.test` to `.env.test.local`
- [ ] Add real test credentials to `.env.test.local`
  - [ ] Supabase test project URL
  - [ ] Supabase test anon key
  - [ ] Anthropic API test key
- [ ] Verify Playwright browsers installed (`npx playwright install`)

### Verify Installation
- [ ] Run unit tests: `npm test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Generate coverage: `npm run test:coverage`
- [ ] Open coverage report: `open coverage/index.html`

---

## Phase 2: Understanding (Day 2-3)

### Review Documentation
- [ ] Read `TESTING_GUIDE.md` (30 min)
- [ ] Read `TESTING_INFRASTRUCTURE_SUMMARY.md` (20 min)
- [ ] Review `tests/README.md` (10 min)

### Explore Test Structure
- [ ] Review `tests/helpers/auth.ts` - Authentication utilities
- [ ] Review `tests/helpers/db.ts` - Database helpers
- [ ] Review `tests/helpers/api.ts` - API testing utilities
- [ ] Review `tests/fixtures/index.ts` - Test data

### Run Example Tests
- [ ] Run rate-limit tests: `npx vitest tests/unit/lib/rate-limit.test.ts`
- [ ] Run auth tests: `npx vitest tests/integration/api/auth.test.ts`
- [ ] Run component tests: `npx vitest tests/components/`
- [ ] Run E2E tests in UI mode: `npm run test:e2e:ui`

---

## Phase 3: Writing First Test (Day 4)

### Pick a Simple Feature
- [ ] Choose an untested utility function
- [ ] Create test file: `tests/unit/lib/[name].test.ts`

### Write Test Using Template
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Run and Verify
- [ ] Run your test: `npx vitest path/to/test.test.ts`
- [ ] Verify it passes
- [ ] Check coverage impact: `npm run test:coverage`

---

## Phase 4: Expand Coverage (Week 2)

### Unit Tests
- [ ] Test 3-5 utility functions in `src/lib/`
- [ ] Test 1-2 AI agents in `src/lib/agents/`
- [ ] Test validation helpers

### Integration Tests
- [ ] Test 5-10 API routes
- [ ] Test database operations
- [ ] Test workspace isolation

### Component Tests
- [ ] Test 3-5 interactive components
- [ ] Test form submissions
- [ ] Test error states

### E2E Tests
- [ ] Test 1-2 complete user flows
- [ ] Test error recovery
- [ ] Test mobile responsiveness

---

## Phase 5: Best Practices (Ongoing)

### Code Review
- [ ] Require tests for new features
- [ ] Check coverage in PR reviews
- [ ] Verify tests are actually testing behavior (not just coverage)

### Maintenance
- [ ] Run tests before committing: `npm test`
- [ ] Fix flaky tests immediately
- [ ] Update test data when schemas change
- [ ] Keep coverage above 40% minimum

### Team Standards
- [ ] Use test helpers instead of duplicating code
- [ ] Write descriptive test names
- [ ] Test both happy path and error cases
- [ ] Keep tests fast (<5 seconds per suite)

---

## Common Tasks Quick Reference

### Running Tests
```bash
npm test                    # All unit + integration
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:e2e            # E2E tests
```

### Debugging
```bash
npx vitest --inspect-brk    # Debug unit tests
npm run test:ui             # Interactive UI
npm run test:e2e:ui         # Playwright UI
npx playwright test --debug # E2E debug mode
```

### Coverage
```bash
npm run test:coverage       # Generate report
open coverage/index.html    # View report
```

---

## Red Flags to Watch For

### ❌ Bad Practices
- [ ] Tests passing but not actually testing anything
- [ ] Tests that depend on each other
- [ ] Shared mutable state between tests
- [ ] Hard-coded test data everywhere
- [ ] setTimeout instead of waitFor
- [ ] Mocking internal business logic
- [ ] Tests taking >10 seconds to run

### ✅ Good Practices
- [ ] Each test is independent
- [ ] Descriptive test names
- [ ] Using test helpers
- [ ] Testing user behavior (not implementation)
- [ ] Fast test execution
- [ ] Clear error messages
- [ ] Proper async handling

---

## Getting Help

### Resources
- **Documentation**: `TESTING_GUIDE.md`
- **Examples**: Browse `tests/` directory
- **Helpers**: `tests/helpers/` and `tests/fixtures/`

### Common Issues
- **Mock not working**: Check if mock is defined before import
- **Test failing randomly**: Check for shared state or async issues
- **Coverage not updating**: Clear coverage: `rm -rf coverage/`
- **E2E test failing**: Check if dev server is running

### Ask the Team
- Share test examples in code reviews
- Discuss flaky tests in standups
- Pair program on complex tests
- Document patterns that work

---

## Success Metrics

### Individual Developer
- [ ] Can write unit test in <10 minutes
- [ ] Can write component test in <15 minutes
- [ ] Can debug failing tests efficiently
- [ ] Understands when to use each test type

### Team
- [ ] 40%+ code coverage maintained
- [ ] All new features have tests
- [ ] Test suite runs in <5 minutes
- [ ] <5% flaky test rate

---

## Next Steps After Onboarding

1. **Week 1**: Write 5-10 tests for existing code
2. **Week 2**: Require tests for new features
3. **Week 3**: Achieve 50% coverage
4. **Month 2**: Achieve 60% coverage
5. **Month 3**: Achieve 70% coverage

---

**Questions?** Ask in team chat or create an issue!

**Last Updated**: 2025-11-16
