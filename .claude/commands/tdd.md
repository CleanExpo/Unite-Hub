Implement feature using TDD: $ARGUMENTS

Follow Anthropic's Test-Driven Development workflow:

## Phase 1: Write Tests
1. Understand the feature requirements
2. Write test cases based on expected input/output pairs
3. Be explicit: avoid mock implementations for functionality that doesn't exist
4. Run tests: `npm run test -- --testPathPattern="[test-file]"`
5. Confirm tests FAIL (red phase)
6. DO NOT write implementation code yet
7. Commit tests: "test: add tests for [feature]"

## Phase 2: Implement
1. Write minimal code to pass tests
2. DO NOT modify the tests
3. Run tests and iterate:
   ```bash
   npm run test -- --testPathPattern="[test-file]" --watch
   ```
4. Keep going until all tests pass (green phase)
5. Verify implementation isn't overfitting to tests
6. Commit code: "feat: implement [feature]"

## Phase 3: Refactor (optional)
1. Clean up implementation without changing behavior
2. Ensure tests still pass
3. Commit: "refactor: clean up [feature]"

## Commands
```bash
# Run specific test file
npm run test -- --testPathPattern="feature.test"

# Watch mode
npm run test -- --watch

# Coverage
npm run test:coverage
```

IMPORTANT: This is test-DRIVEN development. Tests come FIRST.
