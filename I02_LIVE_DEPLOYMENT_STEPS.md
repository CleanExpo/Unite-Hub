# Guardian I02 Live Deployment Steps

**Status**: Ready for live execution
**Date**: 2025-12-11
**Environment**: Local Development with Supabase Cloud
**Time Estimate**: 45-60 minutes

---

## Phase 1: Pre-Flight Checks (5 min)

### 1.1 Open Supabase Console
1. Navigate to: https://app.supabase.com
2. Select project: `lksfwktwtmyznckodsau` (Unite-Hub project)
3. Click **SQL Editor** in left sidebar

### 1.2 Run Pre-Deployment Checks
Copy this script into SQL Editor and **RUN**:

```sql
-- Quick prerequisite check
SELECT
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_user_workspaces') > 0 as has_get_user_workspaces,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'guardian_simulation_runs') > 0 as has_simulation_runs,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'guardian_rules') > 0 as has_guardian_rules;
```

**Expected Result**:
```
has_get_user_workspaces | has_simulation_runs | has_guardian_rules
true                    | true                | true
```

**If any FALSE**:
- FALSE on `has_get_user_workspaces`: Apply migration 020 first
- FALSE on `has_simulation_runs`: Apply I01 migration first
- FALSE on `has_guardian_rules`: Core Guardian not set up; cannot proceed

---

## Phase 2: Apply I02 Migration (10 min)

### 2.1 Copy Migration Content
1. Open file: `supabase/migrations/4276_guardian_i02_simulation_pipeline.sql`
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)

### 2.2 Apply to Supabase
1. In SQL Editor, click **New query**
2. Paste migration content (Ctrl+V)
3. Click **RUN** button
4. **Wait for green checkmark** (should complete in 5-10 seconds)

**Expected Output**:
```
Query executed successfully in X seconds
```

**If ERROR appears**:
See **Troubleshooting** section at end of this document

---

## Phase 3: Verify Migration Success (5 min)

### 3.1 Verify Tables Created
Run in SQL Editor:

```sql
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY table_name;
```

**Expected**:
```
table_name                           | table_schema
guardian_simulation_events           | public
guardian_simulation_pipeline_traces | public
```

### 3.2 Verify RLS Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY tablename;
```

**Expected**:
```
tablename                           | rowsecurity
guardian_simulation_events          | true
guardian_simulation_pipeline_traces | true
```

### 3.3 Verify RLS Policies Attached
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY tablename;
```

**Expected**:
```
tablename                           | policyname
guardian_simulation_events          | tenant_isolation_events
guardian_simulation_pipeline_traces | tenant_isolation_traces
```

### 3.4 Verify Indexes Created
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
ORDER BY tablename, indexname;
```

**Expected** (6 indexes total):
```
indexname                                              | tablename
idx_guardian_simulation_events_rule                  | guardian_simulation_events
idx_guardian_simulation_events_tenant_run_seq        | guardian_simulation_events
idx_guardian_simulation_events_tenant_run_time       | guardian_simulation_events
idx_guardian_simulation_pipeline_traces_event        | guardian_simulation_pipeline_traces
idx_guardian_simulation_pipeline_traces_tenant_run_phase | guardian_simulation_pipeline_traces
idx_guardian_simulation_pipeline_traces_tenant_run_time  | guardian_simulation_pipeline_traces
```

---

## Phase 4: Verify Production Isolation (5 min)

**Critical**: Ensure I02 didn't write to production tables

### 4.1 Check Core Guardian Tables Unchanged
```sql
SELECT
  'guardian_rules' as table_name,
  COUNT(*) as row_count
FROM guardian_rules
UNION ALL
SELECT 'guardian_alerts', COUNT(*) FROM guardian_alerts
UNION ALL
SELECT 'guardian_incidents', COUNT(*) FROM guardian_incidents
UNION ALL
SELECT 'guardian_correlations', COUNT(*) FROM guardian_correlations;
```

**Expected**: All row counts same as before migration (or 0 if empty)
**If increased**: Migration has a bug. Contact support immediately.

### 4.2 Check Simulation Tables Empty (until we run a simulation)
```sql
SELECT
  'guardian_simulation_events' as table_name,
  COUNT(*) as row_count
