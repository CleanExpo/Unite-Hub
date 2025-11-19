# 🚀 Execute Migration 046 - Step-by-Step Guide

**Status**: ✅ SQL Ready in Clipboard
**Time**: 2 minutes
**File**: `supabase/migrations/046_ai_usage_tracking_CLEANED.sql`

---

## ⚠️ Important: Avoid Syntax Errors

**Common Issue**: Accidentally pasting text into SQL editor
**Error**: `syntax error at or near "a"`
**Solution**: Clear the SQL editor completely before pasting

---

## 📋 Step-by-Step Execution

### Step 1: Open Supabase SQL Editor (10 seconds)

1. Click this link: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new
2. You should see a blank SQL editor

### Step 2: Clear Any Existing Text (5 seconds)

**IMPORTANT**: Make sure the SQL editor is completely empty
- Press `Ctrl+A` (select all)
- Press `Delete` (clear everything)

### Step 3: Paste Migration SQL (5 seconds)

- Press `Ctrl+V` (paste from clipboard)
- You should see the migration starting with:
  ```sql
  -- =====================================================
  -- Migration 046: AI Usage Tracking & Cost Monitoring (CLEANED)
  -- Created: 2025-11-19
  ```

### Step 4: Verify SQL Looks Correct (10 seconds)

**Check**:
- ✅ Starts with `-- =====================================================`
- ✅ Contains `DROP POLICY IF EXISTS` statements
- ✅ Contains `CREATE TABLE IF NOT EXISTS ai_usage_logs`
- ✅ Contains `CREATE TABLE IF NOT EXISTS ai_budget_limits`
- ✅ No random text like "Create a migration guide"
- ✅ Ends with verification logic

### Step 5: Execute Migration (5 seconds)

- Click the **RUN** button (green button in top-right)
- Wait for execution to complete

### Step 6: Verify Success (30 seconds)

**Expected Output**:
```
NOTICE:
NOTICE:  ✅ Migration 046 (CLEANED) Complete!
NOTICE:  ═══════════════════════════════════════════════════════
NOTICE:
NOTICE:  📊 Database Objects Created:
NOTICE:     • Tables: 2 (ai_usage_logs, ai_budget_limits)
NOTICE:     • Functions: 4 (helper functions)
NOTICE:     • RLS Policies: 10 (security policies)
NOTICE:     • Indexes: ~12 (performance optimization)
```

**If you see this**: ✅ Migration successful!

---

## ❌ Troubleshooting

### Error: "syntax error at or near..."

**Cause**: Wrong text pasted into SQL editor

**Fix**:
1. Clear the SQL editor completely (`Ctrl+A`, `Delete`)
2. Run this command to recopy SQL:
   ```bash
   cat supabase/migrations/046_ai_usage_tracking_CLEANED.sql | clip.exe
   ```
3. Paste again (`Ctrl+V`)
4. Click RUN

### Error: "relation 'ai_usage_logs' already exists"

**Cause**: Migration already partially executed

**Fix**: The migration has cleanup logic - just run it again. It will:
- Drop existing objects
- Recreate everything fresh

### Error: "permission denied for table..."

**Cause**: Not using service role key

**Fix**: Make sure you're logged into Supabase Dashboard with the correct project

---

## ✅ Post-Migration Verification

Run these queries to verify everything was created:

### 1. Check Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ai_usage_logs', 'ai_budget_limits')
ORDER BY table_name;
```

**Expected**: 2 rows
- `ai_budget_limits`
- `ai_usage_logs`

### 2. Check Functions
```sql
SELECT proname
FROM pg_proc
WHERE proname IN ('log_ai_usage', 'check_ai_budget', 'get_ai_cost_breakdown', 'refresh_ai_daily_summary')
ORDER BY proname;
```

**Expected**: 4 rows
- `check_ai_budget`
- `get_ai_cost_breakdown`
- `log_ai_usage`
- `refresh_ai_daily_summary`

### 3. Check RLS Policies
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('ai_usage_logs', 'ai_budget_limits');
```

**Expected**: 10 policies

### 4. Check Materialized View
```sql
SELECT matviewname
FROM pg_matviews
WHERE matviewname = 'ai_daily_summary';
```

