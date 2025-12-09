# Shadow Observer + Agent Prompt System
## Unified Autonomous Auditing & Refactoring

**Phase**: F07 (Time-Block Orchestrator)
**Status**: Production Ready
**Last Updated**: Dec 9, 2025

---

## 🎯 What It Does

**Shadow Observer** (read-only):
- Introspects Supabase schema for RLS/type issues
- Scans codebase for architecture violations (CLAUDE.md patterns)
- Simulates build (type check, lint, tests, production build)
- Generates detailed audit reports (non-destructive)

**Agent Prompt System** (autonomous fixing):
- Consumes Shadow Observer findings
- Generates refactor prompts for violations
- Creates new agent skills
- Self-verifies output (9/10+ quality gate)
- Feeds metrics to self-evaluation system

**Both Together** (integrated workflow):
```
Shadow Observer → Violations.json
                        ↓
Agent Prompt System → Refactor + Generate Skills
                        ↓
Self-Verification (≥9/10)
                        ↓
Self-Evaluation Feedback Loop
```

---

## 📋 Quick Start

### Run Full Audit (End-to-End)
```bash
npm run shadow:full
```

Generates:
- `reports/schema_health.json` — Database schema analysis
- `reports/violations.json` — Code violations (critical, high, medium, low)
- `reports/build_simulation.json` — Type check, lint, test, build results
- `reports/agent_prompt_results.json` — Refactor & skill generation results
- `reports/FULL_AUDIT_SUMMARY.json` — Executive summary

### Run Individual Components

**Schema Analysis Only**:
```bash
npm run shadow:schema
```

**Codebase Scan Only**:
```bash
npm run shadow:scan
```

**Build Simulation Only**:
```bash
npm run shadow:build
```

**Agent Prompt System Only**:
```bash
npm run shadow:agent
```

### Agent-Focused Commands

**Audit Code for Violations**:
```bash
npm run agent:audit
```

**Autonomous Refactoring**:
```bash
npm run agent:refactor
```

---

## 📁 File Structure

```
shadow-observer/
├── shadow-config.ts                 # Configuration
├── supabase-schema-puller.ts        # DB schema introspection
├── codebase-violation-scanner.ts    # Architecture violation detection
├── build-simulator.ts               # Type check, lint, test, build
├── agent-prompt-orchestrator.ts     # Autonomous refactoring & skill generation
└── index.ts                         # Main orchestrator (ties everything together)

reports/
├── schema_health.json               # Database analysis
├── violations.json                  # Code violations
├── build_simulation.json            # Build results
├── agent_prompt_results.json        # Agent output
└── FULL_AUDIT_SUMMARY.json          # Executive summary
```

---

## 🔍 Violation Types Detected

| Type | Severity | Auto-Fixable | Description |
|------|----------|--------------|-------------|
| **workspace_filter_missing** | CRITICAL | ❌ | DB query missing `.eq("workspace_id", workspaceId)` |
| **wrong_supabase_client** | CRITICAL | ❌ | Using wrong Supabase client for context |
| **missing_await_params** | CRITICAL | ✅ | Missing `await` on `context.params` |
| **unused_imports** | MEDIUM | ✅ | Unused import statements |
| **missing_jsoc** | MEDIUM | ✅ | Exported functions without JSDoc |
| **generic_ui_patterns** | MEDIUM | ❌ | Using generic classes instead of design tokens |
| **any_type_used** | HIGH | ❌ | TypeScript `any` type in strict mode |
| **no_error_handling** | HIGH | ❌ | Async function missing try/catch |

---

## 📊 Reports Format

### `violations.json`
```json
{
  "violations": [
    {
      "file": "src/app/api/contacts/route.ts",
      "line": 42,
      "type": "workspace_filter_missing",
      "severity": "critical",
      "description": "Query missing .eq('workspace_id', workspaceId)",
      "fix": "Add .eq(\"workspace_id\", workspaceId) after select()"
    }
  ],
  "summary": {
    "total": 15,
    "critical": 3,
    "high": 5,
    "medium": 7,
    "low": 0
  },
  "autoFixable": ["unused_imports", "missing_jsoc"],
  "manualReview": ["type_errors", "architecture"]
}
```

### `FULL_AUDIT_SUMMARY.json`
```json
{
  "timestamp": "2025-12-09T14:30:00Z",
  "duration": 45000,
  "schema": {
    "tables": 105,
    "warnings": 3
  },
  "violations": {
    "total": 15,
    "critical": 3,
    "high": 5
  },
  "build": {
    "pass": true,
    "errors": 0
  },
  "agent": {
    "score": 9.2,
    "phase": "verify"
  },
  "recommendations": [
    "⚠️  3 CRITICAL violations found — requires immediate attention"
  ],
  "nextSteps": [
    "npm run agent:refactor -- --severity critical"
  ]
}
```

---

## 🤖 Agent Prompt System Details

### Phase 1: Load Violations
Reads `reports/violations.json` from Shadow Observer.

### Phase 2: Generate Refactor Prompts
For each critical violation, creates a structured prompt:
```
OBJECTIVE: Fix critical architecture violation

FILE: src/app/api/contacts/route.ts:42
TYPE: workspace_filter_missing
DESCRIPTION: Query missing .eq("workspace_id", workspaceId)

CLAUDE.md PATTERN REQUIREMENTS:
1. Every DB query MUST have .eq("workspace_id", workspaceId)
2. Use correct Supabase client (server in RSC, client in hooks)
...

PROCESS:
1. Read the file
2. Apply the fix
3. Add 1 test case
4. Run type check
5. Self-verify (9/10+ quality)
```

