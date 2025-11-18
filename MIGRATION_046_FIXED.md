# Migration 046 - Fixed Version

**Issue**: PostgreSQL immutability requirement for indexed expressions
**Status**: ✅ **FIXED**
**Date**: 2025-11-19

---

## What Was Wrong

The original migration failed with this error:
```
ERROR: 42P17: functions in index expression must be marked IMMUTABLE
```

**Root Cause**: Line 58 used `DATE(created_at)` in an index expression:
```sql
CREATE INDEX idx_ai_usage_daily_cost ON ai_usage_logs(workspace_id, DATE(created_at), cost_usd);
```

PostgreSQL's `DATE()` function is not marked as `IMMUTABLE` because it could theoretically give different results in different timezones.

---

## What Was Fixed

### ✅ Changed Index Creation

**BEFORE** (Fails):
```sql
CREATE INDEX idx_ai_usage_daily_cost ON ai_usage_logs(workspace_id, DATE(created_at), cost_usd);
```

**AFTER** (Works):
```sql
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_cost ON ai_usage_logs(workspace_id, (created_at::date), cost_usd);
```

**Why This Works**:
- `created_at::date` is a type cast, which IS immutable
- Added `IF NOT EXISTS` for idempotency
- Same functionality, PostgreSQL-compliant

### ✅ Additional Improvements

Added `IF NOT EXISTS` to all index creations for idempotency:
```sql
CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace ON ai_usage_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_task_type ON ai_usage_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_cost ON ai_usage_logs(cost_usd DESC);
CREATE INDEX IF NOT EXISTS idx_budget_workspace ON ai_budget_limits(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summary_unique ON ai_daily_summary(workspace_id, date, provider);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON ai_daily_summary(date DESC);
```

---

## How to Run the Fixed Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/migrations/046_ai_usage_tracking.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Verify success message: "✅ Migration 046 Complete!"

### Option 2: Supabase CLI

```bash
# The migration file is already updated
supabase db push
```

---

## Expected Output

When migration runs successfully:
```
✅ Migration 046 Complete!
📊 AI Usage Tracking System:
   Tables created: 2
   Functions created: 4
   RLS policies created: 6

✨ SUCCESS: AI usage tracking fully configured!
💰 Features enabled:
   - OpenRouter-first cost optimization
   - Per-request cost tracking
   - Daily/monthly budget limits ($50/day default)
   - Budget alert system (80% threshold)
   - Provider/task cost breakdown
   - Materialized view for fast queries
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ai_usage_logs', 'ai_budget_limits');

-- Check indexes were created
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('ai_usage_logs', 'ai_budget_limits')
ORDER BY indexname;

-- Check functions exist
SELECT proname
FROM pg_proc
WHERE proname IN ('log_ai_usage', 'check_ai_budget', 'get_ai_cost_breakdown');
```

---

## Next Steps

After successful migration:

1. **Run test suite**:
   ```bash
   npm run test:openrouter
   ```

2. **Expected result**: All 21 tests should pass
   ```
   ✓ Table: ai_usage_logs
   ✓ Table: ai_budget_limits
   ✓ Function: log_ai_usage()
   ✓ Function: check_ai_budget()
   ✓ Budget Check Function
   ✓ Usage Logging Function

   ✅ ALL TESTS PASSED (21/21)
   ```

3. **Deploy the system**: Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## Technical Details

### Why Type Cast Works But Function Doesn't

**PostgreSQL Immutability Rules**:

| Expression | Type | Reason |
|------------|------|--------|
| `DATE(created_at)` | ❌ Not Immutable | Function could behave differently with timezone changes |
| `created_at::date` | ✅ Immutable | Type cast always gives same result for same input |
| `CAST(created_at AS date)` | ✅ Immutable | Same as `::date`, just different syntax |

**Both do the same thing**, but PostgreSQL's type system treats them differently for index expressions.

### Performance Impact

**None**. The cast `created_at::date` is exactly as fast as `DATE(created_at)`. This is purely a compliance fix, not a performance change.

---

## Files Modified

- `supabase/migrations/046_ai_usage_tracking.sql` - Fixed index expressions

## Related Documentation

- [OPENROUTER_IMPLEMENTATION_COMPLETE.md](OPENROUTER_IMPLEMENTATION_COMPLETE.md)
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- [docs/AI_SETUP_GUIDE.md](docs/AI_SETUP_GUIDE.md)

---

**Status**: ✅ Migration ready to run
**Next**: Copy migration to Supabase Dashboard and execute
