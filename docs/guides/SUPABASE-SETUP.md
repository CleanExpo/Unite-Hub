# Supabase Database Setup Guide

**Last Updated:** 06/01/2026
**Integration:** Contractor Availability with Australian Context

---

## Overview

This guide walks through setting up Supabase as the database backend for the Contractor Availability system, replacing in-memory storage with persistent PostgreSQL.

---

## Prerequisites

- Supabase account (free tier available)
- Node.js 18+ (for Supabase CLI)
- Python 3.12+ (for backend)
- Git (for version control)

---

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project

1. Click "New Project"
2. Select organization (or create one)
3. Configure project:
   - **Name:** `contractor-availability` (or your choice)
   - **Database Password:** Generate strong password (save this!)
   - **Region:** Select closest to Brisbane/Sydney (Australia Southeast recommended)
   - **Pricing Plan:** Free tier is sufficient for development

4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

---

## Step 2: Get Project Credentials

### 2.1 Find Project Settings

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in sidebar
3. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API keys:**
     - `anon` `public` (for frontend/backend public access)
     - `service_role` (for backend admin operations)

### 2.2 Copy Credentials

Copy these three values (you'll need them soon):

```bash
# Project URL
https://xxxxx.supabase.co

# Anon Key (public)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg4...

# Service Role Key (admin)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3ODg...
```

---

## Step 3: Run Database Migrations

### 3.1 Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm (all platforms)
npm install -g supabase
```

### 3.2 Login to Supabase

```bash
supabase login
```

This will open a browser for authentication.

### 3.3 Link Local Project to Supabase

```bash
cd "C:\NodeJS-Starter-V1 Upgrade Task List\NodeJS-Starter-V1"
supabase link --project-ref xxxxx
```

Replace `xxxxx` with your project reference (from Project URL: `https://xxxxx.supabase.co`)

### 3.4 Run Migrations

```bash
# Apply all migrations to your Supabase project
supabase db push

# This will execute:
# 1. 20260106000001_create_contractors_schema.sql
# 2. 20260106000002_add_rls_policies.sql
# 3. 20260106000003_seed_sample_data.sql
```

**Expected Output:**

```
Applying migration 20260106000001_create_contractors_schema.sql...
Applying migration 20260106000002_add_rls_policies.sql...
Applying migration 20260106000003_seed_sample_data.sql...
Finished supabase db push.
```

### 3.5 Verify Schema

1. Go to Supabase dashboard
2. Click **Table Editor**
3. You should see:
   - `contractors` table (3 sample rows)
   - `availability_slots` table (9 sample rows)

---

## Step 4: Configure Backend Environment

### 4.1 Create .env.local

```bash
cd apps/backend
cp .env.example .env.local
```

### 4.2 Add Supabase Credentials

Edit `apps/backend/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
ENVIRONMENT=development
DEBUG=true
```

Replace with your actual credentials from Step 2.

### 4.3 Install Python Dependencies

```bash
cd apps/backend

# Add supabase-py to dependencies
uv add supabase

# Sync dependencies
uv sync
```

---

## Step 5: Test Database Connection

### 5.1 Start Backend

```bash
cd apps/backend
uv run uvicorn src.api.main:app --reload
```

### 5.2 Test API Endpoints

**List Contractors:**

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
      "email": "john@example.com.au",
      "specialisation": "Water Damage Restoration",
      "created_at": "2026-01-06T09:00:00+10:00",
      "updated_at": "2026-01-06T09:00:00+10:00",
      "availability_slots": [...]
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20
}
```

**Get Specific Contractor:**

```bash
curl http://localhost:8000/api/contractors/550e8400-e29b-41d4-a716-446655440001
```

### 5.3 Test Frontend Integration

```bash
# Terminal 1: Backend (already running)
cd apps/backend
uv run uvicorn src.api.main:app --reload

# Terminal 2: Frontend
cd apps/web
pnpm dev
```

**Open:** http://localhost:3000/demo-live

You should see 3 contractors loaded from Supabase database!

---

## Step 6: Verify Australian Context

### 6.1 Check Database Constraints

In Supabase dashboard, go to **SQL Editor** and run:

```sql
-- Verify Australian mobile format constraint
SELECT mobile, name FROM contractors;
-- All should be: 04XX XXX XXX

-- Verify ABN format constraint
SELECT abn, name FROM contractors WHERE abn IS NOT NULL;
-- All should be: XX XXX XXX XXX

-- Verify Australian states
SELECT DISTINCT state FROM availability_slots;
-- Should see: QLD (default for Brisbane)

-- Verify Brisbane suburbs
SELECT DISTINCT suburb, state FROM availability_slots ORDER BY suburb;
-- Should see: Brisbane CBD, Indooroopilly, South Brisbane, Toowong, West End, Woolloongabba
```

### 6.2 Test Australian Validation

**Try Invalid Mobile (should fail):**

```bash
curl -X POST http://localhost:8000/api/contractors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "mobile": "1234567890"
  }'
