# Shadow Observer Complete System: Quick Start

**Full autonomous auditing with Skill Intelligence + Distraction Shield**

---

## 🎯 One Command to Start

```bash
npm run shadow:full
```

This runs the complete 7-step audit:

```
1. Schema Analysis         → reports/schema_health.json
2. Violation Scan          → reports/violations.json
3. Build Simulation        → reports/build_simulation.json
4. Agent Prompt System     → reports/agent_prompt_results.json
5. Skill Intelligence      → reports/SVIE_*.json
6. Distraction Shield      → reports/DISTRACTION_SHIELD_*.json
7. Summary Report          → reports/FULL_AUDIT_SUMMARY.json
```

**Duration**: ~2-5 minutes
**Cost**: ~$2 (via Claude API calls)

---

## 📊 View Results

```bash
# Summary (all metrics)
cat reports/FULL_AUDIT_SUMMARY.json | jq

# Just the scores
cat reports/FULL_AUDIT_SUMMARY.json | jq '{
  violations: .violations,
  agent_score: .agent.score,
  svie_summary: .svie,
  distraction_health: .distractionShield
}'

# SVIE skills analysis
cat reports/SVIE_*.json | jq '.summary'

# Distraction shield action plan
cat reports/DISTRACTION_SHIELD_*.json | jq '.actionPlan[]'
```

---

## 🔍 What It Checks

### Codebase Health
- **Schema**: 142 tables checked for RLS, types, indexes
- **Violations**: 8 types (workspace_filter missing, wrong client, any_type, etc.)
- **Build**: typecheck, lint, test, full build simulation
- **Agent**: AI-powered refactoring quality score

### Skill Health (SVIE)
- Analyzes 45+ skills from `.claude/skills/`
- Scores: expertise (1-10), health (1-10), performance (1-10)
- Flags: underutilized (<5 uses), deprecated (90+ days old), bloated (>50KB), no tests
- Recommendation: consolidate low-value skills, promote high-value ones

### Focus Quality (Distraction Shield)
- Distraction events: total, by source, severity, prevention rate
- Focus sessions: depth score, completion rate, interruptions
- Correlation: how distractions impact focus depth
- Health score: 0-100 with 5-level status (excellent → critical)
- Action plan: prioritized steps (🚨 critical → ✅ optimize)

---

## 💾 Database Integration

**Automatic**: Results stored in `self_evaluation_factors` table via:
- Stability factor (100 - critical_violations × 10)
- Compliance factor (100 - high_violations × 5)
- Quality factor (agent_score × 10)
- Performance factor (90 if build passes)

Query stored metrics:
```sql
SELECT cycle_code, factor, value, created_at
FROM self_evaluation_factors
WHERE cycle_code LIKE 'shadow_%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔄 Continuous Monitoring

**Automatic hourly cron job** (runs at :00 every hour):
- Executes `npm run shadow:full`
- Records metrics to database
- Available via Inngest dashboard
- Can be manually triggered: `npm run shadow:cron`

---

## 🎛️ Individual Commands

```bash
# Codebase only (schema, violations, build, agent)
npm run shadow:scan

# Skills analysis only
npm run shadow:skills

# Focus/distraction analysis only
npm run shadow:distractions

# Schema analysis only
npm run shadow:schema

# Violations only
npm run shadow:violations

# Build simulation only
npm run shadow:build

# Agent refactoring only
npm run shadow:refactor
```

---

## 🏥 Health Indicators at a Glance

### If Distraction Shield Shows "CRITICAL"
- Focus sessions < 50% completion
- Recovery time > 60 minutes
- > 40% sessions affected by distractions
- **Action**: Implement focus fortress (phone off, Slack DND, email batching)

### If SVIE Shows High "Underutilized" Count
- 5+ skills used < 5 times
- **Action**: Plan consolidation or deprecation

### If Violations > 10
- **Action**: Run `npm run agent:refactor -- --severity critical`

### If Build Fails
- **Action**: Run `npm run typecheck && npm run test:unit`

---

## 📈 Typical Health Scores

| Component | Good | Needs Attention |
|-----------|------|-----------------|
| Codebase Violations | < 5 | > 15 |
| Agent Score | 8.5+ | < 7 |
| Build Status | ✓ Pass | ✗ Fail |
| Distraction Shield | 70+ | < 50 |
| Focus Completion | 80%+ | < 60% |
| Prevention Rate | 80%+ | < 60% |

---

## 🚀 First Time Setup

1. **Ensure environment variables** are set:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="..."
   export SUPABASE_SERVICE_ROLE_KEY="..."
   export ANTHROPIC_API_KEY="..."
   ```

2. **Run audit**:
   ```bash
   npm run shadow:full
   ```

3. **Check reports**:
   ```bash
   ls -lh reports/
   ```

4. **Review summary**:
   ```bash
   cat reports/FULL_AUDIT_SUMMARY.json | jq '.recommendations'
   ```

5. **Act on recommendations** in order of priority

---

## 📚 Full Documentation

- **Complete Guide**: `/.claude/SHADOW-OBSERVER-GUIDE.md`
- **Integration Details**: `SUBSYSTEMS-INTEGRATION-COMPLETE.md`
- **Orchestrator Setup**: `ORCHESTRATOR-INTEGRATION-GUIDE.md`

---

## ⚡ Key Files

```
shadow-observer/
├── index.ts                          (main orchestrator)
├── shadow-config.ts                  (configuration)
├── supabase-schema-puller.ts         (schema analysis)
├── codebase-violation-scanner.ts     (violation detection)
├── build-simulator.ts                (build testing)
├── agent-prompt-orchestrator.ts      (AI refactoring)
├── svie/                             (Skill Intelligence)
│   ├── skill-analyzer.ts             (500+ lines)
│   └── svie-config.ts                (configuration)
└── distraction-shield/               (Focus Intelligence)
    ├── distraction-analyzer.ts       (distraction patterns)
    ├── focus-analyzer.ts             (focus quality)
    ├── run-distraction-shield.ts     (orchestrator)
    └── distraction-config.ts         (configuration)
```

---

## 🎓 Example Workflows

### Sprint Planning
```bash
# Check if codebase ready for sprint
npm run shadow:full

# Review violations.json for technical debt
# Check SVIE for skill deprecations
# Plan next sprint based on quality score
```

### Code Review
```bash
# Scan for violations before merge
npm run shadow:scan

# Check violations.json
# If critical: block merge until fixed
```

### Founder Wellness
```bash
# Check focus patterns
npm run shadow:distractions

# Review action plan
# Implement top priority recommendations
```

### Continuous Monitoring
```bash
# Already running hourly via Inngest
# Check database metrics
SELECT AVG(value) as score
FROM self_evaluation_factors
WHERE factor = 'stability'
AND created_at >= now() - interval '7 days';
```

---

**Status**: 🟢 Fully Operational
**Phase**: F07 (Time-Block Orchestrator)
**Last Built**: December 9, 2025

Start with: `npm run shadow:full`

