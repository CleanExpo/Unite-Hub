# Shadow Observer Testing Guide
## How to Test the Complete System

---

## ✅ Test 1: Configuration Loading

```bash
# Test that shadow-config loads correctly
node -e "const cfg = require('./shadow-observer/shadow-config.ts'); console.log(cfg.shadowConfig.reportDir)"
```

**Expected**: Prints `./reports`

---

## ✅ Test 2: Schema Puller (Requires Supabase)

```bash
# Pull Supabase schema (read-only)
npm run shadow:schema
```

**Expected**:
- ✓ `reports/schema_health.json` created
- ✓ Contains table count and warning array
- ✓ No errors (graceful failure if Supabase unavailable)

**Check output**:
```bash
cat reports/schema_health.json | jq '.tables | length'  # Should show table count
cat reports/schema_health.json | jq '.warnings | length' # Should show warning count
```

---

## ✅ Test 3: Violation Scanner

```bash
# Scan codebase for violations
npm run shadow:scan
```

**Expected**:
- ✓ `reports/violations.json` created
- ✓ Contains violation array with file, line, type, severity
- ✓ Summary with totals (critical, high, medium, low)
- ✓ autoFixable and manualReview arrays

**Check output**:
```bash
# Count violations by severity
cat reports/violations.json | jq '.summary'

# View first violation
cat reports/violations.json | jq '.violations[0]'

# Count auto-fixable types
cat reports/violations.json | jq '.autoFixable | length'
```

**Expected violations**: 0-10 (depends on current code state)

---

## ✅ Test 4: Build Simulator

```bash
# Simulate production build
npm run shadow:build
```

**Expected**:
- ✓ `reports/build_simulation.json` created
- ✓ Contains typeCheckPass, lintPass, testPass, buildPass booleans
- ✓ Performance metrics (time in ms for each stage)
- ✓ Errors array (if any failed)

**Check output**:
```bash
# View summary
cat reports/build_simulation.json | jq '{
  typeCheck: .typeCheckPass,
  lint: .lintPass,
  tests: .testPass,
  build: .buildPass
}'

# View performance
cat reports/build_simulation.json | jq '.performance'

# View any errors
cat reports/build_simulation.json | jq '.errors | length'
```

**Expected**: All true (or graceful failures with error messages)

---

## ✅ Test 5: Agent Prompt Orchestrator

```bash
# Run agent refactoring system
npm run shadow:agent
```

**Prerequisites**:
- `reports/violations.json` must exist (run Test 3 first)
- `ANTHROPIC_API_KEY` must be set

**Expected**:
- ✓ `reports/agent_prompt_results.json` created
- ✓ Contains selfVerificationScore (0-10)
- ✓ Contains violations array
- ✓ Contains recommendations array

**Check output**:
```bash
# View quality score
cat reports/agent_prompt_results.json | jq '.selfVerificationScore'

# View phase
cat reports/agent_prompt_results.json | jq '.phase'

# View recommendations
cat reports/agent_prompt_results.json | jq '.recommendations'
```

**Expected score**: 7-10 (9+ = passes quality gate)

---

## ✅ Test 6: Full End-to-End Audit

```bash
# Run complete audit
npm run shadow:full
```

**Expected**:
- ✓ All 5 report files created
- ✓ `FULL_AUDIT_SUMMARY.json` with executive summary
- ✓ Execution time: 10-20 minutes
- ✓ Cost: ~$1.50

**Check output**:
```bash
# View executive summary
cat reports/FULL_AUDIT_SUMMARY.json | jq '{
  schema: .schema,
  violations: .violations,
  build: .build,
  agent: .agent,
  recommendations: .recommendations | length
}'

# Check all files exist
ls -la reports/*.json
```

**Expected files**:
```
reports/
├── schema_health.json
├── violations.json
├── build_simulation.json
├── agent_prompt_results.json
└── FULL_AUDIT_SUMMARY.json
```

---

## 🔍 Test 7: Report Validation

```bash
# Validate all JSON reports
for file in reports/*.json; do
  echo "Validating $file..."
  jq empty "$file" && echo "✓ Valid JSON" || echo "✗ Invalid JSON"
done
```

**Expected**: All files pass validation

---

## 🧪 Test 8: Safety Verification

```bash
# Verify no source files were modified
git status --porcelain src/ app/ lib/ supabase/

# Verify reports directory only
git status --porcelain reports/
```

**Expected**:
- ✓ No changes to `src/`, `app/`, `lib/`, `supabase/`
- ✓ Only files in `reports/` are new/modified

---

## 💻 Test 9: Individual Commands

```bash
# Test each npm script
npm run shadow:schema    # Schema analysis
npm run shadow:scan     # Violation scan
npm run shadow:build    # Build simulation
npm run shadow:agent    # Agent system
npm run agent:audit     # Audit alias
npm run agent:refactor  # Refactor alias
```

**Expected**: All commands run without errors (graceful failures for missing dependencies)

---

## 🚨 Test 10: Error Handling

