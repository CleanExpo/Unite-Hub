# Guardian I02 Deployment Execution Guide

**Purpose**: Step-by-step walkthrough to deploy I02 migration and verify all components work
**Date**: 2025-12-11
**Status**: Ready for deployment

---

## STEP 1: Pre-Deployment Verification

### Check Prerequisites

Run these SQL queries in your Supabase SQL Editor to verify prerequisites are met:

```sql
-- Check 1: Verify get_user_workspaces() function exists (from migration 020)
SELECT proname, prokind
FROM pg_proc
WHERE proname = 'get_user_workspaces'
LIMIT 1;

-- Expected: Shows function with prokind='f'
-- If empty: Apply migration 020 first, then I02
```

```sql
-- Check 2: Verify guardian_simulation_runs table exists (from I01)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'guardian_simulation_runs'
LIMIT 1;

-- Expected: Shows guardian_simulation_runs
-- If empty: Apply I01 migration first, then I02
```

### Record Current State

Before applying migration, note the current state:

```sql
-- Count existing Guardian tables (for comparison after)
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'guardian_%';

-- Record this number for verification later
```

---

## STEP 2: Apply I02 Migration to Supabase

### Option A: Supabase Dashboard (Recommended for dev/staging)

**Steps**:

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/4276_guardian_i02_simulation_pipeline.sql`
5. Paste into the SQL Editor
6. Click **Run**
7. Wait for completion (should see green checkmark)

**Expected Output**:
- Tables created: `guardian_simulation_events`, `guardian_simulation_pipeline_traces`
- Indexes created: 6 indexes total
- RLS policies enabled on both tables
- Comments added to tables and columns

### Option B: Supabase CLI (Recommended for production)

```bash
cd d:\Unite-Hub

# Option 1: Push to local Supabase instance
supabase db push --local

# Option 2: Push to remote Supabase instance
supabase db push --remote
```

**Expected**: Migration applies successfully, no errors

---

## STEP 3: Verify Migration Success

### Check Tables Created

Run in Supabase SQL Editor:

```sql
-- Verify both tables exist
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY table_name;

-- Expected output (2 rows):
-- guardian_simulation_events       | public
-- guardian_simulation_pipeline_traces | public
```

### Check RLS Policies Enabled

```sql
-- Verify RLS is enabled on both tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY tablename;

-- Expected output (both should have rowsecurity=TRUE):
-- guardian_simulation_events              | true
-- guardian_simulation_pipeline_traces     | true
```

### Check RLS Policies Attached

```sql
-- Verify policies are attached
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY tablename;

-- Expected output (2 rows):
-- guardian_simulation_events              | tenant_isolation_events
-- guardian_simulation_pipeline_traces     | tenant_isolation_traces
```

### Check Indexes Created

```sql
-- Verify indexes for performance
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY tablename;

-- Expected output (6 indexes):
-- idx_guardian_simulation_events_tenant_run_seq
-- idx_guardian_simulation_events_tenant_run_time
-- idx_guardian_simulation_events_rule
-- idx_guardian_simulation_pipeline_traces_tenant_run_phase
-- idx_guardian_simulation_pipeline_traces_tenant_run_time
-- idx_guardian_simulation_pipeline_traces_event
```

### Verify No Production Impact

```sql
-- Verify core Guardian tables unchanged
SELECT COUNT(*) as alert_count FROM guardian_alerts;
SELECT COUNT(*) as incident_count FROM guardian_incidents;
SELECT COUNT(*) as rule_count FROM guardian_rules;

-- All three should return their pre-deployment counts
-- (or 0 if database was empty before)
```

---

## STEP 4: Start Development Server

```bash
cd d:\Unite-Hub
npm run dev
```

**Expected**:
- Server starts on port 3008
- No TypeScript errors
- No database connection errors
- Console shows: `ready - started server on 0.0.0.0:3008`

---

## STEP 5: Test Simulation Studio UI

### Navigate to Dashboard

Open in browser: `http://localhost:3008/guardian/admin/simulation`

### Test Overview Tab

