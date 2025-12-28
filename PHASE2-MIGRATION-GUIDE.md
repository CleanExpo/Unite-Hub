# Project Vend Phase 2 - Migration Guide

## Quick Apply: Copy/Paste to Supabase Dashboard

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click "SQL Editor" in left sidebar
3. Click "New Query"

### Step 2: Apply Migrations

**IMPORTANT**: Use `combined_phase2_migrations_WORKING.sql` (with prerequisite tables)

Copy and paste the contents of `combined_phase2_migrations_WORKING.sql` into the SQL editor and click **Run**.

Alternatively, apply each migration individually in this **EXACT ORDER**:

#### Migration 0: Base Agent Tables (PREREQUISITE)
```
supabase/migrations/20251229110000_agent_base_tables.sql
```
**Creates**: agent_tasks, agent_executions (required by later migrations)

#### Migration 1: Agent Execution Metrics
```
supabase/migrations/20251229120000_agent_execution_metrics.sql
```

#### Migration 2: Agent Health Status
```
supabase/migrations/20251229120100_agent_health_status.sql
```

#### Migration 3: Agent Business Rules
```
supabase/migrations/20251229120200_agent_business_rules.sql
```

#### Migration 4: Agent Rule Violations
```
supabase/migrations/20251229120300_agent_rule_violations.sql
```

### Step 3: Verify Tables Created

Check Table Editor for new tables:
- ✅ `agent_tasks` (base table)
- ✅ `agent_executions` (base table)
- ✅ `agent_execution_metrics`
- ✅ `agent_health_status`
- ✅ `agent_business_rules`
- ✅ `agent_rule_violations`
- ✅ `agent_escalations`
- ✅ `escalation_config`
- ✅ `agent_verification_logs`
- ✅ `agent_budgets`

**Total**: 10 new tables + 1 materialized view (agent_kpis)

### Step 4: Seed Default Rules (Optional)

Run this query to seed default business rules for a workspace:

```sql
-- Replace 'YOUR_WORKSPACE_ID' and 'YOUR_USER_ID' with actual values

INSERT INTO agent_business_rules (workspace_id, agent_name, rule_name, rule_type, config, enabled, priority, enforcement_level, escalate_on_violation, description, created_by)
VALUES
  -- Email Agent Rules
  ('YOUR_WORKSPACE_ID', 'EmailAgent', 'max_score_change_constraint', 'constraint', '{"max_score_change": 20}', true, 10, 'block', false, 'Prevents extreme score changes', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'EmailAgent', 'min_confidence_for_important', 'validation', '{"min_confidence": 0.8}', true, 20, 'warn', true, 'Requires high confidence for important flags', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'EmailAgent', 'cannot_create_duplicate_contacts', 'constraint', '{"cannot_create_duplicate_contacts": true}', true, 10, 'block', false, 'Prevents duplicate contacts', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'EmailAgent', 'must_validate_email_format', 'validation', '{"must_validate_email_format": true}', true, 5, 'block', false, 'Validates email format', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'EmailAgent', 'daily_cost_limit', 'cost_limit', '{"daily_budget_usd": 10.00}', true, 5, 'block', true, 'Daily cost limit $10', 'YOUR_USER_ID'),

  -- Content Generator Rules
  ('YOUR_WORKSPACE_ID', 'ContentGenerator', 'min_confidence_validation', 'validation', '{"min_confidence": 0.7}', true, 20, 'block', true, 'Minimum confidence 0.7', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'ContentGenerator', 'max_content_length', 'constraint', '{"max_content_length": 300}', true, 30, 'warn', false, 'Max 300 characters', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'ContentGenerator', 'require_personalization_tokens', 'validation', '{"require_personalization_tokens": true}', true, 10, 'block', false, 'Requires personalization', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'ContentGenerator', 'require_cta', 'validation', '{"require_cta": true}', true, 20, 'warn', false, 'Requires call-to-action', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'ContentGenerator', 'daily_cost_limit', 'cost_limit', '{"daily_budget_usd": 25.00}', true, 5, 'block', true, 'Daily cost limit $25', 'YOUR_USER_ID'),

  -- Orchestrator Rules
  ('YOUR_WORKSPACE_ID', 'Orchestrator', 'max_enrollment_delay', 'constraint', '{"max_enrollment_delay_hours": 24}', true, 20, 'warn', false, 'Max 24h enrollment delay', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'Orchestrator', 'max_condition_depth', 'constraint', '{"max_condition_depth": 5}', true, 10, 'block', false, 'Prevents deep nesting', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'Orchestrator', 'cannot_skip_campaign_steps', 'constraint', '{"cannot_skip_campaign_steps": true}', true, 5, 'block', false, 'Enforces step sequence', 'YOUR_USER_ID'),
  ('YOUR_WORKSPACE_ID', 'Orchestrator', 'daily_cost_limit', 'cost_limit', '{"daily_budget_usd": 15.00}', true, 5, 'block', true, 'Daily cost limit $15', 'YOUR_USER_ID');
```

