# Supabase Quick Start Guide

**Time Required:** 10-15 minutes
**Goal:** Get Supabase database running with Australian contractor data

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.12+ installed (with `uv`)
- [ ] Git installed
- [ ] Internet connection

---

## Step 1: Create Supabase Account (3 min)

### 1.1 Sign Up

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with:
   - GitHub (recommended) OR
   - Email address

### 1.2 Create Project

1. Click **"New Project"**
2. Select organization (create if first time)
3. Fill in details:
   ```
   Name: contractor-availability
   Database Password: [Generate & Save!]
   Region: Australia Southeast (ap-southeast-2)
   Plan: Free
   ```
4. Click **"Create new project"**
5. ⏰ Wait 2-3 minutes for provisioning

---

## Step 2: Get Your Credentials (2 min)

### 2.1 Navigate to API Settings

1. In your project dashboard, click **Settings** (⚙️ gear icon bottom left)
2. Click **API** in the sidebar

### 2.2 Copy Your Credentials

You'll see three important values:

**Project URL:**

```
https://xxxxx.supabase.co
```

_Copy this! You'll need it soon._

**API Keys:**

```
anon key (public):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4...

service_role key (secret):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4...
```

_Copy both! Keep these secret._

### 2.3 Save to Notepad

Paste all three values in Notepad/TextEdit - you'll configure them in Step 5.

---

## Step 3: Install Supabase CLI (2 min)

### Windows (PowerShell)

```powershell
npm install -g supabase
```

### macOS/Linux

```bash
npm install -g supabase
```

### Verify Installation

```bash
supabase --version
```

_Should show version number (e.g., 1.142.2)_

---

## Step 4: Link Project & Run Migrations (3 min)

### 4.1 Login to Supabase

```bash
supabase login
```

_This will open a browser - click "Authorize" to continue_

### 4.2 Navigate to Project

```bash
cd "C:\NodeJS-Starter-V1 Upgrade Task List\NodeJS-Starter-V1"
```

### 4.3 Link to Your Supabase Project

Get your **project reference** from the Project URL:

- URL: `https://xxxxx.supabase.co`
- Reference: `xxxxx` (the part before .supabase.co)

```bash
supabase link --project-ref xxxxx
```

_Replace `xxxxx` with your actual project reference_

### 4.4 Push Migrations

```bash
supabase db push
```

**Expected Output:**

```
Applying migration 20260106000001_create_contractors_schema.sql...
Applying migration 20260106000002_add_rls_policies.sql...
Applying migration 20260106000003_seed_sample_data.sql...
Finished supabase db push.
```

✅ **Database is now set up with 3 contractors and 9 availability slots!**

---

## Step 5: Configure Backend (3 min)

### 5.1 Create Environment File

```bash
cd apps/backend
cp .env.example .env.local
```

### 5.2 Edit .env.local

Open `apps/backend/.env.local` in your editor and add your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
ENVIRONMENT=development
DEBUG=true
```

_Replace with YOUR actual credentials from Step 2!_

### 5.3 Install Python Dependencies

```bash
# Still in apps/backend
uv add supabase
uv sync
```

---

## Step 6: Test Everything (3 min)

### 6.1 Verify Database in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **Table Editor** (📊 icon in sidebar)
3. You should see:
   - **contractors** table with 3 rows
   - **availability_slots** table with 9 rows

### 6.2 Start Backend

**Terminal 1:**

```bash
cd apps/backend
uv run uvicorn src.api.main:app --reload
```

_Should show:_

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 6.3 Test API

**Terminal 2:**

```bash
curl http://localhost:8000/api/contractors/
```

**Expected Response:**

```json
{
  "contractors": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Smith",
      "mobile": "0412 345 678",
      "abn": "12 345 678 901",
      ...
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20
}
```

✅ **If you see 3 contractors, database is working!**

### 6.4 Test Frontend

**Terminal 3:**

```bash
cd apps/web
pnpm dev
```

**Browser:**

1. Open **http://localhost:3000/demo-live**
2. You should see a dropdown with 3 contractors
3. Select one - availability calendar should load

✅ **Full-stack integration working!**

---

## Step 7: Run Integration Tests (Optional, 2 min)

```bash
cd apps/backend
uv run pytest tests/test_supabase_integration.py -v
```

**Should see:**

```
test_supabase_client_initialized PASSED
test_database_connection PASSED
test_contractors_table_exists PASSED
test_seed_contractors_exist PASSED
...
========== 25 passed in 3.45s ==========
```

---

## Troubleshooting

### Error: "Supabase credentials not configured"

**Fix:** Check `.env.local` has correct credentials and restart backend

### Error: "Failed to create contractor"

**Fix:** Ensure migrations ran successfully. Re-run `supabase db push`

### Error: "No contractors found"

**Fix:**

1. Go to Supabase → Table Editor
2. Check if `contractors` table has data
3. If empty, re-run migration 3:
   ```bash
   supabase db reset
   supabase db push
   ```

### Error: "Connection refused"

**Fix:** Make sure Supabase project is active (not paused due to inactivity)

---

## Verification Checklist

- [ ] Supabase project created
- [ ] Migrations pushed successfully
- [ ] `.env.local` configured with credentials
- [ ] Backend starts without errors
- [ ] API returns 3 contractors
- [ ] Frontend shows contractor dropdown
- [ ] Can select contractor and see availability

---

## What You Just Set Up

✅ **PostgreSQL Database** with Australian schema
✅ **3 Contractors** (John, Sarah, Mike) with Australian mobile/ABN
✅ **9 Availability Slots** across Brisbane suburbs
✅ **Backend API** connected to Supabase
✅ **Frontend UI** loading real database data

---

## Next Steps

Now that Supabase is set up, you can:

1. **Add More Contractors:**

   ```bash
   curl -X POST http://localhost:8000/api/contractors/ \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Your Name",
       "mobile": "0412 345 678",
       "specialisation": "Your Specialty"
     }'
   ```

2. **View API Docs:**
   - Open http://localhost:8000/docs
   - Interactive Swagger UI with all endpoints

3. **Explore Database:**
   - Supabase Dashboard → Table Editor
   - SQL Editor for custom queries

4. **Deploy to Production:**
   - See SUPABASE-SETUP.md for production checklist

---

## Quick Reference

**Start Backend:**

```bash
cd apps/backend && uv run uvicorn src.api.main:app --reload
```

**Start Frontend:**

```bash
cd apps/web && pnpm dev
```

**View Database:**

- https://supabase.com/dashboard → Your Project → Table Editor

**API Docs:**

- http://localhost:8000/docs

**Frontend Demo:**

- http://localhost:3000/demo-live

---

🎉 **Congratulations! Your Australian-first contractor database is live!**

🦘 Brisbane contractors ready • Database persistent • Full-stack working
