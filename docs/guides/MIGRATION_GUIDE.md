# Supabase Migration Guide

Your Supabase database is configured but needs the tables created.

## Current Status

✅ **Supabase credentials configured**

- Frontend: `apps/web/.env.local`
- Backend: `apps/backend/.env.local`
- Connection tested and validated

✅ **Migration files ready**

- Schema: `supabase/migrations/20260106000001_create_contractors_schema.sql`
- Security: `supabase/migrations/20260106000002_add_rls_policies.sql`
- Sample data: `supabase/migrations/20260106000003_seed_sample_data.sql`
- Combined: `SETUP_SUPABASE.sql` (all 3 migrations in one file)

⏳ **Pending: Run migrations**

---

## Run Migrations (Choose ONE method)

### Method 1: Supabase SQL Editor (Recommended - 2 minutes)

**Best for:** Quick setup, no CLI installation needed

1. Open SQL Editor:

   ```
   https://supabase.com/dashboard/project/ywxwcrmyfovqnquglynh/sql/new
   ```

2. Open `SETUP_SUPABASE.sql` in your editor

3. Copy the ENTIRE file contents (291 lines)

4. Paste into Supabase SQL Editor

5. Click **"Run"** button

6. Expected result: "Success. No rows returned"

7. Verify in Table Editor:
   ```
   https://supabase.com/dashboard/project/ywxwcrmyfovqnquglynh/editor
   ```

   - Should see `contractors` table (3 rows)
   - Should see `availability_slots` table (9 rows)

---

### Method 2: Supabase CLI (If you have CLI installed)

**Best for:** Developers who use Supabase CLI regularly

**Windows (PowerShell):**

```powershell
.\run_migrations.ps1
```

**Mac/Linux (Bash):**

```bash
chmod +x run_migrations.sh
./run_migrations.sh
```

**Manual CLI commands:**

```bash
# Install CLI (if not installed)
npm install -g supabase

# Link to project
supabase link --project-ref ywxwcrmyfovqnquglynh

# Push migrations
supabase db push
```

---

## Verify Migrations

After running migrations, verify everything worked:

```bash
python verify_migrations.py
```

**Expected output:**

```
1. Checking contractors table...
   [OK] contractors table exists (3 rows)
   [OK] Found expected 3 sample contractors
        - John Smith (Water Damage Restoration)
        - Sarah Johnson (Fire Damage Repair)
        - Mike Brown (Mould Remediation)

2. Checking availability_slots table...
   [OK] availability_slots table exists (9 rows)
   [OK] Found expected 9 sample availability slots

3. Verifying Australian formatting...
   [OK] Mobile format correct: 0412 345 678
   [OK] ABN format correct: 12 345 678 901

4. Verifying location data (Brisbane suburbs)...
   [OK] Found Brisbane suburbs: Indooroopilly, Toowong, West End, South Brisbane, Woolloongabba, Brisbane CBD
   [OK] All slots in QLD (Queensland)

[SUCCESS] All migrations applied successfully!
```

---

## What Gets Created

### Tables

**contractors** (3 sample rows)

- John Smith - Water Damage Restoration - 0412 345 678
- Sarah Johnson - Fire Damage Repair - 0423 456 789
- Mike Brown - Mould Remediation - 0434 567 890

**availability_slots** (9 sample rows)

- 3 slots for John Smith (Indooroopilly, Toowong)
- 3 slots for Sarah Johnson (West End, South Brisbane)
- 3 slots for Mike Brown (Woolloongabba, Brisbane CBD)

### Australian Features

✅ **Mobile format**: `04XX XXX XXX` (Australian mobile)
✅ **ABN format**: `XX XXX XXX XXX` (Australian Business Number)
✅ **Date format**: `TIMESTAMPTZ` (AEST timezone, UTC+10)
✅ **States**: Enum with QLD, NSW, VIC, SA, WA, TAS, NT, ACT
✅ **Postcodes**: 4-digit format (e.g., 4068, 4101)
✅ **Brisbane suburbs**: Indooroopilly, Toowong, West End, etc.

### Security (Row Level Security)

✅ **RLS enabled** on both tables
✅ **Public access policies** for development (read, insert, update, delete)
✅ **Ready for production** - policies can be tightened later

### Indexes

✅ **Performance indexes** on:

- `contractors.mobile`
- `contractors.abn`
- `availability_slots.contractor_id`
- `availability_slots.date`
- `availability_slots.suburb, state`
- `availability_slots.status`

---

## After Migrations Complete

Once migrations are successful, run these commands:

### 1. Restart Backend Server

Kill the current backend (if running):

```bash
# Find the process
# Task ID: bac1997 (from previous session)

# Restart with Supabase
cd apps/backend
python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Test Backend API

```bash
# Get all contractors
curl http://localhost:8000/api/contractors/

# Expected: JSON array with 3 contractors from Supabase
```

### 3. Test Frontend

Open browser:

```
http://localhost:3005/demo-live
```

Expected:

- Should display 3 contractors from Supabase
- Australian date format (DD/MM/YYYY)
- Australian mobile format (04XX XXX XXX)
- Brisbane suburbs (Indooroopilly, West End, etc.)

---

## Troubleshooting

### "Table already exists" error

**Cause:** Migrations were already run
**Solution:** Skip to verification step

```bash
python verify_migrations.py
```

### "Permission denied" error

**Cause:** Using anon key instead of service role key
**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` in `apps/backend/.env.local`

### "Could not find table" error

**Cause:** Migrations haven't been run yet
**Solution:** Run migrations using Method 1 or Method 2 above

### No sample data

**Cause:** Only schema migration ran, not sample data
**Solution:** Run `20260106000003_seed_sample_data.sql` separately

---

## Quick Start Checklist

- [ ] Run migrations (Method 1 or Method 2)
- [ ] Verify with `python verify_migrations.py`
- [ ] Restart backend server
- [ ] Test API: `curl http://localhost:8000/api/contractors/`
- [ ] Open frontend: `http://localhost:3005/demo-live`
- [ ] Confirm Australian formatting displays correctly

---

## Support

**Supabase Dashboard:**
https://supabase.com/dashboard/project/ywxwcrmyfovqnquglynh

**Sections:**

- SQL Editor: `/sql`
- Table Editor: `/editor`
- API Docs: `/api`
- Database Settings: `/settings/database`

**Migration Files:**

- Combined: `SETUP_SUPABASE.sql`
- Individual: `supabase/migrations/2026010600000*.sql`
