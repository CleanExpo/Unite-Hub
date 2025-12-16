# Guardian Test Failure Classification

**Summary**: 107 failing tests across 15+ test files, primarily Guardian Z-series integration tests

## Categories & Root Causes

### Category 1: Supabase Mock/Contract Issues (47 tests)
**Files**:
- `z10_meta_governance_safeguards_and_release_gate.test.ts` (36 tests)
- `z12_meta_continuous_improvement_loop.test.ts` (11 tests)

**Root Cause**: Functions calling `getSupabaseServer()` which is mocked but returns incomplete/unchainable query builders.

**Pattern**:
```
Error: supabase.from(...).select(...).eq is not a function
OR
Error: Expected data but got undefined (missing mock returns)
```

**Example Tests**:
- `should log configuration change event` - audit log insert fails
- `should create improvement cycle with valid input` - cycle CRUD fails
- `should list improvement cycles with pagination` - query chain breaks

**Fix Strategy**: Complete chainable Supabase mock with `.single()`, `.count()`, and proper data returns

---

### Category 2: AI/Claude API Fallback Failures (11 tests)
**Files**:
- `z07_meta_integration_and_success_toolkit.test.ts` (4 tests)
- `z10_meta_governance_safeguards_and_release_gate.test.ts` (7 tests)

**Root Cause**: Functions calling `getAnthropicClient()` or `callAnthropicWithRetry()` without mocks. Tests expect deterministic fallback behavior.

**Pattern**:
```
Error: Cannot read property 'messages' of undefined
OR
Expected fallback narrative but got null
```

**Example Tests**:
- `should handle AI disabled gracefully` - no fallback implemented
- `should generate fallback narrative when AI disabled` - fallback not exported
- `should use deterministic explanation if AI disabled` - missing mock

**Fix Strategy**: Mock Anthropic client globally, ensure fallback functions always return valid values

---

### Category 3: Data Shape/Contract Mismatches (18 tests)
**Files**:
- `z02_guided_uplift_planner_and_adoption_playbooks.test.ts` (6 tests)
- `z04_executive_reports_and_timeline.test.ts` (8 tests)
- `z03_editions_and_fit_scoring.test.ts` (1 test)
- `z08_program_goals_okrs_and_kpi_alignment.test.ts` (2 tests)
- `plugin_03_restoration_signals.test.ts` (6 tests)

**Root Cause**: Tests expect specific field names, structures, or non-null values that mock data doesn't provide.

**Pattern**:
```
Expected result.playbooks[0].trigger_conditions to exist
OR
Expected narrative.includes('readiness') but got undefined
```

**Example Tests**:
- `should have valid trigger conditions` - missing field
- `should include readiness trend in narrative` - field not in mock response
- `should predict readiness maturity milestone` - null data from mock

**Fix Strategy**: Ensure mock returns match expected data shapes; document minimal required fields

---

### Category 4: Playwright E2E/UI Test Issues (5 tests)
**Files**:
- `guardian-ui-smoke.spec.ts`
- `guardian-executive-ui-smoke.spec.ts`
- `guardian-scorecard-ui-smoke.spec.ts`

**Root Cause**: Browser automation tests requiring actual Next.js server and Supabase connectivity.

**Pattern**:
```
Timeout waiting for selector
OR
Page not reachable / Cannot GET /guardian/...
```

**Fix Strategy**: Either skip (document rationale) or setup integration test database

---

### Category 5: Caching/Contract Registry Issues (8 tests)
**Files**:
- `guardian-readiness-cache-contract.test.ts` (file-level failure)
- `guardian-readiness-contract.test.ts` (2 tests)
- `guardian-api-contract.test.ts` (2 tests)
- `guardian-narrative.test.ts` (1 test)
- `guardian-readonly-regression.test.ts` (file-level failure)

**Root Cause**: Tests assume caching layer or readiness snapshot availability; DB schema queries fail.

**Pattern**:
```
Cannot query guardian_tenant_readiness_scores (table doesn't exist in test env)
OR
Expected deterministic shape but got null
```

**Fix Strategy**: Mock cache responses; provide deterministic empty state shapes

---

### Category 6: Signal Detection & Plugin Logic (6 tests)
**Files**:
- `plugin_03_restoration_signals.test.ts` (6 tests)
- `h02_anomaly_detection.test.ts` (3 tests)

**Root Cause**: Complex signal/threshold logic with floating-point comparisons or missing test fixtures.

**Pattern**:
```
Expected spike detected but got false
OR
Expected SLA drift >= 3 but got 0
```

**Example Tests**:
- `should detect mould risk spike with anomalies + risk elevation`
- `should detect fire event spike (2x incident baseline)`
- `should handle mixed feature availability`

**Fix Strategy**: Provide complete mock signal data matching exact thresholds

---

### Category 7: H-Series (H01-H05) Governance/Rules Tests (6 tests)
**Files**:
- `h01_ai_rule_suggestion_studio.test.ts` (3 tests)
- `h04_incident_scoring.test.ts` (1 test)
- `h05_governance_coach.test.ts` (3 tests)

**Root Cause**: Advanced governance features with AI integration; missing mocks for suggestion storage/feedback.

**Pattern**:
```
Cannot insert rule suggestions (no mock for .insert())
OR
Expected status update but got undefined
```

**Fix Strategy**: Add complete CRUD mocks for H-series database operations

---

## Summary Table

| Category | Count | Root Cause | Fix Complexity |
|----------|-------|-----------|-----------------|
| Supabase Mock Issues | 47 | Query builder chains incomplete | Medium |
| AI/Claude Fallbacks | 11 | Missing mocks, no fallback exports | Medium |
| Data Shape Contracts | 18 | Mock responses don't match schema | Low |
| E2E/UI Tests | 5 | Need live server/DB | High |
| Caching/Schema | 8 | DB tables not in test env | Medium |
| Signal Detection | 6 | Mock fixture gaps | Low |
| H-Series Governance | 6 | Advanced mocking needed | Medium |
| **TOTAL** | **107** | | |

---

## Recommended Fix Order

1. **Priority 1**: Fix Supabase mocks (47 tests) - biggest ROI
2. **Priority 2**: Add AI/Claude fallback mocks (11 tests)
3. **Priority 3**: Normalize data shapes across Z-series (18 tests)
4. **Priority 4**: Document & skip E2E tests (5 tests)
5. **Priority 5**: Create deterministic cache responses (8 tests)
6. **Priority 6**: Complete H-series CRUD mocks (6 tests)
7. **Priority 7**: Fix signal detection fixtures (6 tests)

**Estimated Time to ≥99% pass rate**: 3-4 hours focused work on mocks + contracts

---

## Next Steps (B2-B5)

- Create centralized `tests/__mocks__/` directory with shared Guardian mocks
- Normalize Supabase chainable interface across all tests
- Add Anthropic client mock globally
- Document rationale for any skipped tests
