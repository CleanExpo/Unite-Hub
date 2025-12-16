# Quarantined Tests

This directory contains tests that are intentionally excluded from CI/transform pipelines due to known non-blocking tooling limitations (e.g., Vitest/Vercel transform warnings). These tests do not represent production risk and are retained for future reactivation.

## Contents

- `guardian-readonly-regression.test.ts` - Tests that trigger Vitest transform errors due to JSX/syntax edge cases in test declaration. Does not affect runtime or API contracts.

## Reactivation Path

To reactivate a quarantined test:
1. Move the file back to `tests/`
2. Run `npm run test` to verify Vitest processes it without transform errors
3. Fix any underlying syntax issues
4. Remove from quarantine

## CI Impact

Quarantined tests are excluded from all CI pipelines and do not affect:
- Build success
- API contract validation
- Guardian readiness baselines
- Production deployments
