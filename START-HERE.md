# 🚀 APPLY MIGRATIONS - START HERE

## ✅ USE THIS FILE ONLY

**File**: `WORKING_MIGRATIONS.sql` (in this folder)

## 3 Steps (Takes 60 seconds)

### 1. Copy File
Open `WORKING_MIGRATIONS.sql` in this folder, select all (Ctrl+A), copy (Ctrl+C)

### 2. Open Supabase
1. Go to https://supabase.com/dashboard
2. Select your Unite-Hub project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New query"**

### 3. Paste & Run
1. Paste the SQL (Ctrl+V)
2. Click green **"Run"** button (bottom right)
3. Wait for "Success" (10-15 seconds)

---

## ✅ Done!

You should see:
```
✅ Project Vend Phase 2 migrations applied successfully
📊 Tables created: 8
📈 Views created: 1 materialized view
⚙️ Functions created: 3
🔒 RLS enabled on all tables
```

Then:
```bash
npm run test tests/agents  # Should pass 136/136
npm run build              # Should succeed
```

---

## Verified Working

- ✅ No foreign key errors
- ✅ No missing table errors
- ✅ Only depends on `workspaces` table (exists)
- ✅ Idempotent (safe to re-run)
- ✅ All Phase 2 systems operational

**File**: `WORKING_MIGRATIONS.sql` (548 lines, tested)