**Expected**:
- ✅ Page loads without 404 error
- ✅ "Guardian Simulation Studio" title visible
- ✅ 4 tabs visible: Overview, Runs, Pipeline, Traces
- ✅ Mock data displays:
  - Estimated Alerts: 2500
  - Estimated Incidents: 45
  - Correlation Groups: 12
  - Risk Adjustments: 8
- ✅ Pipeline execution summary visible with 6 metrics
- ✅ Timestamps show recent dates

### Test Simulation Runs Tab

**Steps**:
1. Click **Simulation Runs** tab
2. Verify list of runs displays

**Expected**:
- ✅ At least 1 mock run listed
- ✅ Run displays: scenario_id, status (completed), timestamp
- ✅ Can click run to select it
- ✅ Overview tab updates with selected run data

### Test Pipeline Timeline Tab

**Steps**:
1. Click **Pipeline Timeline** tab
2. Observe phase timeline displays
3. Click **Generate AI Summary** button

**Expected**:
- ✅ Timeline displays 5+ phases (rule_eval, alert_aggregate, correlation, incident, notification)
- ✅ Each phase shows:
  - Event count (500, 2500, 12, 45, 150)
  - Severity breakdown (critical, high, medium, low badges)
  - Time range
- ✅ "Generate AI Summary" button loads
- ✅ AI summary appears with markdown text, findings, risks, scenarios
- ✅ Or fallback summary if Claude API unavailable

### Test Traces Tab

**Steps**:
1. Click **Traces** tab
2. Observe detailed logs display
3. Click on a trace entry to expand details

**Expected**:
- ✅ Trace entries display with:
  - Phase name (rule_eval, alert_aggregate, etc.)
  - Step index
  - Message
  - Timestamp
- ✅ Can click "Details" to expand JSON
- ✅ JSON shows structured data (no PII)
- ✅ Max 50 entries per page
- ✅ List is scrollable

---

## STEP 6: Test API Routes

### Test Trace API

