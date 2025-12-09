# Shadow Observer + Agent Prompt System
## Quick Start (60 seconds)

### 🚀 Run Full Audit
```bash
npm run shadow:full
```

**What it does:**
1. Pulls Supabase schema → `reports/schema_health.json`
2. Scans codebase for violations → `reports/violations.json`
3. Simulates build (type check, lint, test) → `reports/build_simulation.json`
4. Generates refactors & skills via Claude → `reports/agent_prompt_results.json`
5. Creates summary → `reports/FULL_AUDIT_SUMMARY.json`

**Time:** 10-20 minutes
**Cost:** ~$1.50
**Safety:** Read-only, non-destructive

---

### 📊 View Results

```bash
# Summary
cat reports/FULL_AUDIT_SUMMARY.json | jq

# Violations only
cat reports/violations.json | jq '.violations[] | {file, type, severity}'

# Agent results
cat reports/agent_prompt_results.json | jq '.selfVerificationScore'
```

---

### 🔧 Individual Commands

| Command | What it does | Output |
|---------|-----------|--------|
| `npm run shadow:schema` | Pull Supabase schema | `schema_health.json` |
| `npm run shadow:scan` | Find code violations | `violations.json` |
| `npm run shadow:build` | Simulate production build | `build_simulation.json` |
| `npm run shadow:agent` | Run agent refactor/skills | `agent_prompt_results.json` |

---

### 🤖 Agent-Focused Commands

```bash
npm run agent:audit      # Scan code for violations
npm run agent:refactor   # Autonomous refactoring (consumes audit results)
```

---

### 📋 Violation Severity

```
CRITICAL: Data leakage, build failure, runtime crash
  • workspace_filter_missing
  • wrong_supabase_client
  • missing_await_params

HIGH: Type/security issues
  • any_type_used
  • no_error_handling

MEDIUM: Code quality, documentation
  • unused_imports
  • missing_jsoc
  • generic_ui_patterns
```

---

### ✅ Quality Gates

Agent output passes if:
- ✓ Code quality: 9/10+
- ✓ Architecture: 9/10+ (multi-tenant, CLAUDE.md patterns)
- ✓ Type safety: 9/10+
- ✓ Testing: 9/10+
- ✓ Security: 9/10+
- ✓ Documentation: 9/10+
- ✓ Accessibility: 9/10+

If ANY dimension < 9, agent output is rejected (requires manual review).

---

### 🔐 Safety Guarantees

✅ Never modifies source code
✅ Never applies migrations
✅ Never modifies Supabase
✅ All output isolated to `/reports`
✅ Manual approval required before any changes

---

### 📈 What Gets Stored

Metrics automatically inserted into `self_evaluation_factors`:
```sql
-- Stability (test pass rate)
-- Compliance (CLAUDE.md adherence)
-- Quality (agent verification score)
-- Performance (build time)
```

View via:
```sql
SELECT cycle_code, factor, AVG(value) as avg_score
FROM self_evaluation_factors
WHERE created_at >= now() - interval '7 days'
GROUP BY cycle_code, factor
ORDER BY created_at DESC;
```

---

### 🚨 Common Issues

**"Violations report not found"**
```bash
npm run shadow:scan first, then npm run shadow:agent
```

**"Supabase schema pull failed"**
- Check env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**"Build simulation failed"**
```bash
npm run typecheck && npm run lint && npm run test:unit
```

**"Agent quality score < 9/10"**
- Manual review required in `reports/agent_prompt_results.json`

---

### 📚 Full Docs

See `.claude/SHADOW-OBSERVER-GUIDE.md` for:
- Detailed configuration
- Report format specifications
- Integration examples
- Cost breakdowns
- Troubleshooting guide

---

### 💡 Recommended Workflow

**Daily Development:**
```bash
npm run shadow:scan    # Find violations (2 min, free)
npm run lint:fix       # Fix auto-fixable issues
npm run test:unit      # Verify tests pass
```

**Weekly (Full Audit):**
```bash
npm run shadow:full    # Complete audit (15 min, $1.50)
# Review reports/FULL_AUDIT_SUMMARY.json
# Fix critical violations
```

**Continuous (Cron):**
```bash
# Add to API cron job to run hourly
# Stores metrics in self_evaluation_factors
```

---

**Status**: ✅ Production Ready | **Phase**: F07