```

**Expected:** 422 Validation Error

**Try Valid Australian Mobile (should succeed):**

```bash
curl -X POST http://localhost:8000/api/contractors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "mobile": "0498 765 432",
    "specialisation": "Emergency Restoration"
  }'
```

**Expected:** 201 Created

---

## Database Schema

### Tables

#### `contractors`

- `id` UUID (primary key)
- `name` VARCHAR(100)
- `mobile` VARCHAR(20) - Format: `04XX XXX XXX`
- `abn` VARCHAR(20) - Format: `XX XXX XXX XXX`
- `email` VARCHAR(255)
- `specialisation` VARCHAR(255)
- `created_at` TIMESTAMPTZ (AEST)
- `updated_at` TIMESTAMPTZ (AEST)

**Constraints:**

- Mobile: Must match `^04\d{2} \d{3} \d{3}$`
- ABN: Must match `^\d{2} \d{3} \d{3} \d{3}$` (optional)
- Email: Valid email format (optional)

#### `availability_slots`

- `id` UUID (primary key)
- `contractor_id` UUID (foreign key → contractors)
- `date` TIMESTAMPTZ (AEST timezone)
- `start_time` TIME (24-hour)
- `end_time` TIME (24-hour)
- `suburb` VARCHAR(100) - Brisbane suburb
- `state` australian_state ENUM (default: QLD)
- `postcode` VARCHAR(4) - 4-digit Australian postcode
- `status` availability_status ENUM
- `notes` TEXT
- `created_at` TIMESTAMPTZ

**Constraints:**

- `end_time > start_time`
- Postcode: Must match `^\d{4}$` (optional)
- ON DELETE CASCADE (deleting contractor deletes slots)

### Enums

**australian_state:**

- QLD (Queensland - default)
- NSW, VIC, SA, WA, TAS, NT, ACT

**availability_status:**

- available (default)
- booked
- tentative
- unavailable

---

## Sample Data

The seed migration creates **3 contractors** with **9 availability slots** in Brisbane suburbs:

**Contractors:**

1. John Smith - Water Damage Restoration (Indooroopilly, Toowong)
2. Sarah Johnson - Fire Damage Repair (West End, South Brisbane)
3. Mike Brown - Mould Remediation (Woolloongabba, Brisbane CBD)

**Brisbane Suburbs:**

- Indooroopilly (QLD 4068)
- Toowong (QLD 4066)
- West End (QLD 4101)
- South Brisbane (QLD 4101)
- Woolloongabba (QLD 4102)
- Brisbane CBD (QLD 4000)

---

## Troubleshooting

### Issue: "Supabase credentials not configured"

**Solution:**

1. Check `.env.local` exists in `apps/backend/`
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
4. Restart backend server

### Issue: "Failed to create contractor"

**Solution:**

1. Check database constraints (mobile format, ABN format)
2. Verify RLS policies are enabled
3. Check Supabase dashboard → Table Editor for errors

### Issue: "No contractors found"

**Solution:**

1. Verify migrations ran successfully: `supabase db push`
2. Check seed data: Go to Supabase → Table Editor → contractors
3. Run seed migration again if needed

### Issue: "Connection refused"

**Solution:**

1. Verify Supabase project is active (not paused)
2. Check Project URL is correct
3. Verify API keys are valid (not expired)

---

## Production Deployment

### 1. Environment Variables

Set these in your hosting platform (Vercel, Railway, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENVIRONMENT=production
DEBUG=false
```

### 2. Update RLS Policies

Replace public access policies with authenticated policies:

```sql
-- Replace in Supabase SQL Editor
DROP POLICY "Allow public insert contractors" ON contractors;
DROP POLICY "Allow public update contractors" ON contractors;
DROP POLICY "Allow public delete contractors" ON contractors;

-- Add authenticated policies
CREATE POLICY "Authenticated users can insert contractors"
  ON contractors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Contractors can update own records"
  ON contractors FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 3. Enable Database Backups

1. Go to Supabase dashboard → **Database** → **Backups**
2. Enable automatic daily backups
3. Configure retention period (7 days recommended)

---

## Architecture Benefits

✅ **Persistent Storage** - Data survives server restarts
✅ **Australian Validation** - Database-level constraints for ABN/mobile
✅ **AEST Timezone** - All timestamps in Australian Eastern Time
✅ **Brisbane Focus** - QLD default, Brisbane suburbs prioritized
✅ **Type Safety** - Enums for states and statuses
✅ **Referential Integrity** - CASCADE deletes maintain consistency
✅ **Row Level Security** - Fine-grained access control
✅ **Real-time Ready** - Supabase supports real-time subscriptions

---

🦘 **Australian-first. Production-ready. Supabase-powered.**

_Generated by Unite-Group AI Architecture_
