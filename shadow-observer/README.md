# Shadow Observer – Intelligence + Infra Guardian

This folder holds **non-destructive** background analysis systems for Unite-Hub.

**Critical Guarantee**: All systems are read-only from code/database and write-only to `/reports/` directory.
No runtime code, migrations, or Supabase schema is ever modified.

---

## Phase 1 – Intelligence Layer (6 Modules)

Specialized engines for skill analysis, risk prediction, refactoring planning, impact simulation, agent routing, and ecosystem evolution.

**Modules**:
- **APPM** – Agent Performance Prediction Model (risk scoring)
- **SRRE** – Skill Refactor Recommendation Engine (refactoring plans)
- **SID** – Skill Intelligence Dashboard (visualization)
- **SISE** – Skill Impact Simulation Engine (scenario modeling)
- **MARO** – Multi-Agent Routing Optimizer (task routing)
- **ASEE** – Autonomous Skill Evolution Engine (blueprint generation)

**Run**:
```bash
npm run intelligence:complete
```

Output: 6 JSON reports in `/reports/`, auto-generated blueprints in `/blueprints/skills/`

---

## Phase 2 – Infra Guardian (4 Modules)

Addresses terminal context bloat and SQL/migration visibility without touching production code.

**Modules**:
1. **SQL Inventory** – Scans `supabase/migrations/` and catalogs all `.sql` files
2. **SQL Diff Plan** – Builds non-destructive checklist for future Supabase cleanup
3. **Context Profiler** – Analyzes repo size, file counts, identifies bloat
4. **CCC Scope Recommender** – Generates include/exclude globs to reduce context overhead

### Commands

```bash
# Run everything (Infra Guardian full cycle)
npm run shadow:infra-full

# Individual modules
npm run shadow:sql-scan          # SQL inventory
npm run shadow:sql-plan          # SQL diff plan
npm run shadow:context-scan      # Context profiling
npm run shadow:context-scope     # CCC recommendations
```

### Recommended Usage

1. **First Time**: Run `npm run shadow:infra-full` to establish baseline
2. **Review Bloat**: Open `reports/context_profile.json` to see where size lives
3. **Optimize Context**: Use globs from `reports/ccc_scope_recommendations.json` in CCC tasks
4. **Plan SQL Cleanup**: Use `reports/sql_migration_inventory.json` + `reports/sql_diff_plan.json` as checklist before Supabase SQL Editor work
5. **Later**: Wire a **read-only** DB snapshot step and expand diff plan into actual migration SQL (future phase)

---

## File Structure

```
shadow-observer/
├── intelligence/          ← Phase 1: 6 analysis modules
│   ├── appm/
│   ├── srre/
│   ├── simulation/
│   ├── routing/
│   ├── evolution/
│   ├── run-all-intelligence.ts
│   └── run-complete-intelligence.ts
├── sql/                   ← Phase 2: SQL inventory & diffing
│   ├── sql-inventory.ts
│   ├── sql-diff-plan.ts
│   └── index.ts
├── context/               ← Phase 2: Context profiling & CCC
│   ├── context-profiler.ts
│   ├── ccc-scope-recommender.ts
│   └── index.ts
├── run-infra-guardian.ts  ← Phase 2 Orchestrator
└── README.md
```

---

## Reports Generated

### Phase 1 (Intelligence)
- `reports/agent_performance_prediction_*.json` – APPM risk assessments
- `reports/skill_refactor_plan_*.json` – SRRE refactor plans
- `reports/skill_refactor_plan_*.md` – SRRE plans in Markdown
- `reports/skill_impact_simulation_*.json` – SISE scenario modeling
- `reports/agent_routing_recommendations_*.json` – MARO routing rules
- `reports/skill_evolution_plan_*.json` – ASEE evolution plans
- `reports/COMPLETE_INTELLIGENCE_*.json` – Unified orchestrator report
- `/blueprints/skills/` – Auto-generated skill blueprint markdown files

### Phase 2 (Infra Guardian)
- `reports/sql_migration_inventory.json` – Full catalog of migration files with metadata
- `reports/sql_diff_plan.json` – Non-destructive checklist for SQL cleanup
- `reports/context_profile.json` – Directory bloat analysis, large file list
- `reports/ccc_scope_recommendations.json` – Recommended include/exclude globs
- `reports/ccc_scope_recommendations.md` – Human-readable CCC globs guide

---

## Design Principles

### Non-Destructive
- ✅ Reads only from code and existing reports
- ✅ Writes only to `/reports/` and `/blueprints/`
- ✅ Never modifies live code, database, or migrations
- ✅ Safe to run repeatedly without side effects

### Advisory-Only
- All recommendations are draft/checklist only
- No auto-execution, no schema changes, no code generation
- All destructive actions require explicit human review in Supabase SQL Editor

### Modular & Extensible
- Each module runs standalone or coordinated
- Config-driven (easy to tune weights and thresholds)
- Clear separation of concerns
- Graceful degradation on missing reports

---

## Integration with Codebase

### With Next.js App
- SID Dashboard reads Phase 1 reports and displays at `/admin/skill-intelligence`
- API endpoint serves consolidated intelligence data

### With Supabase
- No direct DB access (only reads migration files and reports)
- Diff plan is skeleton; actual SQL execution requires manual Supabase SQL Editor step

### With Version Control
- All reports are git-ignored (generated artifacts)
- Migration files in `supabase/migrations/` are source of truth

---

## Performance & Cost

| Phase | Modules | Time | Cost |
|-------|---------|------|------|
| Intelligence | 6 | <20s | ~$0.10 |
| Infra Guardian | 4 | <5s | <$0.01 |
| **Combined** | **10** | **<25s** | **~$0.11** |

All operations use no AI API calls (Infra Guardian is pure file I/O).

---

## Next Steps

### Short Term (This Week)
- Run `npm run shadow:infra-full` once to establish baseline
- Review `context_profile.json` for bloat opportunities
- Apply CCC globs from `ccc_scope_recommendations.json` to reduce context overhead

### Medium Term (This Month)
- Use `sql_diff_plan.json` + `sql_migration_inventory.json` as checklist
- Plan SQL cleanup in Supabase SQL Editor (manual, read-only first)
- Review and approve Evolution plans from Phase 1 ASEE module

### Long Term (Next Quarter)
- Wire read-only DB snapshot export to Phase 2
- Expand diff plan skeleton into actual Supabase migration SQL
- Automate regular Intelligence Layer runs via Inngest
- Add Slack alerts for high-risk findings

---

## Documentation

- **Intelligence Layer**: See `COMPLETE-INTELLIGENCE-LAYER-README.md` (1,200+ lines)
- **Infra Guardian**: This README
- **Quick Start**: `INTELLIGENCE-LAYER-QUICK-START.md` (5-minute overview)
- **Full Guide**: `INTELLIGENCE-LAYER-DELIVERY.md` (2,000+ lines)

---

**Status**: 🟢 **Phase 1 Complete + Phase 2 Complete**
**Last Updated**: December 9, 2025
**Non-Destructive**: 100% Guaranteed