```bash
# Get detailed traces for a simulation run
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/trace?workspaceId=default&page=1&pageSize=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (HTTP 200):
```json
{
  "runId": "sim_run_001",
  "traces": [
    {
      "id": "...",
      "run_id": "sim_run_001",
      "phase": "rule_eval",
      "step_index": 0,
      "actor": "engine",
      "message": "Starting rule evaluation phase",
      "details": {...},
      "created_at": "2025-12-11T..."
    },
    // ... more traces
  ],
  "meta": {
    "total": 125,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

### Test Timeline API

```bash
# Get phase timeline aggregation
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/timeline?workspaceId=default" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (HTTP 200):
```json
{
  "timeline": [
    {
      "phase": "rule_eval",
      "count": 500,
      "severity_breakdown": {
        "critical": 20,
        "high": 80,
        "medium": 150,
        "low": 250
      },
      "first_occurred": "2025-12-11T...",
      "last_occurred": "2025-12-11T..."
    },
    // ... more phases
  ]
}
```

### Test Summary API

```bash
# Get AI-powered chaos analysis
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/summary?workspaceId=default" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (HTTP 200):
```json
{
  "summaryMarkdown": "# Simulation Analysis\n\nThis simulation...",
  "keyFindings": [
    "High event volume in rule_eval phase",
    "Efficient correlation clustering"
  ],
  "potentialRisks": [
    "⚠️ 20 critical events detected",
    "⚠️ 12 correlation clusters formed"
  ],
  "suggestedNextScenarios": [
    "Test correlation refinement",
    "Run incident routing under load"
  ]
}
```

**If Claude API unavailable**: Falls back to basic summary

---

## STEP 7: Verify Production Isolation

### Check No Production Tables Written

Run in Supabase SQL Editor:

```sql
-- Verify guardian_alerts table unchanged (or empty)
SELECT COUNT(*) as alert_count FROM guardian_alerts;

-- Verify guardian_incidents table unchanged (or empty)
SELECT COUNT(*) as incident_count FROM guardian_incidents;

-- Verify guardian_rules table unchanged (or empty)
SELECT COUNT(*) as rule_count FROM guardian_rules;

-- All should be same as pre-deployment or 0
-- If increased unexpectedly, I02 has a bug
```

### Check Simulation Tables Only Used

```sql
-- Verify simulation tables populated (if run actually executed)
SELECT COUNT(*) as simulation_events
FROM guardian_simulation_events;

SELECT COUNT(*) as simulation_traces
FROM guardian_simulation_pipeline_traces;

-- Both can be 0 (if no simulation ran) or > 0 (if simulation ran)
-- Key point: Only these tables should be written to
```

### Test RLS Isolation

```sql
-- Verify RLS blocks cross-tenant access (if multi-tenant setup)
-- Set session variable to different tenant_id
SET "user.workspace_id" = '00000000-0000-0000-0000-000000000001';

-- Query should return 0 rows (RLS blocks access)
SELECT COUNT(*) FROM guardian_simulation_events;

-- Reset session
RESET "user.workspace_id";
```

---

## STEP 8: Final Verification Checklist

- [ ] Migration applied without errors
- [ ] Both tables created (guardian_simulation_events, traces)
- [ ] RLS policies enabled and attached
- [ ] 6 indexes created for performance
- [ ] No production tables affected
- [ ] Development server starts without errors
- [ ] Simulation Studio UI loads at /guardian/admin/simulation
- [ ] All 4 tabs work (Overview, Runs, Pipeline, Traces)
- [ ] Mock data displays correctly
- [ ] "Generate AI Summary" button works (or has graceful fallback)
- [ ] Trace API returns correct format (HTTP 200)
- [ ] Timeline API returns aggregated data (HTTP 200)
- [ ] Summary API returns AI analysis or fallback (HTTP 200)
- [ ] No new entries in guardian_alerts, incidents, rules
- [ ] Simulation-only tables populated correctly
- [ ] RLS isolation verified (cross-tenant access blocked)

---

## STEP 9: Troubleshooting

### Migration fails: "function get_user_workspaces does not exist"

**Cause**: Migration 020 (which creates get_user_workspaces function) hasn't been applied

**Fix**:
```bash
# Apply migration 020 first
supabase db push --remote  # Use before I02

# Then apply I02
```

### Migration fails: "relation guardian_simulation_runs does not exist"

**Cause**: I01 migration (which creates guardian_simulation_runs) hasn't been applied

**Fix**:
```bash
# Apply I01 migration first, then I02
# Contact product team to ensure I01 deployment order
```

### Simulation Studio returns 404

**Cause**: Next.js cache not cleared or build needed

**Fix**:
```bash
rm -rf .next .turbo
npm run build
npm run dev
```

### API routes return 401 Unauthorized

**Cause**: Missing JWT token in Authorization header

**Fix**:
```bash
# Get valid JWT token from Supabase Auth
# Add to curl request:
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/[id]/trace?workspaceId=default" \
  -H "Authorization: Bearer YOUR_VALID_JWT_TOKEN"
```

### "Generate AI Summary" returns error

**Cause**: ANTHROPIC_API_KEY not set or Claude API rate limited

**Fix**:
```bash
# Verify ANTHROPIC_API_KEY in .env.local
echo $ANTHROPIC_API_KEY

# If empty, add to .env.local:
ANTHROPIC_API_KEY=sk-ant-...your-key-here

# Restart dev server:
npm run dev
```

---

## STEP 10: Sign-Off & Documentation

Once all checks pass, create deployment sign-off:

```markdown
# I02 Deployment Sign-Off

**Date**: [Deployment date]
**Environment**: [Staging/Production]
**Deployed By**: [Your name]

## Verification Results

- [x] Migration applied successfully
- [x] Tables created with RLS
- [x] UI fully functional
- [x] APIs responding correctly
- [x] Production isolation verified
- [x] No data loss
- [x] Performance acceptable

## Next Steps

1. Deploy I03 (Regression Pack Orchestrator)
2. Monitor database performance
3. Gather user feedback
```

---

## Timeline

**Total Deployment Time**: ~30-45 minutes

- Pre-checks: 5 min
- Apply migration: 5 min
- Verify tables: 5 min
- Start dev server: 2 min
- Test UI: 10 min
- Test APIs: 5 min
- Troubleshooting (if needed): 5-15 min
- Documentation: 5 min

---

**Ready to Deploy**: ✅ YES

All I02 components are production-ready. Follow this guide step-by-step for safe, verified deployment.
