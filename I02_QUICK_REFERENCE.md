# Guardian I02 Quick Reference Card

**Use this card during live deployment for quick lookups**

---

## Pre-Flight (Run First)

```sql
-- CHECK: Prerequisites
SELECT
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_user_workspaces') > 0 as ok1,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'guardian_simulation_runs') > 0 as ok2;
```
✅ Both must be TRUE to proceed.

---

## Apply Migration

**File**: `supabase/migrations/4276_guardian_i02_simulation_pipeline.sql`

**Steps**:
1. Copy entire file content
2. Supabase Dashboard → SQL Editor → New query
3. Paste content → Click RUN
4. Wait for green checkmark ✅

---

## Verify Success

### Tables Exist
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces');
```
✅ Result should be: 2

### RLS Enabled
```sql
SELECT COUNT(*) FROM pg_tables
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces')
AND rowsecurity = true;
```
✅ Result should be: 2

### Indexes Created
```sql
SELECT COUNT(*) FROM pg_indexes
WHERE tablename IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces');
```
✅ Result should be: 6

### Production Tables Untouched
```sql
SELECT COUNT(*) FROM guardian_rules;
SELECT COUNT(*) FROM guardian_alerts;
SELECT COUNT(*) FROM guardian_incidents;
```
✅ All counts should be unchanged from before migration

---

## Start Dev Server

```bash
cd /d/Unite-Hub
npm run dev
```

✅ Watch for: `✓ Ready in X seconds`

---

## Test UI

**URL**: http://localhost:3008/guardian/admin/simulation

**Tabs to test**:
- [ ] Overview (impact estimates)
- [ ] Runs (simulation history)
- [ ] Pipeline (phase timeline + AI summary)
- [ ] Traces (execution logs)

---

## Test APIs

### Trace API
```bash
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/trace?workspaceId=kh72b1cng9h88691sx4x7krt2h7v7deh&page=1&pageSize=50" \
  -H "Authorization: Bearer YOUR_JWT"
```

### Timeline API
```bash
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/timeline?workspaceId=kh72b1cng9h88691sx4x7krt2h7v7deh" \
  -H "Authorization: Bearer YOUR_JWT"
```

### Summary API (AI)
```bash
curl -X GET \
  "http://localhost:3008/api/guardian/admin/simulation/runs/sim_run_001/summary?workspaceId=kh72b1cng9h88691sx4x7krt2h7v7deh" \
  -H "Authorization: Bearer YOUR_JWT"
```

✅ All should return HTTP 200

---

## Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| "get_user_workspaces not found" | Migration 020 applied? | Apply migration 020 first |
| "guardian_simulation_runs not exist" | I01 migration applied? | Apply I01 migration first |
| Page returns 404 | Route file exists? | `rm -rf .next` → `npm run dev` |
| API returns 401 | JWT token valid? | Use current session token in header |
| "Generate AI Summary" fails | ANTHROPIC_API_KEY set? | Check `.env.local` has key |
| Port 3008 in use | Kill process? | `netstat -ano \| findstr :3008` → `taskkill /PID <ID> /F` |

---

## Success Checklist

- [ ] Migration applied without errors
- [ ] Tables exist (2 simulation tables)
- [ ] RLS enabled (2 tables with rowsecurity=true)
- [ ] Indexes created (6 total)
- [ ] Production tables untouched
- [ ] Dev server starts without errors
- [ ] UI loads at /guardian/admin/simulation
- [ ] All 4 tabs functional
- [ ] APIs respond with HTTP 200
- [ ] No console errors

---

## Next Steps

✅ **Deployment complete?**
→ I03 (Regression Pack Orchestrator) ready to implement
→ I04 (Auto-Remediation Playbook) ready to implement

❌ **Issues during deployment?**
→ See troubleshooting section in `I02_LIVE_DEPLOYMENT_STEPS.md`

---

**Key Workspace ID**: `kh72b1cng9h88691sx4x7krt2h7v7deh`
**Dev Server Port**: 3008
**Estimated Time**: 45-60 minutes