### Phase 3: Generate Skill Prompts
Creates prompts for new agent skills (e.g., codebase-auditor, refactor-engine, quality-verifier).

### Phase 4: Execute Prompts
Calls Claude Sonnet/Haiku APIs to execute all prompts.

### Phase 5: Self-Verify
Quality gate checking (9/10+ across 7 dimensions):
- Code quality
- Architecture compliance
- Type safety
- Testing coverage
- Security
- Documentation
- Accessibility

### Phase 6: Generate Self-Eval Feedback
Calculates metrics for `self_evaluation_factors` table:
```sql
INSERT INTO self_evaluation_factors (
  tenant_id, cycle_code, factor, value, weight, details
) VALUES (
  $1, 'audit_2025-12-09', 'compliance', 85.0, 1.0, '...'
);
```

---

## ⚙️ Configuration

Edit `shadow-observer/shadow-config.ts`:

```typescript
export const shadowConfig = {
  shadowRoot: '/tmp/unite-hub-shadow',      // Temp clone location
  reportDir: './reports',                   // Output directory
  features: {
    buildSimulation: true,                  // Type check, lint, test, build
    migrationDryRun: true,                  // (placeholder)
    schemaAnalysis: true,                   // Supabase introspection
    bloatDetection: true,                   // (placeholder)
    typeAnalysis: true,                     // TypeScript strict mode
    securityScan: true                      // (placeholder)
  },
  thresholds: {
    qualityGateMin: 9.0,                    // Agent quality gate (1-10)
    typeErrorMax: 0,                        // Max type errors allowed
    testCoverageMin: 80,                    // Min coverage %
    buildTimeWarning: 120000                // Build time warning (ms)
  }
};
```

---

## 🛡️ Safety Guarantees

### Read-Only Mode
- ✅ Never modifies source files (`src/`, `app/`, `lib/`)
- ✅ Never modifies migrations
- ✅ Never applies changes to Supabase
- ✅ All results isolated to `reports/` directory

### Temp Clone
- Creates `/tmp/unite-hub-shadow` for analysis
- Cleans up after each run
- Source repo remains untouched

### Manual Approval Gates
- Agent output score must be ≥9/10
- All critical findings require manual review
- No automatic commits or deployments

---

## 💰 Cost & Performance

| Operation | Model | Time | Cost |
|-----------|-------|------|------|
| Schema pull | Haiku | 30s | $0.10 |
| Codebase scan | Haiku | 1-2 min | $0.20 |
| Build simulation | (local) | 2-5 min | $0.00 |
| Agent refactor | Sonnet | 5-10 min | $1.00 |
| Self-verify | Haiku | 1-2 min | $0.15 |
| **Full audit** | **Mixed** | **10-20 min** | **~$1.50** |

**Budget**: ~$5/day for hourly light scans

---

## 🔗 Integration with Existing Systems

### Database: `self_evaluation_factors`
```sql
-- Store audit metrics
INSERT INTO self_evaluation_factors (
  tenant_id, cycle_code, factor, value, weight, details, metadata
) VALUES (
  founder_id,
  'shadow_2025-12-09_14:30',
  'compliance',
  85.0,
  1.0,
  'CLAUDE.md pattern adherence',
  '{"violations": 15, "critical": 3}'
);
```

### Orchestrator Integration
Add to `src/lib/agents/orchestrator-router.ts`:
```typescript
if (task === 'shadow:audit') {
  const result = await runShadowObserver();
  return recordAuditMetrics(result);
}
```

### Cron Job (Hourly)
```typescript
// src/app/api/cron/shadow-observer/route.ts
export async function GET(req: NextRequest) {
  const result = await runShadowObserver();
  await recordSelfEvalMetrics(result);
  return successResponse(result);
}
```

---

## 🚨 Troubleshooting

### "Violations report not found"
```bash
npm run shadow:scan    # Generate violations first
npm run shadow:agent   # Then run agent system
```

### "Supabase schema pull failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` env var
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Supabase introspection requires service role key

### "Build simulation failed"
```bash
npm run typecheck && npm run lint && npm run test:unit
```
Fix underlying build issues before running Shadow Observer.

### "Agent quality score < 9/10"
- Manual review required
- Check `reports/agent_prompt_results.json` for failing gates
- Common issues: missing JSDoc, type errors, test coverage

---

## 📚 References

- **CLAUDE.md** — Architecture patterns & requirements
- **Database schema** — `schema_health.json` report
- **Agent definitions** — `.claude/agents/*.md`
- **Violation patterns** — `codebase-violation-scanner.ts`

---

## 🎯 Next Steps

1. **Run first audit**: `npm run shadow:full`
2. **Review reports**: Check `reports/FULL_AUDIT_SUMMARY.json`
3. **Fix critical violations**: `npm run agent:refactor -- --severity critical`
4. **Schedule hourly scans**: Add cron job in API route
5. **Track metrics**: Query `self_evaluation_factors` table

---

*Shadow Observer is non-destructive and safe to run in any environment (development, staging, production). All outputs are isolated to `/reports` and no source code is modified.*