FROM guardian_simulation_events
UNION ALL
SELECT 'guardian_simulation_pipeline_traces', COUNT(*)
FROM guardian_simulation_pipeline_traces;
```

**Expected**:
```
table_name                              | row_count
guardian_simulation_events              | 0
guardian_simulation_pipeline_traces     | 0
```

This is correct - tables are empty until we run a simulation.

---

## Phase 5: Start Development Server (5 min)

### 5.1 Open Terminal
```bash
cd /d/Unite-Hub
npm run dev
```

**Expected Output**:
```
> next dev

  ▲ Next.js 16.x.x
  - Local:        http://localhost:3008
  - Environments: .env.local

✓ Ready in 2.5s
```

Wait for **"Ready"** message and green checkmark.

**If ERROR**:
- `Port 3008 in use`: Kill existing process: `lsof -ti :3008 | xargs kill -9` (Mac/Linux) or `netstat -ano | findstr :3008` (Windows)
- TypeScript error: Run `npm run typecheck` to identify issue
- Module not found: Run `npm install` to ensure dependencies

---

## Phase 6: Test Simulation Studio UI (15 min)

### 6.1 Open Browser
Navigate to: **http://localhost:3008/guardian/admin/simulation**

**Expected**: Page loads without 404 error

### 6.2 Test Overview Tab
Verify these elements visible:
- [ ] "Guardian Simulation Studio" title
- [ ] 4 tabs: Overview, Runs, Pipeline, Traces
- [ ] Impact estimate metrics (mock data):
  - Estimated Alerts: 2500
  - Estimated Incidents: 45
  - Correlation Groups: 12
  - Risk Adjustments: 8
- [ ] Pipeline execution summary with 6 metrics
- [ ] Timestamps show recent dates

### 6.3 Test Simulation Runs Tab
1. Click **Simulation Runs** tab
2. Verify:
  - [ ] At least 1 mock run listed
  - [ ] Run displays: scenario_id, status (completed), timestamp
  - [ ] Can click run row to select

### 6.4 Test Pipeline Timeline Tab
1. Click **Pipeline Timeline** tab
2. Verify:
  - [ ] Timeline displays 5+ phases (rule_eval, alert_aggregate, correlation, incident, notification)
  - [ ] Each phase shows:
    - Event count (500, 2500, 12, 45, 150)
    - Severity breakdown badges (critical, high, medium, low)
    - Time range
3. Click **Generate AI Summary** button
4. Verify:
  - [ ] Button loads (shows spinner)
  - [ ] AI summary appears with markdown text
  - [ ] Shows findings, risks, suggested scenarios
  - [ ] Or graceful fallback if Claude API unavailable

### 6.5 Test Traces Tab
1. Click **Traces** tab
2. Verify:
  - [ ] Trace entries display with phase, step, message, timestamp
  - [ ] Can click "Details" to expand JSON
  - [ ] Scrollable list (max 50 entries per page)
  - [ ] No console errors in DevTools

---

## Phase 7: Test API Routes (10 min)

### 7.1 Get Valid JWT Token
You need an Authorization token. Options:
- **Option A**: Use existing session token from browser (DevTools → Application → Cookies → `sb_*`)
- **Option B**: Create test token via Supabase dashboard

For testing, use your current authenticated session token.

### 7.2 Test Trace API
```bash
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/trace?workspaceId=kh72b1cng9h88691sx4x7krt2h7v7deh&page=1&pageSize=50" \
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
      "message": "Starting rule evaluation phase",
      "created_at": "2025-12-11T...",
      "details": {}
    }
  ],
  "meta": {
    "total": 125,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

### 7.3 Test Timeline API
```bash
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/timeline?workspaceId=kh72b1cng9h88691sx4x7krt2h7v7deh" \
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
    }
  ]
}
```

### 7.4 Test Summary API
```bash
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/summary?workspaceId=kh72b1cng9h88691sx4x7krt2h7v7deh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (HTTP 200):
```json
{
  "summaryMarkdown": "# Simulation Analysis\n\n...",
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

**If API returns 401 Unauthorized**:
- Check JWT token is valid and included in Authorization header
- Verify header format: `Bearer YOUR_TOKEN` (space between Bearer and token)

---

## Phase 8: Final Sign-Off Checklist

- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Migration file exists and has correct syntax
- [ ] Tables created (guardian_simulation_events, traces)
- [ ] RLS policies enabled and attached
- [ ] 6 indexes created
- [ ] No production tables affected
- [ ] Dev server starts without errors
- [ ] Simulation Studio loads at /guardian/admin/simulation
- [ ] All 4 tabs work (Overview, Runs, Pipeline, Traces)
- [ ] Mock data displays correctly
- [ ] "Generate AI Summary" button works or has fallback
- [ ] Trace API returns HTTP 200 with correct format
- [ ] Timeline API returns HTTP 200 with aggregated data
- [ ] Summary API returns HTTP 200 with AI analysis
- [ ] No new entries in guardian_alerts, incidents, rules
- [ ] Simulation tables remain empty (no test runs yet)
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## Troubleshooting

### Migration Fails: "function get_user_workspaces does not exist"
**Cause**: Migration 020 hasn't been applied

**Fix**:
1. In Supabase SQL Editor, find migration 020 content
2. Apply migration 020 first
3. Then apply I02 migration 4276

**Verify**:
```sql
SELECT proname FROM pg_proc WHERE proname = 'get_user_workspaces';
```
Should return `get_user_workspaces`

### Migration Fails: "relation guardian_simulation_runs does not exist"
**Cause**: I01 migration hasn't been applied

**Fix**:
1. Apply I01 migration first (creates guardian_simulation_runs table)
2. Then apply I02 migration 4276

**Verify**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'guardian_simulation_runs';
```
Should return `guardian_simulation_runs`

### Simulation Studio Returns 404
**Cause**: Next.js cache not cleared or route file missing

**Fix**:
```bash
cd /d/Unite-Hub
rm -rf .next .turbo
npm run build
npm run dev
```

### API Routes Return 401 Unauthorized
**Cause**: Missing or invalid JWT token

**Fix**:
1. Ensure Authorization header includes valid token
2. Format: `Authorization: Bearer YOUR_VALID_JWT_TOKEN`
3. Test with curl: Include `-H "Authorization: Bearer $TOKEN"`

### "Generate AI Summary" Returns Error
**Cause**: ANTHROPIC_API_KEY not set or Claude API rate limited

**Fix**:
```bash
# Verify ANTHROPIC_API_KEY set
echo $ANTHROPIC_API_KEY

# Should show: sk-ant-... (not empty)

# If empty, check .env.local has ANTHROPIC_API_KEY set

# Restart dev server
npm run dev
```

### "Cannot find module" or Build Errors
**Cause**: Dependencies not installed

**Fix**:
```bash
npm install
npm run dev
```

### Port 3008 Already in Use
**Cause**: Another process using port

**Fix (Windows)**:
```bash
netstat -ano | findstr :3008
taskkill /PID <PID_NUMBER> /F
```

**Fix (Mac/Linux)**:
```bash
lsof -ti :3008 | xargs kill -9
```

---

## Success Indicators

When deployment is complete, you should see:

✅ **Database**: 2 new tables with RLS and 6 indexes
✅ **TypeScript**: No type errors
✅ **Build**: Next.js production build passes
✅ **Dev Server**: Starts on port 3008 without errors
✅ **UI**: Simulation Studio loads with 4 tabs
✅ **APIs**: All 3 routes respond with correct format
✅ **Isolation**: Production tables untouched
✅ **Tests**: 226 tests still passing

---

## Next Steps After Deployment

1. **If deployment successful**: ✅ I02 is live and ready
   - Guardian I03 (Regression Pack Orchestrator) can start
   - Guardian I04 (Auto-Remediation Playbook) can start
   - Both can run in parallel if needed

2. **If deployment has issues**: Contact support with:
   - Error message from SQL Editor
   - Screenshot of error
   - Relevant curl command output

---

**Estimated Total Time**: 45-60 minutes
**Current Phase**: Awaiting user execution

Good luck! 🚀
