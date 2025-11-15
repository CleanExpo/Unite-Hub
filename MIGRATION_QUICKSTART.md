# 🚀 Migration Quickstart Guide

## Problem: "Table 'public.user_onboarding' not found"

This means the database migration hasn't been applied to your Supabase project yet.

---

## ⚡ 5-Minute Fix

### Step 1: Open Supabase Dashboard
Go to: **https://supabase.com/dashboard/project/lksfwktwtmyznckodsau**

### Step 2: Open SQL Editor
Click: **SQL Editor** in the left sidebar

### Step 3: Run Migration
1. Click: **New Query**
2. Open file: **`scripts/apply-onboarding-migration.sql`**
3. Copy and paste the entire contents
4. Click: **Run** (or press `Ctrl+Enter`)

### Step 4: Verify Success
You should see:
```
✅ user_onboarding table created successfully
✅ VERIFICATION PASSED
```

### Step 5: Confirm in Dashboard
1. Click: **Table Editor** (left sidebar)
2. Find: `user_onboarding` table
3. ✅ Done!

---

## 🧪 Optional: Run Verification

After applying the migration, you can verify everything is correct:

1. In SQL Editor, click: **New Query**
2. Open file: **`scripts/verify-onboarding-migration.sql`**
3. Copy and paste contents
4. Click: **Run**

You should see:
```
✅ CHECK 1/5: Table exists
✅ CHECK 2/5: All 13 columns exist
✅ CHECK 3/5: All 2 indexes exist
✅ CHECK 4/5: All 3 RLS policies exist
✅ CHECK 5/5: Trigger exists
✅ ALL CRITICAL CHECKS PASSED
```

---

## 📚 More Details

For comprehensive migration documentation, see:
- **`docs/APPLY_MIGRATIONS.md`** - Full migration guide
- **`supabase/migrations/007_user_onboarding.sql`** - Original migration file

---

## 🆘 Troubleshooting

**Issue:** "permission denied"
- **Fix:** Make sure you're logged in as project owner in Supabase dashboard

**Issue:** "table already exists"
- **Fix:** This is fine! The script is safe to run multiple times

**Issue:** Still getting errors in app
- **Fix:** Hard refresh your browser (`Ctrl+Shift+R`) and restart dev server

---

**Estimated Time:** 5 minutes
**Difficulty:** Easy
**Risk:** Low (script is idempotent and safe)