### Missing Violations Report
```bash
rm reports/violations.json
npm run shadow:agent  # Should fail with clear error message
```

**Expected error**: "Violations report not found: ./reports/violations.json"

### Missing ANTHROPIC_API_KEY
```bash
unset ANTHROPIC_API_KEY
npm run shadow:agent  # Should fail with auth error
```

**Expected error**: "ANTHROPIC_API_KEY not set"

### Invalid JSON in Report
```bash
echo "invalid" > reports/violations.json
npm run shadow:agent  # Should fail with parse error
```

**Expected error**: "SyntaxError: Unexpected token..."

---

## 📊 Test 11: Cost Verification

```bash
# Calculate API calls per run
npm run shadow:full 2>&1 | grep -i "claude\|anthropic\|api"

# Rough cost: ~5-10 API calls per full audit
# Haiku (scan): 0.8k tokens × $0.00001/token = $0.01 per call
# Sonnet (agent): 10k tokens × $0.01/token = $0.10 per call
```

**Expected cost**: $1-2 per full audit

---

## ✨ Test 12: Performance Baseline

```bash
# Time each component
time npm run shadow:schema    # Should be < 1 min
time npm run shadow:scan     # Should be < 2 min
time npm run shadow:build    # Should be < 5 min
time npm run shadow:agent    # Should be < 10 min
```

**Expected times**:
- Schema: 30-60 sec
- Scan: 60-120 sec
- Build: 120-300 sec (depends on typecheck/test times)
- Agent: 300-600 sec (depends on API latency)

---

## 🎯 Success Criteria

All tests pass if:

| Test | Status | Evidence |
|------|--------|----------|
| 1. Config loads | ✅ | Prints config value |
| 2. Schema pulls | ✅ | JSON file with tables |
| 3. Violations scan | ✅ | JSON file with violations |
| 4. Build simulates | ✅ | JSON file with pass/fail |
| 5. Agent runs | ✅ | JSON file with score |
| 6. Full audit completes | ✅ | 5 report files |
| 7. JSON valid | ✅ | All files parse |
| 8. No source mods | ✅ | Only `/reports` changed |
| 9. Commands work | ✅ | All 7 scripts execute |
| 10. Errors handled | ✅ | Clear error messages |
| 11. Cost reasonable | ✅ | ~$1-2 per audit |
| 12. Performance ok | ✅ | <30 min total |

---

## 🚀 Quick Test Script

Save as `test-shadow-observer.sh`:

```bash
#!/bin/bash
set -e

echo "Testing Shadow Observer + Agent Prompt System"
echo "=============================================="
echo ""

echo "Test 1: Schema puller..."
npm run shadow:schema 2>/dev/null && echo "✅ Schema puller" || echo "⚠️  Schema puller (Supabase unavailable)"

echo ""
echo "Test 2: Violation scanner..."
npm run shadow:scan && echo "✅ Violation scanner" || echo "❌ Violation scanner failed"

echo ""
echo "Test 3: Build simulator..."
npm run shadow:build && echo "✅ Build simulator" || echo "❌ Build simulator failed"

echo ""
echo "Test 4: Agent orchestrator..."
npm run shadow:agent && echo "✅ Agent orchestrator" || echo "❌ Agent orchestrator failed"

echo ""
echo "Test 5: Validating reports..."
jq empty reports/*.json && echo "✅ All reports valid JSON" || echo "❌ Invalid JSON"

echo ""
echo "Test 6: Safety check..."
git status --porcelain src/ app/ lib/ supabase/ | wc -l | xargs -I {} bash -c '[ {} -eq 0 ] && echo "✅ No source files modified" || echo "❌ Source files modified"'

echo ""
echo "=============================================="
echo "Testing complete! Review reports:"
echo "  • reports/schema_health.json"
echo "  • reports/violations.json"
echo "  • reports/build_simulation.json"
echo "  • reports/agent_prompt_results.json"
echo "  • reports/FULL_AUDIT_SUMMARY.json"
```

Run it:
```bash
chmod +x test-shadow-observer.sh
./test-shadow-observer.sh
```

---

## 📝 Test Results Log

Create `TEST_RESULTS.json` to track runs:

```json
{
  "testSuite": "Shadow Observer",
  "runs": [
    {
      "date": "2025-12-09T14:30:00Z",
      "schemaTest": "passed",
      "scanTest": "passed",
      "buildTest": "passed",
      "agentTest": "passed",
      "totalTime": 720,
      "totalCost": 1.45,
      "violations": 15,
      "agentScore": 9.2
    }
  ]
}
```

---

## 🔗 Integration Testing

Test integration with existing systems:

```bash
# Test: Self-evaluation metrics storage
npm run shadow:full
# Then query:
# SELECT * FROM self_evaluation_factors
# WHERE cycle_code LIKE 'shadow_%'
# ORDER BY created_at DESC LIMIT 1;

# Test: Orchestrator integration
# Add to src/lib/agents/orchestrator-router.ts
# Run: npm run orchestrator
# Verify Shadow Observer metrics in orchestration logs
```

---

**All tests should pass before deploying to production.**
