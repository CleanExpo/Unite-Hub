# 📋 CRM Database Setup - Step-by-Step Guide

## 🚀 Quick Overview
You'll run 4 SQL scripts in order. Each takes about 1-2 minutes. Total time: 10 minutes.

---

## 📍 Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query** button (usually a + icon)

---

## 🔧 Step 2: Run Base CRM Tables Script

### 2.1 Copy the Script
1. Open this file in VS Code: `database/setup-crm-complete.sql`
2. Select all content (Ctrl+A)
3. Copy it (Ctrl+C)

### 2.2 Run in Supabase
1. Paste into Supabase SQL Editor
2. Click **Run** button
3. Wait for success message: "CRM SETUP COMPLETE!"
4. You should see: "Tables created: 7"

**✅ Expected Result:** 7 tables created with indexes and policies

---

## 🎯 Step 3: Run Views & Fixes Script

### 3.1 Create New Query Tab
1. Click **New query** again (don't overwrite the first one)

### 3.2 Copy and Run
1. Open: `database/setup-crm-views-and-fixes.sql`
2. Copy all content
3. Paste into new query tab
4. Click **Run**
5. Wait for success message

**✅ Expected Result:** 
- "Views created successfully"
- Some sample data counts

---

## 📝 Step 4: Run Consultations Table Script

### 4.1 Create Another New Query Tab
1. Click **New query** again

### 4.2 Copy and Run
1. Open: `database/setup-consultations-table.sql`
2. Copy all content
3. Paste into new query tab
4. Click **Run**

**✅ Expected Result:** 
- "Consultations table created"
- "Sample data count: 3"

---

## 🔐 Step 5: Fix Profile Permissions

### 5.1 Create Final Query Tab
1. Click **New query** one more time

### 5.2 Copy and Run This SQL:
```sql
-- Fix profiles table RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create working policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow anonymous profile checks
CREATE POLICY "Allow anonymous profile existence check" ON profiles
    FOR SELECT USING (true);

-- Verify
SELECT 'Profile permissions fixed!' as status;
```

**✅ Expected Result:** "Profile permissions fixed!"

---

## ✨ Step 6: Verify Everything Works

### Quick Check Query
Run this to verify all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'clients', 'projects', 'deals', 'tasks', 
  'interactions', 'pipelines', 'pipeline_stages', 
  'consultations'
)
ORDER BY table_name;
```

**✅ Expected Result:** 8 rows showing all table names

---

## 🎉 Done! What Happens Next?

Once you've run all 4 scripts:
1. **Errors should stop immediately** - The database now exists!
2. **No deployment needed** - Database changes are instant
3. **Test your app** - Refresh your website and check the console

---

## 🚨 Troubleshooting

### If you see "relation already exists":
- That's OK! It means the table was already created
- Continue to the next script

### If you see permission errors:
- Make sure you're logged into Supabase
- Check you're in the right project

### If scripts fail:
- Try running them one section at a time
- Check for typos if you modified anything

---

## 📊 What You Just Created:

- **8 Tables:** clients, projects, deals, tasks, interactions, pipelines, pipeline_stages, consultations
- **2 Views:** deals_with_stages, activities  
- **Sample Data:** Test clients, deals, tasks, and consultations
- **Security:** RLS policies on all tables
- **Performance:** Indexes on key fields

---

**Need help?** Let me know which step you're on and any error messages!