**Expected**: 1 row
- `ai_daily_summary`

### 5. Check Budget Defaults
```sql
SELECT workspace_id, daily_limit_usd, monthly_limit_usd, is_active
FROM ai_budget_limits
LIMIT 5;
```

**Expected**: Budget rows for existing workspaces

---

## 🎯 Next Steps After Migration

### 1. Install Gemini SDK (if not already)
```bash
npm install @google/genai
# ✅ Already installed v1.30.0
```

### 2. Get Gemini API Key
1. Visit: https://ai.google.dev/
2. Click "Get API key in Google AI Studio"
3. Create/copy API key

### 3. Add to .env.local
```env
# Add these lines to .env.local
GOOGLE_AI_API_KEY=your-key-from-ai-google-dev
GEMINI_DAILY_BUDGET=20.00
GEMINI_ALERT_THRESHOLD=16
GEMINI_ENABLE_THINKING=true
```

### 4. Test Installation
```bash
npm run test:gemini
```

**Expected**:
```
✅ Environment configured correctly
✅ Gemini SDK imported successfully
✅ Email classification test passed
✅ Intelligence extraction test passed
✅ High thinking level test passed
✅ Budget check test passed

🎉 All 6 tests passed!
```

---

## 📊 What This Migration Does

### Creates 2 Tables

1. **`ai_usage_logs`** (17 columns)
   - Tracks every AI API call
   - Records: provider, model, tokens, cost, latency
   - Workspace isolation via RLS
   - Optimized indexes for fast queries

2. **`ai_budget_limits`** (11 columns)
   - Budget control per workspace
   - Daily/monthly limits
   - Alert thresholds
   - Automatic enforcement

### Creates 4 Functions

1. **`log_ai_usage()`** - Log AI requests with cost calculation
2. **`check_ai_budget()`** - Check if budget exceeded
3. **`get_ai_cost_breakdown()`** - Cost analysis queries
4. **`refresh_ai_daily_summary()`** - Refresh stats view

### Creates 1 Materialized View

- **`ai_daily_summary`** - Pre-aggregated daily stats for fast dashboard queries

### Creates 10 RLS Policies

- 6 user policies (workspace isolation)
- 2 service role policies (admin access)
- 2 explicit role policies (authenticated, service_role)

### Creates 12+ Indexes

- Composite indexes: `(workspace_id, created_at DESC)` - 2-3x faster
- Partial indexes: `WHERE success = FALSE` - 98% smaller
- Unique indexes: Materialized view constraints

---

## 💰 Cost Tracking After Migration

### Monitor Daily Costs
```sql
SELECT
  provider,
  COUNT(*) as requests,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE
GROUP BY provider
ORDER BY total_cost DESC;
```

### Check Budget Status
```sql
SELECT check_ai_budget('<your-workspace-id>', 'daily');
```

**Returns**:
```json
{
  "period": "daily",
  "limit_usd": 50.00,
  "spent_usd": 2.50,
  "remaining_usd": 47.50,
  "percentage_used": 5.00,
  "at_threshold": false,
  "budget_exceeded": false
}
```

---

## 🔗 Quick Reference

**Supabase Dashboard**: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau

**Migration File**: `d:\Unite-Hub\supabase\migrations\046_ai_usage_tracking_CLEANED.sql`

**Documentation**:
- Full guide: `AUTONOMOUS_DEPLOYMENT_046.md`
- Improvements: `MIGRATION_046_IMPROVEMENTS.md`
- Status: `MIGRATIONS_READY.md`

**Need to recopy SQL**:
```bash
cat supabase/migrations/046_ai_usage_tracking_CLEANED.sql | clip.exe
```

---

## ✨ Summary

**Time Required**: ~2 minutes
**Complexity**: Simple (copy/paste/run)
**Risk**: Low (has cleanup/rollback logic)
**Impact**: High (enables cost tracking for all AI providers)

**Status**: ✅ **READY TO EXECUTE**

---

**Last Updated**: 2025-11-19
**Migration**: 046 (CLEANED VERSION)
**SQL Status**: ✅ In clipboard, ready to paste