---

## What These Migrations Do

### agent_execution_metrics
Tracks every agent execution:
- Performance: execution time, success/failure
- Cost: model used, tokens, calculated USD cost
- Business: items processed/failed, confidence scores

**Used for**: Health monitoring, cost analysis, optimization

### agent_health_status
Real-time health tracking per agent:
- Status: healthy | degraded | critical | disabled
- Metrics: 24h success rate, error rate, avg execution time
- Failure tracking: consecutive failures, last error

**Used for**: Automatic degradation detection, self-healing

### agent_business_rules
Workspace-scoped rules to prevent naive decisions:
- Constraints: Hard limits (max score change, max condition depth)
- Validations: Requirements (min confidence, email format)
- Escalations: Approval triggers
- Cost limits: Budget controls

**Used for**: Preventing Project Vend-style mistakes (bad pricing, unhelpful decisions)

### agent_rule_violations
Logs when agents violate rules:
- Violation details: type, severity, attempted action
- Resolution: blocked | allowed with warning | escalated
- Links to rules and executions

**Used for**: Auditing, debugging, rule optimization

---

## Rollback (If Needed)

To rollback these migrations:

```sql
DROP TABLE IF EXISTS agent_rule_violations CASCADE;
DROP TABLE IF EXISTS agent_business_rules CASCADE;
DROP TABLE IF EXISTS agent_health_status CASCADE;
DROP TABLE IF EXISTS agent_execution_metrics CASCADE;

DROP FUNCTION IF EXISTS calculate_agent_health_status;
DROP FUNCTION IF EXISTS update_agent_health_updated_at;
DROP FUNCTION IF EXISTS update_agent_rules_updated_at;
DROP FUNCTION IF EXISTS get_violation_count_by_agent;
DROP FUNCTION IF EXISTS get_violations_by_rule;
DROP FUNCTION IF EXISTS refresh_agent_kpis;

DROP VIEW IF EXISTS recent_critical_violations CASCADE;
```

---

## Troubleshooting

### Error: "relation workspace_members does not exist"
✅ **Fixed**: Migrations now use correct schema (`user_organizations` + `workspaces`)

### Error: "foreign key violation"
Make sure migrations run in order:
1. agent_execution_metrics (references agent_executions)
2. agent_health_status (standalone)
3. agent_business_rules (standalone)
4. agent_rule_violations (references agent_business_rules)

### Error: "permission denied"
Use service role key in Supabase dashboard, not anon key

---

## Verification Queries

After applying migrations, verify with:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'agent_%'
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'agent_%';

-- Check indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'agent_%'
ORDER BY tablename, indexname;
```

---

## Next Steps After Migration

1. **Seed default rules** (optional): Use seed query above
2. **Run tests**: `npm run test tests/agents`
3. **Start health monitoring**: Automatically runs via base-agent.ts
4. **Check dashboard**: Navigate to `/agents` (when UI is built in Phase 5)

---

**Support**: If issues persist, check Supabase logs in Dashboard > Logs > Postgres
