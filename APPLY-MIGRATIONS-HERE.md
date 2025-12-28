# ⚠️ APPLY THESE MIGRATIONS TO SUPABASE

## USE THIS FILE ONLY
👉 **`combined_phase2_migrations_WORKING.sql`** 👈

## Why Not the Other File?
- ❌ `combined_phase2_migrations.sql` - Missing prerequisite tables (BROKEN)
- ✅ `combined_phase2_migrations_WORKING.sql` - Includes all prerequisites (WORKS)

## Quick Apply (30 seconds)

### Step 1: Copy File Contents
```bash
# The file is ready at:
D:\Unite-Hub\combined_phase2_migrations_WORKING.sql
```

### Step 2: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Step 3: Paste & Run
1. Copy ENTIRE contents of `combined_phase2_migrations_WORKING.sql`
2. Paste into SQL Editor
3. Click **Run** button
4. Wait for "Success" message

### Step 4: Verify
Run this query to verify all tables created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'agent_%'
ORDER BY table_name;
```

**Expected**: 10 tables listed

---

## What's Included

**10 Tables**:
1. `agent_tasks` - Task queue (base table)
2. `agent_executions` - Execution history (base table)
3. `agent_execution_metrics` - Performance & cost tracking
4. `agent_health_status` - Real-time health monitoring
5. `agent_business_rules` - Workspace-scoped rules
6. `agent_rule_violations` - Violation audit trail
7. `agent_escalations` - Approval workflows
8. `escalation_config` - Escalation settings
9. `agent_verification_logs` - Output verification tracking
10. `agent_budgets` - Cost control & budget enforcement

**1 Materialized View**:
- `agent_kpis` - Aggregated metrics for dashboards

**15 Functions**:
- Health calculation
- Budget checking
- Violation aggregation
- Escalation routing
- Auto-resolution
- KPI refresh

---

## Troubleshooting

### Error: "relation workspaces does not exist"
✅ **Already Fixed**: Bootstrap migration should exist
Run this first:
```
supabase/migrations/20251214100000_bootstrap_workspaces_and_rls_helpers.sql
```

### Error: "permission denied"
Make sure you're using **service role key** in Supabase Dashboard, not anon key.

### Success!
You should see:
```
Success. No rows returned
```

---

## After Migration

1. ✅ Migrations applied
2. Run tests: `npm run test tests/agents` (should pass 136/136)
3. Build: `npm run build`
4. Deploy: `vercel deploy --prod`
5. Visit: `/agents` dashboard

---

**File**: `combined_phase2_migrations_WORKING.sql`
**Size**: ~1500 lines SQL
**Idempotent**: YES (safe to re-run)
